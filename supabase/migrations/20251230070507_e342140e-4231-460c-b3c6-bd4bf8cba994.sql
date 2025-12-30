-- Drop existing SELECT policies that may not be working correctly
DROP POLICY IF EXISTS "Admins can read all proposals" ON public.event_proposals;
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.event_proposals;

-- Create proper PERMISSIVE SELECT policies
-- Admins can read all proposals
CREATE POLICY "Admins can read all proposals"
ON public.event_proposals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can only view their own proposals (by user_id match)
CREATE POLICY "Users can view their own proposals"
ON public.event_proposals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);