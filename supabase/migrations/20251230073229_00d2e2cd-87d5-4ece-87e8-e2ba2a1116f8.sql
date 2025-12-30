-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit proposals" ON public.event_proposals;

-- Create a new INSERT policy that requires authentication
CREATE POLICY "Authenticated users can submit proposals" 
ON public.event_proposals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);