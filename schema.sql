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
