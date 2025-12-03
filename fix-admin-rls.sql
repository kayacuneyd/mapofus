-- Fix RLS Policy for admin_users table
-- This allows users to check their own admin status
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
-- - Users can check if they themselves are admins (single policy)
-- - The "Admins can view admin list" policy was removed because it caused infinite recursion
--   (it tried to check admin_users table to allow access to admin_users table)
-- - If you need to view all admins, use the service role key or create a separate table

