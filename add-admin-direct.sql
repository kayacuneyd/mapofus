-- Add admin user directly (use this if you know the user_id)
-- Replace the user_id below with your actual user ID: 44b48853-1aeb-4bd7-b162-3cd4aaefb2fe

INSERT INTO public.admin_users (user_id, role, granted_at)
VALUES ('44b48853-1aeb-4bd7-b162-3cd4aaefb2fe', 'admin', NOW())
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', granted_at = NOW();

-- Verify the admin was added
SELECT * FROM public.admin_users WHERE user_id = '44b48853-1aeb-4bd7-b162-3cd4aaefb2fe';

