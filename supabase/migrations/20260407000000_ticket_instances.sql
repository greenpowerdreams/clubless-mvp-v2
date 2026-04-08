-- Phase 3: QR Check-in + Promo Codes
-- Uses existing tickets table as ticket instances (has: id, order_id, event_id, tier_id, holder_id, holder_email, holder_name, qr_code, status, scanned_at, scanned_by, created_at)

-- 1. Enhance tickets table with transfer fields
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS transferred_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transfer_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets (qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON public.tickets (event_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_holder ON public.tickets (holder_id) WHERE holder_id IS NOT NULL;

-- 2. promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
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
CREATE POLICY "Public can read active promo codes" ON public.promo_codes FOR SELECT USING (active = true);
CREATE POLICY "Service manage promo codes" ON public.promo_codes FOR ALL WITH CHECK (true);

-- 3. RPC: scan_ticket
CREATE OR REPLACE FUNCTION public.scan_ticket(p_qr_token TEXT, p_scanned_by UUID)
RETURNS TABLE (ticket_instance_id UUID, holder_name TEXT, holder_email TEXT, tier_name TEXT, event_title TEXT, scan_status TEXT, already_scanned BOOLEAN, scanned_at TIMESTAMPTZ, checked_in_count BIGINT, total_ticket_count BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket RECORD; v_event_id UUID; v_checked BIGINT; v_total BIGINT;
BEGIN
  SELECT t.*, tt.name AS tier_name INTO v_ticket FROM public.tickets t LEFT JOIN public.ticket_tiers tt ON tt.id = t.tier_id WHERE t.qr_code = p_qr_token FOR UPDATE OF t;
  IF v_ticket IS NULL THEN RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'invalid'::TEXT, FALSE, NULL::TIMESTAMPTZ, 0::BIGINT, 0::BIGINT; RETURN; END IF;
  v_event_id := v_ticket.event_id;
  IF v_ticket.status = 'scanned' THEN
    SELECT COUNT(*) FILTER (WHERE status = 'scanned'), COUNT(*) INTO v_checked, v_total FROM public.tickets WHERE event_id = v_event_id;
    RETURN QUERY SELECT v_ticket.id, v_ticket.holder_name, v_ticket.holder_email, v_ticket.tier_name, ''::TEXT, 'already_scanned'::TEXT, TRUE, v_ticket.scanned_at, v_checked, v_total; RETURN;
  END IF;
  IF v_ticket.status != 'valid' THEN RETURN QUERY SELECT v_ticket.id, v_ticket.holder_name, v_ticket.holder_email, v_ticket.tier_name, ''::TEXT, v_ticket.status, FALSE, NULL::TIMESTAMPTZ, 0::BIGINT, 0::BIGINT; RETURN; END IF;
  UPDATE public.tickets SET status = 'scanned', scanned_at = now(), scanned_by = p_scanned_by, updated_at = now() WHERE id = v_ticket.id;
  SELECT COUNT(*) FILTER (WHERE status = 'scanned'), COUNT(*) INTO v_checked, v_total FROM public.tickets WHERE event_id = v_event_id;
  RETURN QUERY SELECT v_ticket.id, v_ticket.holder_name, v_ticket.holder_email, v_ticket.tier_name, ''::TEXT, 'success'::TEXT, FALSE, now(), v_checked, v_total;
END; $$;

-- 4. RPC: get_checkin_stats
CREATE OR REPLACE FUNCTION public.get_checkin_stats(p_event_id UUID)
RETURNS TABLE (total_tickets BIGINT, checked_in BIGINT, remaining BIGINT, checkin_rate NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'scanned'), COUNT(*) FILTER (WHERE status = 'valid'),
    CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE status = 'scanned')::NUMERIC / COUNT(*)::NUMERIC * 100, 1) ELSE 0 END
  FROM public.tickets WHERE event_id = p_event_id;
$$;
