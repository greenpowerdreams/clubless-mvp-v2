-- Add new columns to event_proposals
ALTER TABLE public.event_proposals 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status_updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS status_notes text,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS projected_revenue numeric,
ADD COLUMN IF NOT EXISTS projected_costs numeric,
ADD COLUMN IF NOT EXISTS projected_profit numeric;

-- Rename columns for clarity (only if they exist with old names)
ALTER TABLE public.event_proposals RENAME COLUMN name TO submitter_name;
ALTER TABLE public.event_proposals RENAME COLUMN email TO submitter_email;
ALTER TABLE public.event_proposals RENAME COLUMN preferred_date TO preferred_event_date;
ALTER TABLE public.event_proposals RENAME COLUMN profit_summary TO full_calculator_json;

-- Update default status value
ALTER TABLE public.event_proposals ALTER COLUMN status SET DEFAULT 'submitted';

-- Create trigger to update status_updated_at when status changes
CREATE OR REPLACE FUNCTION public.update_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_proposal_status_timestamp
BEFORE UPDATE ON public.event_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_status_timestamp();

-- Add RLS policy for users to read their own proposals
CREATE POLICY "Users can view their own proposals"
ON public.event_proposals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_event_proposals_user_id ON public.event_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_event_proposals_submitter_email ON public.event_proposals(submitter_email);