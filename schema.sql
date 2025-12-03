-- Users table (managed by Supabase Auth, extend if needed)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maps table
CREATE TABLE public.maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_text TEXT NOT NULL,
  story_metadata JSONB, -- Optional: store theme, date range, locations
  ai_prompt TEXT NOT NULL, -- The prompt sent to Imagen
  thumbnail_url TEXT NOT NULL, -- Low-res preview URL (Supabase Storage)
  hd_image_url TEXT NOT NULL, -- HD version URL (Supabase Storage)
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  ruul_payment_id VARCHAR(255), -- Ruul.io transaction ID
  ruul_payment_data JSONB, -- Store full webhook payload
  coupon_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maps_user_id ON public.maps(user_id);
CREATE INDEX idx_maps_payment_status ON public.maps(payment_status);
CREATE INDEX idx_maps_created_at ON public.maps(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own maps
CREATE POLICY "Users can view own maps"
  ON public.maps FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own maps
CREATE POLICY "Users can insert own maps"
  ON public.maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role (admin) can do everything
-- (Supabase service role bypasses RLS by default, but good to be explicit if needed)

-- ============================================
-- MIGRATION: New Payment Flow & Admin System
-- ============================================

-- Step 1: Add new columns to maps table
ALTER TABLE public.maps
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS invoice_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending'
  CHECK (order_status IN (
    'pending',
    'invoice_submitted',
    'payment_verifying',
    'payment_confirmed',
    'ready_for_download',
    'completed',
    'payment_rejected',
    'cancelled'
  )),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMP;

-- Step 2: Migrate existing data
UPDATE public.maps
SET order_status = CASE
  WHEN payment_status = 'completed' THEN 'ready_for_download'
  WHEN payment_status = 'failed' THEN 'payment_rejected'
  ELSE 'pending'
END
WHERE order_status = 'pending';

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_maps_order_status ON public.maps(order_status);
CREATE INDEX IF NOT EXISTS idx_maps_invoice_number ON public.maps(invoice_number);
CREATE INDEX IF NOT EXISTS idx_maps_invoice_submitted_at ON public.maps(invoice_submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_maps_coupon_code ON public.maps(coupon_code);

-- Step 4: Create admin_users table for role management
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- App settings table (image provider and payment link)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'main',
  image_provider VARCHAR(50) DEFAULT 'openai' CHECK (image_provider IN ('openai', 'replicate')),
  ruul_payment_link TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO public.app_settings (id, image_provider)
VALUES ('main', 'openai')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can read app settings" ON public.app_settings;
CREATE POLICY "Users can read app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Update RLS policies for admin access
DROP POLICY IF EXISTS "Admins can view all maps" ON public.maps;
CREATE POLICY "Admins can view all maps"
  ON public.maps FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update maps" ON public.maps;
CREATE POLICY "Admins can update maps"
  ON public.maps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- Allow users to check their own admin status (required for admin check to work)
-- IMPORTANT: Removed "Admins can view admin list" policy to avoid infinite recursion

-- Remove the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;

-- Allow users to check their own admin status (this is all we need)
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- NOTES:
-- 1. payment_status column is kept for backward compatibility
-- 2. ruul_payment_id and ruul_payment_data are deprecated but kept for historical data
-- 3. To add an admin user, insert into admin_users table or use the setup-admin.js script

-- ============================================
-- Coupons
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
  code VARCHAR(100) PRIMARY KEY,
  description TEXT,
  discount_percent INT CHECK (discount_percent >= 0 AND discount_percent <= 100),
  max_uses INT,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active coupons
DROP POLICY IF EXISTS "Users can read coupons" ON public.coupons;
CREATE POLICY "Users can read coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Admins can manage coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
