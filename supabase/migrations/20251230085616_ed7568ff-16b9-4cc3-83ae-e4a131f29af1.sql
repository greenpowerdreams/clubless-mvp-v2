-- Add UPDATE and DELETE policies to email_logs to make them immutable
-- This preserves audit trail integrity

-- Prevent all updates (email logs should be immutable audit records)
CREATE POLICY "Email logs are immutable"
ON public.email_logs
FOR UPDATE
USING (false);

-- Prevent all deletions (maintain audit trail)
CREATE POLICY "Email logs cannot be deleted"
ON public.email_logs
FOR DELETE
USING (false);