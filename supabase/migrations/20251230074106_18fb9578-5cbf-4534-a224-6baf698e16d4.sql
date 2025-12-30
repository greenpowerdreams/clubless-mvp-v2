-- Fix get_proposal_status function to use correct column names
CREATE OR REPLACE FUNCTION public.get_proposal_status(lookup_email text)
RETURNS TABLE(
  id uuid,
  status text,
  eventbrite_status text,
  eventbrite_url text,
  city text,
  preferred_date text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    id,
    status,
    eventbrite_status,
    eventbrite_url,
    city,
    preferred_event_date as preferred_date,
    created_at
  FROM public.event_proposals
  WHERE LOWER(submitter_email) = LOWER(lookup_email)
$$;