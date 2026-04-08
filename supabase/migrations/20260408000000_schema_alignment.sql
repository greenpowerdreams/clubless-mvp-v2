-- =============================================================================
-- Phase 1: Schema Alignment for clawbot-prod
-- Makes clawbot-prod compatible with the existing committed frontend code.
-- Strategy: rename tables + add alias columns, so the code works unchanged.
-- =============================================================================

-- =====================
-- 1. TABLE RENAMES
-- =====================

-- Step 1a: Rename "tickets" (instances) -> "ticket_instances"
-- This table has: qr_code, holder_id, tier_id, scanned_at, etc.
ALTER TABLE public.tickets RENAME TO ticket_instances;

-- Step 1b: Rename "ticket_tiers" (tier defs) -> "tickets"
-- This table has: name, price, quantity_total, etc.
-- The frontend queries .from("tickets").select("price_cents, qty_total, qty_sold")
ALTER TABLE public.ticket_tiers RENAME TO tickets;

-- FKs follow automatically in PostgreSQL (referenced by OID, not name).
-- ticket_instances.tier_id still references tickets.id (formerly ticket_tiers.id). ✓

-- =====================
-- 2. TICKETS TABLE (tier definitions) — Add Lovable-compatible alias columns
-- =====================

-- price is INTEGER on clawbot-prod — already stores cents. Alias it.
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS price_cents INTEGER;
UPDATE public.tickets SET price_cents = price WHERE price_cents IS NULL;

-- Quantity aliases
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty_total INTEGER;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty_sold INTEGER;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty_reserved INTEGER;
UPDATE public.tickets SET
  qty_total = quantity_total,
  qty_sold = COALESCE(quantity_sold, 0),
  qty_reserved = COALESCE(quantity_reserved, 0)
WHERE qty_total IS NULL;

-- Additional columns the code expects
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS max_per_order INTEGER DEFAULT 10;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS description TEXT;
UPDATE public.tickets SET active = COALESCE(is_visible, true) WHERE active IS NULL OR active = true;

-- Sync trigger: keep both sets of columns in sync on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.sync_ticket_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync price <-> price_cents
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    NEW.price_cents = NEW.price;
  ELSIF NEW.price_cents IS DISTINCT FROM OLD.price_cents THEN
    NEW.price = NEW.price_cents;
  END IF;
  -- Sync quantity columns
  IF NEW.quantity_total IS DISTINCT FROM OLD.quantity_total THEN
    NEW.qty_total = NEW.quantity_total;
  ELSIF NEW.qty_total IS DISTINCT FROM OLD.qty_total THEN
    NEW.quantity_total = NEW.qty_total;
  END IF;
  IF NEW.quantity_sold IS DISTINCT FROM OLD.quantity_sold THEN
    NEW.qty_sold = NEW.quantity_sold;
  ELSIF NEW.qty_sold IS DISTINCT FROM OLD.qty_sold THEN
    NEW.quantity_sold = NEW.qty_sold;
  END IF;
  IF NEW.quantity_reserved IS DISTINCT FROM OLD.quantity_reserved THEN
    NEW.qty_reserved = NEW.quantity_reserved;
  ELSIF NEW.qty_reserved IS DISTINCT FROM OLD.qty_reserved THEN
    NEW.quantity_reserved = NEW.qty_reserved;
  END IF;
  -- Sync active <-> is_visible
  IF NEW.is_visible IS DISTINCT FROM OLD.is_visible THEN
    NEW.active = NEW.is_visible;
  ELSIF NEW.active IS DISTINCT FROM OLD.active THEN
    NEW.is_visible = NEW.active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_ticket_cols ON public.tickets;
CREATE TRIGGER sync_ticket_cols
BEFORE INSERT OR UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.sync_ticket_columns();

-- =====================
-- 3. EVENTS TABLE — Backfill existing compatibility columns
-- =====================

-- title, start_at, end_at, creator_id, city, capacity already exist from earlier.
-- Backfill any remaining nulls.
UPDATE public.events SET title = name WHERE title IS NULL AND name IS NOT NULL;
UPDATE public.events SET start_at = event_date::timestamptz WHERE start_at IS NULL AND event_date IS NOT NULL;
UPDATE public.events SET city = neighborhood WHERE city IS NULL AND neighborhood IS NOT NULL;
UPDATE public.events SET capacity = max_attendees WHERE capacity IS NULL AND max_attendees IS NOT NULL;
UPDATE public.events SET cover_image_url = image_url WHERE cover_image_url IS NULL AND image_url IS NOT NULL;
UPDATE public.events SET theme = genre WHERE theme IS NULL AND genre IS NOT NULL;

