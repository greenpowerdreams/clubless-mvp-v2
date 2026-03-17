-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view proposals for status lookup" ON public.event_proposals;

-- Create a view that only exposes non-sensitive fields for status lookup
CREATE OR REPLACE VIEW public.proposal_status AS
SELECT 
  id,
  email,
  status,
  eventbrite_status,
  eventbrite_url,
  city,
  preferred_date,
  created_at
FROM public.event_proposals;

-- Grant access to the view
GRANT SELECT ON public.proposal_status TO anon, authenticated;