-- Drop the old constraint and add new one matching the form values
ALTER TABLE public.event_proposals DROP CONSTRAINT IF EXISTS fee_model_valid;

ALTER TABLE public.event_proposals ADD CONSTRAINT fee_model_valid 
CHECK (fee_model = ANY (ARRAY['service-fee'::text, 'profit-share'::text]));