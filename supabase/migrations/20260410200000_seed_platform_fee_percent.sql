-- Seed platform_fee_percent so Edge Functions can read it from platform_config.
-- The PaymentSettings UI promises 5%, so the on-platform fee is 5%.
-- Idempotent: only inserts if missing.

INSERT INTO public.platform_config (key, value, description)
VALUES ('platform_fee_percent', '5'::jsonb, 'Platform fee percentage on ticket sales')
ON CONFLICT (key) DO NOTHING;
