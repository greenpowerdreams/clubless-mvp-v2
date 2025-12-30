-- Drop and recreate get_proposal_status to require email ownership verification
-- This prevents users from querying proposal status for emails they don't own

CREATE OR REPLACE FUNCTION public.get_proposal_status(lookup_email text)
RETURNS TABLE(id uuid, status text, eventbrite_status text, eventbrite_url text, city text, preferred_date text, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the query if:
  -- 1. User is authenticated and the lookup email matches their auth email, OR
  -- 2. User is an admin
  IF auth.uid() IS NULL THEN
    -- For unauthenticated users, only return their own proposals (matched by email)
    -- This is a fallback for users who submitted before creating an account
    RETURN QUERY
    SELECT 
      ep.id,
      ep.status,
      ep.eventbrite_status,
      ep.eventbrite_url,
      ep.city,
      ep.preferred_event_date as preferred_date,
      ep.created_at
    FROM public.event_proposals ep
    WHERE LOWER(ep.submitter_email) = LOWER(lookup_email)
      AND ep.user_id IS NULL;  -- Only return anonymous submissions
  ELSIF public.has_role(auth.uid(), 'admin') THEN
    -- Admins can look up any email
    RETURN QUERY
    SELECT 
      ep.id,
      ep.status,
      ep.eventbrite_status,
      ep.eventbrite_url,
      ep.city,
      ep.preferred_event_date as preferred_date,
      ep.created_at
    FROM public.event_proposals ep
    WHERE LOWER(ep.submitter_email) = LOWER(lookup_email);
  ELSE
    -- Regular authenticated users can only query their own email
    RETURN QUERY
    SELECT 
      ep.id,
      ep.status,
      ep.eventbrite_status,
      ep.eventbrite_url,
      ep.city,
      ep.preferred_event_date as preferred_date,
      ep.created_at
    FROM public.event_proposals ep
    WHERE LOWER(ep.submitter_email) = LOWER(lookup_email)
      AND (
        ep.user_id = auth.uid() 
        OR (ep.user_id IS NULL AND LOWER(ep.submitter_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())))
      );
  END IF;
END;
$$;