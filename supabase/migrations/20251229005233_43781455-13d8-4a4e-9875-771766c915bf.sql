-- Add Eventbrite fields to event_proposals
ALTER TABLE public.event_proposals
ADD COLUMN eventbrite_url TEXT,
ADD COLUMN eventbrite_status TEXT DEFAULT 'not_published';