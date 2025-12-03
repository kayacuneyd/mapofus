-- ============================================
-- ŞU AN ÇALIŞTIRMANIZ GEREKEN TEK SQL DOSYASI
-- ============================================
-- Bu dosya hem RLS politikasını düzeltir hem de sizi admin olarak ekler
-- Supabase SQL Editor'da bu dosyanın içeriğini çalıştırın

-- Step 1: Fix RLS Policy (infinite recursion sorununu çözer)
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
CREATE POLICY "Users can check own admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 2: Add yourself as admin
INSERT INTO public.admin_users (user_id, role, granted_at)
VALUES ('44b48853-1aeb-4bd7-b162-3cd4aaefb2fe', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', granted_at = NOW();

-- Step 3: Verify (kontrol)
SELECT * FROM public.admin_users WHERE user_id = '44b48853-1aeb-4bd7-b162-3cd4aaefb2fe';

-- Başarılı olduysa, kendi kaydınızı görmelisiniz!

