-- Create email_logs table for tracking all email attempts
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  to_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'attempted',
  provider_message_id TEXT,
  error TEXT,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can read email logs"
ON public.email_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Edge functions can insert logs (service role)
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);