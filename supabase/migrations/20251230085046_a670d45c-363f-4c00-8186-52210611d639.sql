-- Add user_email column to error_logs for better debugging visibility
ALTER TABLE public.error_logs ADD COLUMN IF NOT EXISTS user_email text;

-- Add comment
COMMENT ON COLUMN public.error_logs.user_email IS 'User email for debugging context (when available)';