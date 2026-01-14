-- Fix the failed migration: Drop the correct policy name
-- The policy "Users can view all profiles" (USING true) is still active and allows public access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- The policy "Users can view their own profile" already exists from the failed migration
-- We just need to add admin access policy for the admin dashboard to work

-- Allow admins to view all profiles (for admin dashboard functionality)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Security model after this fix:
-- 1. Users can only see their own profile (via existing "Users can view their own profile" policy)
-- 2. Admins can see all profiles for management (via new "Admins can view all profiles" policy)
-- 3. Public/unauthenticated access is blocked