-- ============================================
-- APP SETTINGS TABLE
-- ============================================
-- Stores application-wide settings like image provider preference

CREATE TABLE IF NOT EXISTS public.app_settings (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'main',
  image_provider VARCHAR(50) DEFAULT 'openai' CHECK (image_provider IN ('openai', 'replicate')),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default setting if not exists
INSERT INTO public.app_settings (id, image_provider)
VALUES ('main', 'openai')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view and update settings
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

-- Policy: Authenticated users can read settings (for frontend display)
DROP POLICY IF EXISTS "Users can read app settings" ON public.app_settings;
CREATE POLICY "Users can read app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

