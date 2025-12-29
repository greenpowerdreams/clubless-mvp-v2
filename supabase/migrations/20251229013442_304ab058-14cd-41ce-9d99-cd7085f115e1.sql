-- Add database constraints for input validation on event_proposals

-- Validate email format
ALTER TABLE public.event_proposals 
ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Limit field lengths to prevent abuse
ALTER TABLE public.event_proposals 
ADD CONSTRAINT name_length CHECK (length(name) <= 200);

ALTER TABLE public.event_proposals 
ADD CONSTRAINT email_length CHECK (length(email) <= 255);

ALTER TABLE public.event_proposals 
ADD CONSTRAINT city_length CHECK (length(city) <= 100);

ALTER TABLE public.event_proposals 
ADD CONSTRAINT event_concept_length CHECK (length(event_concept) <= 5000);

ALTER TABLE public.event_proposals 
ADD CONSTRAINT preferred_date_length CHECK (length(preferred_date) <= 100);

ALTER TABLE public.event_proposals 
ADD CONSTRAINT instagram_handle_length CHECK (instagram_handle IS NULL OR length(instagram_handle) <= 50);

ALTER TABLE public.event_proposals 
ADD CONSTRAINT fee_model_valid CHECK (fee_model IN ('percentage', 'flat_fee', 'hybrid'));