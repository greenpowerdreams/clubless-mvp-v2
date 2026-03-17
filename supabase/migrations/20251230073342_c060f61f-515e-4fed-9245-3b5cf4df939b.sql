-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can submit proposals" ON public.event_proposals;

-- Create a stricter INSERT policy that requires user_id to match auth.uid()
CREATE POLICY "Authenticated users can submit their own proposals" 
ON public.event_proposals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));