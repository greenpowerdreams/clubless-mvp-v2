-- Fix email_logs RLS policies - convert from RESTRICTIVE to PERMISSIVE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can read email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Email logs are immutable" ON public.email_logs;
DROP POLICY IF EXISTS "Email logs cannot be deleted" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

-- Recreate as PERMISSIVE policies (the default and correct way to grant access)
-- Only admins can SELECT email logs
CREATE POLICY "Admins can read email logs"
ON public.email_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No one can update (immutable audit log)
-- Note: We don't create an UPDATE policy, so no one can update

-- No one can delete
-- Note: We don't create a DELETE policy, so no one can delete

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix event_proposals RLS policies - convert from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can delete proposals" ON public.event_proposals;
DROP POLICY IF EXISTS "Admins can read all proposals" ON public.event_proposals;
DROP POLICY IF EXISTS "Admins can update proposals" ON public.event_proposals;
DROP POLICY IF EXISTS "Authenticated users can submit their own proposals" ON public.event_proposals;
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.event_proposals;

-- Recreate as PERMISSIVE policies
-- Users can view their own proposals
CREATE POLICY "Users can view their own proposals"
ON public.event_proposals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all proposals
CREATE POLICY "Admins can read all proposals"
ON public.event_proposals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can submit proposals
CREATE POLICY "Authenticated users can submit proposals"
ON public.event_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id IS NULL) OR (user_id = auth.uid())
);

-- Admins can update proposals
CREATE POLICY "Admins can update proposals"
ON public.event_proposals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete proposals
CREATE POLICY "Admins can delete proposals"
ON public.event_proposals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));