-- Sync trigger for events
CREATE OR REPLACE FUNCTION public.sync_event_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title THEN NEW.name = NEW.title; END IF;
  IF NEW.name IS DISTINCT FROM OLD.name THEN NEW.title = NEW.name; END IF;
  IF NEW.start_at IS DISTINCT FROM OLD.start_at THEN NEW.event_date = NEW.start_at::date; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_event_cols ON public.events;
CREATE TRIGGER sync_event_cols
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.sync_event_columns();

-- =====================
-- 4. ORDERS TABLE — Add Lovable-compatible columns
-- =====================

-- orders already has: total, subtotal, platform_fee, stripe_fee (all INTEGER)
-- Code expects: amount_cents, platform_fee_cents, creator_amount_cents, buyer_email, buyer_name, line_items_json
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS creator_amount_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS line_items_json JSONB;

-- Backfill from existing columns
UPDATE public.orders SET
  amount_cents = total,
  platform_fee_cents = platform_fee,
  creator_amount_cents = total - COALESCE(platform_fee, 0) - COALESCE(stripe_fee, 0)
WHERE amount_cents IS NULL;

-- Backfill buyer info from profiles
UPDATE public.orders o SET
  buyer_email = (SELECT au.email FROM auth.users au WHERE au.id = o.buyer_id),
  buyer_name = (SELECT p.display_name FROM public.profiles p WHERE p.id = o.buyer_id)
WHERE o.buyer_email IS NULL AND o.buyer_id IS NOT NULL;

-- Sync trigger for orders
CREATE OR REPLACE FUNCTION public.sync_order_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total IS DISTINCT FROM OLD.total THEN NEW.amount_cents = NEW.total; END IF;
  IF NEW.amount_cents IS DISTINCT FROM OLD.amount_cents THEN NEW.total = NEW.amount_cents; END IF;
  IF NEW.platform_fee IS DISTINCT FROM OLD.platform_fee THEN NEW.platform_fee_cents = NEW.platform_fee; END IF;
  IF NEW.platform_fee_cents IS DISTINCT FROM OLD.platform_fee_cents THEN NEW.platform_fee = NEW.platform_fee_cents; END IF;
  -- Always recompute creator_amount_cents
  NEW.creator_amount_cents = COALESCE(NEW.total, NEW.amount_cents, 0)
    - COALESCE(NEW.platform_fee, NEW.platform_fee_cents, 0)
    - COALESCE(NEW.stripe_fee, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_order_cols ON public.orders;
CREATE TRIGGER sync_order_cols
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_columns();

-- =====================
-- 5. PAYOUTS TABLE — Add amount_cents alias
-- =====================

ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
UPDATE public.payouts SET amount_cents = amount WHERE amount_cents IS NULL;

CREATE OR REPLACE FUNCTION public.sync_payout_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN NEW.amount_cents = NEW.amount; END IF;
  IF NEW.amount_cents IS DISTINCT FROM OLD.amount_cents THEN NEW.amount = NEW.amount_cents; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_payout_cols ON public.payouts;
CREATE TRIGGER sync_payout_cols
BEFORE INSERT OR UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.sync_payout_columns();

-- =====================
-- 6. PROFILES TABLE — Add user_id alias
-- =====================

-- profiles.id IS the auth user UUID (PK). Code queries .eq("user_id", session.user.id)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Sync trigger
CREATE OR REPLACE FUNCTION public.sync_profile_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NOT NULL AND NEW.user_id IS NULL THEN NEW.user_id = NEW.id; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_uid ON public.profiles;
CREATE TRIGGER sync_profile_uid
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_user_id();

-- =====================
-- 7. RLS POLICIES — Update for renamed tables
-- =====================

-- ticket_instances (was "tickets") — recreate policies with correct table name
-- The RLS policies moved with the table rename automatically.
-- But we need policies on the newly-renamed "tickets" (was "ticket_tiers").
-- Check and add if missing.

DO $$ BEGIN
  CREATE POLICY "Anyone can view tickets"
  ON public.tickets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view ticket_instances"
  ON public.ticket_instances FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================
-- 8. VERIFY
-- =====================

-- This should all work after migration:
-- SELECT title, start_at, creator_id FROM events LIMIT 1;
-- SELECT price_cents, qty_total, qty_sold FROM tickets LIMIT 1;
-- SELECT amount_cents, platform_fee_cents, creator_amount_cents FROM orders LIMIT 1;
-- SELECT amount_cents FROM payouts LIMIT 1;
-- SELECT user_id FROM profiles LIMIT 1;
-- SELECT * FROM ticket_instances LIMIT 1;
