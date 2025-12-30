-- Update get_proposal_status with input validation
CREATE OR REPLACE FUNCTION public.get_proposal_status(lookup_email text)
RETURNS TABLE(id uuid, status text, eventbrite_status text, eventbrite_url text, city text, preferred_date text, created_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate email format and length
  IF lookup_email IS NULL 
     OR LENGTH(lookup_email) < 5
     OR LENGTH(lookup_email) > 255 
     OR lookup_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Allow the query based on authentication status
  IF auth.uid() IS NULL THEN
    -- For unauthenticated users, only return anonymous submissions
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
      AND ep.user_id IS NULL;
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