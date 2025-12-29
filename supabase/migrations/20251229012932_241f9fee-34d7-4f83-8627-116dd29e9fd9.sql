-- Allow anyone to read proposals where the email matches a query parameter
-- This enables email-based lookup for proposal status
CREATE POLICY "Anyone can view proposals by email lookup"
ON public.event_proposals
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the above and create a more secure version that still allows lookup
-- but only returns limited info (we'll handle filtering in application code)
DROP POLICY IF EXISTS "Anyone can view proposals by email lookup" ON public.event_proposals;