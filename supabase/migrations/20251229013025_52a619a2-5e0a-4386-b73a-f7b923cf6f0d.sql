-- Allow public to read proposals (filtering by email will be done in application)
-- This is less secure but allows email-based status lookup as requested
CREATE POLICY "Public can view proposals for status lookup"
ON public.event_proposals
FOR SELECT
TO anon, authenticated
USING (true);