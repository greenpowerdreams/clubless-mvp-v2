-- Drop the view approach
DROP VIEW IF EXISTS public.proposal_status;

-- Create a secure function that only returns proposals for a specific email
-- This prevents enumeration of all proposals
CREATE OR REPLACE FUNCTION public.get_proposal_status(lookup_email text)
RETURNS TABLE (
  id uuid,
  status text,
  eventbrite_status text,
  eventbrite_url text,
  city text,
  preferred_date text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT 
    id,
    status,
    eventbrite_status,
    eventbrite_url,
    city,
    preferred_date,
    created_at
  FROM public.event_proposals
  WHERE LOWER(email) = LOWER(lookup_email)
$$;

-- Grant execute to public
GRANT EXECUTE ON FUNCTION public.get_proposal_status(text) TO anon, authenticated;