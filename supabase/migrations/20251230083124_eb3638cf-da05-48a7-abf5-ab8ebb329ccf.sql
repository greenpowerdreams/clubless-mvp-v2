-- Add tracking columns to email_logs
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS tracking_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;

-- Create index for tracking lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking_id ON public.email_logs(tracking_id);