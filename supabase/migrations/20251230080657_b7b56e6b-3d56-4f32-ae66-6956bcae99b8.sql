-- Remove user_email column from error_logs to prevent PII exposure
-- The user_id column can be used to join with auth.users when needed

ALTER TABLE public.error_logs DROP COLUMN IF EXISTS user_email;