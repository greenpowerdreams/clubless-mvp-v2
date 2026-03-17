-- Add completed_at column to event_proposals
ALTER TABLE public.event_proposals ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Create error_logs table for admin visibility
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  user_email text,
  user_id uuid,
  error_message text,
  details jsonb,
  resolved boolean DEFAULT false
);

-- Enable RLS on error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read error logs
CREATE POLICY "Admins can read error logs" ON public.error_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update error logs (mark as resolved)
CREATE POLICY "Admins can update error logs" ON public.error_logs
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions to insert error logs (using service role)
CREATE POLICY "Service role can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);