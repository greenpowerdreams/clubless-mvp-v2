-- Phase 3: Ticket Instances + QR Check-in + Promo Codes
-- Adapted for clawbot-prod schema (profiles.id = auth user id)
-- The existing 'tickets' table holds TIER definitions (name, price_cents, qty_total, etc.)
-- This creates 'ticket_instances' for individual QR-code tickets per purchase

-- ============================================================
-- 1. ticket_instances table (one row per purchased ticket)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  holder_id UUID REFERENCES auth.users(id),
  holder_email TEXT NOT NULL,
  holder_name TEXT,
  qr_code TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'scanned', 'transferred', 'refunded', 'expired', 'cancelled')),
  scanned_at TIMESTAMPTZ,
  scanned_by UUID REFERENCES auth.users(id),
  transferred_to UUID REFERENCES auth.users(id),
  transferred_at TIMESTAMPTZ,
  transfer_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_instances_qr ON public.ticket_instances (qr_code);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_event ON public.ticket_instances (event_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_instances_holder ON public.ticket_instances (holder_id) WHERE holder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_instances_order ON public.ticket_instances (order_id);

-- RLS
ALTER TABLE public.ticket_instances ENABLE ROW LEVEL SECURITY;

-- Holders can view their own tickets
DROP POLICY IF EXISTS "Holders can view their own tickets" ON public.ticket_instances;
CREATE POLICY "Holders can view their own tickets"
  ON public.ticket_instances FOR SELECT
  USING (
    holder_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid()
    )
  );

-- Public can verify tickets by QR code (limited fields via app logic)
DROP POLICY IF EXISTS "Public can verify tickets" ON public.ticket_instances;
CREATE POLICY "Public can verify tickets"
  ON public.ticket_instances FOR SELECT
  USING (true);

-- Event creators can update ticket status (scan)
DROP POLICY IF EXISTS "Event creators can update tickets" ON public.ticket_instances;
CREATE POLICY "Event creators can update tickets"
  ON public.ticket_instances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid()
    )
  );

-- System can insert tickets (via edge functions after payment)
DROP POLICY IF EXISTS "System can insert ticket instances" ON public.ticket_instances;
CREATE POLICY "System can insert ticket instances"
  ON public.ticket_instances FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 2. promo_codes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount INTEGER NOT NULL CHECK (discount_amount > 0),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_codes_unique_event_code UNIQUE (event_id, code)
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active promo codes" ON public.promo_codes;
CREATE POLICY "Public can read active promo codes" ON public.promo_codes FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Event creators manage promo codes" ON public.promo_codes;
CREATE POLICY "Event creators manage promo codes" ON public.promo_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid())
  );

-- ============================================================
-- 3. RPC: scan_ticket — scans QR code, marks as scanned
-- Uses ticket_instances + tickets (for tier name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.scan_ticket(p_qr_token TEXT, p_scanned_by UUID)
RETURNS TABLE (
  ticket_instance_id UUID,
  holder_name TEXT,
  holder_email TEXT,
  tier_name TEXT,
  event_title TEXT,
  scan_status TEXT,
  already_scanned BOOLEAN,
  scanned_at TIMESTAMPTZ,
  checked_in_count BIGINT,
  total_ticket_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ticket RECORD;
  v_event_id UUID;
  v_checked BIGINT;
  v_total BIGINT;
BEGIN
  -- Lock the ticket row for atomic update
  SELECT ti.*, t.name AS tier_name
  INTO v_ticket
  FROM public.ticket_instances ti
  LEFT JOIN public.tickets t ON t.id = ti.tier_id
  WHERE ti.qr_code = p_qr_token
  FOR UPDATE OF ti;

  IF v_ticket IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      'invalid'::TEXT, FALSE, NULL::TIMESTAMPTZ, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  v_event_id := v_ticket.event_id;

  -- Already scanned
  IF v_ticket.status = 'scanned' THEN
    SELECT COUNT(*) FILTER (WHERE status = 'scanned'), COUNT(*)
    INTO v_checked, v_total
    FROM public.ticket_instances WHERE event_id = v_event_id;

    RETURN QUERY SELECT v_ticket.id, v_ticket.holder_name, v_ticket.holder_email,
      v_ticket.tier_name, ''::TEXT, 'already_scanned'::TEXT, TRUE,
      v_ticket.scanned_at, v_checked, v_total;
    RETURN;
  END IF;

  -- Not in valid state
  IF v_ticket.status != 'valid' THEN
    RETURN QUERY SELECT v_ticket.id, v_ticket.holder_name, v_ticket.holder_email,
      v_ticket.tier_name, ''::TEXT, v_ticket.status, FALSE,
      NULL::TIMESTAMPTZ, 0::BIGINT, 0::BIGINT;
    RETURN;
  END IF;

  -- Scan the ticket
  UPDATE public.ticket_instances
  SET status = 'scanned', scanned_at = now(), scanned_by = p_scanned_by, updated_at = now()
  WHERE id = v_ticket.id;

  SELECT COUNT(*) FILTER (WHERE status = 'scanned'), COUNT(*)
  INTO v_checked, v_total
  FROM public.ticket_instances WHERE event_id = v_event_id;

  RETURN QUERY SELECT v_ticket.id, v_ticket.holder_name, v_ticket.holder_email,
    v_ticket.tier_name, ''::TEXT, 'success'::TEXT, FALSE,
    now(), v_checked, v_total;
END;
$$;

-- ============================================================
-- 4. RPC: get_checkin_stats — event check-in statistics
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_checkin_stats(p_event_id UUID)
RETURNS TABLE (total_tickets BIGINT, checked_in BIGINT, remaining BIGINT, checkin_rate NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'scanned'),
    COUNT(*) FILTER (WHERE status = 'valid'),
    CASE WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE status = 'scanned')::NUMERIC / COUNT(*)::NUMERIC * 100, 1)
      ELSE 0
    END
  FROM public.ticket_instances
  WHERE event_id = p_event_id;
$$;
