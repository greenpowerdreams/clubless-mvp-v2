-- Fix security issues found in QA audit

-- 1. Fix profiles table - restrict SELECT to own profile only (users shouldn't see other's phone/city)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Fix email_logs INSERT policy - should only allow service role (edge functions)
DROP POLICY IF EXISTS "Allow inserts from service role" ON public.email_logs;
DROP POLICY IF EXISTS "Allow insert for email logs" ON public.email_logs;
-- Note: Service role bypasses RLS anyway, so we just remove permissive INSERT policy
-- Email logs should only be written by edge functions using service role key

-- 3. Restrict platform_config to admin-only read (sensitive business pricing)
DROP POLICY IF EXISTS "Anyone can read platform config" ON public.platform_config;
DROP POLICY IF EXISTS "Platform config is publicly readable" ON public.platform_config;
CREATE POLICY "Only admins can read platform config" 
ON public.platform_config 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);