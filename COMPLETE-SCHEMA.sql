-- ============================================
-- TAM VERİTABANI ŞEMASI (GÜNCELLENMIŞ)
-- ============================================
-- Bu dosya schema.sql'in tamamını içerir + RLS düzeltmesi + sizi admin olarak ekler
-- Güvenli: IF NOT EXISTS ve IF EXISTS kullanıldığı için mevcut veriler korunur
-- İsterseniz bu dosyayı çalıştırabilirsiniz (FIX-NOW.sql yerine)

-- Users table (managed by Supabase Auth, extend if needed)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maps table
CREATE TABLE IF NOT EXISTS public.maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_text TEXT NOT NULL,
  story_metadata JSONB,
  ai_prompt TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  hd_image_url TEXT NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  ruul_payment_id VARCHAR(255),
  ruul_payment_data JSONB,
  coupon_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for maps
CREATE INDEX IF NOT EXISTS idx_maps_user_id ON public.maps(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_payment_status ON public.maps(payment_status);
CREATE INDEX IF NOT EXISTS idx_maps_created_at ON public.maps(created_at DESC);

-- Enable RLS on maps
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- Maps policies
DROP POLICY IF EXISTS "Users can view own maps" ON public.maps;
CREATE POLICY "Users can view own maps"
  ON public.maps FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own maps" ON public.maps;
CREATE POLICY "Users can insert own maps"
  ON public.maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add new columns to maps table
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
ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100);

-- Migrate existing data
UPDATE public.maps
SET order_status = CASE
  WHEN payment_status = 'completed' THEN 'ready_for_download'
  WHEN payment_status = 'failed' THEN 'payment_rejected'
  ELSE 'pending'
END
WHERE order_status = 'pending';

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_maps_order_status ON public.maps(order_status);
CREATE INDEX IF NOT EXISTS idx_maps_invoice_number ON public.maps(invoice_number);
CREATE INDEX IF NOT EXISTS idx_maps_invoice_submitted_at ON public.maps(invoice_submitted_at DESC);
-- Index for coupon_code (created after column is added above)
CREATE INDEX IF NOT EXISTS idx_maps_coupon_code ON public.maps(coupon_code);

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Maps admin policies
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

-- Admin users RLS policy (FIXED - no infinite recursion)
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Coupons table
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

DROP POLICY IF EXISTS "Users can read coupons" ON public.coupons;
CREATE POLICY "Users can read coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

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

-- Add yourself as admin
INSERT INTO public.admin_users (user_id, role, granted_at)
VALUES ('44b48853-1aeb-4bd7-b162-3cd4aaefb2fe', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', granted_at = NOW();

-- Verify
SELECT * FROM public.admin_users WHERE user_id = '44b48853-1aeb-4bd7-b162-3cd4aaefb2fe';

