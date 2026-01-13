-- =====================================================
-- PHASE 1: PLATFORM DATA MODEL FOUNDATION
-- =====================================================

-- 1. Platform Configuration Table (for locked rates, fees, etc.)
CREATE TABLE public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform config"
  ON public.platform_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage platform config"
  ON public.platform_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed locked rates
INSERT INTO public.platform_config (key, value, description) VALUES
  ('bartender_rate_hourly', '40', 'Locked bartender hourly rate in USD'),
  ('security_rate_hourly', '25', 'Locked security hourly rate in USD'),
  ('door_staff_rate_hourly', '25', 'Default door staff hourly rate in USD'),
  ('setup_crew_rate_hourly', '30', 'Default setup crew hourly rate in USD'),
  ('service_fee_percent_default', '15', 'Default service fee percentage for new creators'),
  ('profit_share_percent', '50', 'Profit share percentage'),
  ('min_margin_percent', '15', 'Minimum profit margin floor'),
  ('payout_delay_days', '3', 'Days after event completion before payout');

-- 2. User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  bio TEXT,
  instagram_handle TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Venues Table
CREATE TYPE public.venue_status AS ENUM ('pending', 'approved', 'suspended', 'archived');

CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  capacity INTEGER,
  rules_json JSONB DEFAULT '{}',
  base_cost_model TEXT DEFAULT 'flat', -- 'flat', 'hourly', 'per_head'
  base_cost_amount NUMERIC,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status venue_status NOT NULL DEFAULT 'pending',
  images_json JSONB DEFAULT '[]',
  amenities_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved venues
CREATE POLICY "Anyone can view approved venues"
  ON public.venues FOR SELECT
  USING (status = 'approved' OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage all venues
CREATE POLICY "Admins can manage venues"
  ON public.venues FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_venues_city_status ON public.venues(city, status);

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add 'vendor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- 5. Vendors Table
CREATE TYPE public.vendor_status AS ENUM ('pending', 'verified', 'suspended', 'archived');
CREATE TYPE public.vendor_category AS ENUM (
  'bartending', 'security', 'catering', 'av_equipment', 
  'decor', 'photo_video', 'staffing', 'dj_equipment', 'other'
);

CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category vendor_category NOT NULL,
  description TEXT,
  service_area TEXT[], -- Array of cities/regions
  verification_status vendor_status NOT NULL DEFAULT 'pending',
  insurance_verified BOOLEAN DEFAULT false,
  license_verified BOOLEAN DEFAULT false,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category) -- One vendor profile per category per user
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Vendors can view/edit their own profiles
CREATE POLICY "Vendors can view their own profiles"
  ON public.vendors FOR SELECT
  USING (auth.uid() = user_id OR verification_status = 'verified' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can update their own profiles"
  ON public.vendors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create vendor profiles"
  ON public.vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors"
  ON public.vendors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_vendors_category_status ON public.vendors(category, verification_status);
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Vendor Services Table
CREATE TYPE public.pricing_model AS ENUM ('hourly', 'flat', 'per_head', 'tiered');

CREATE TABLE public.vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pricing_model pricing_model NOT NULL DEFAULT 'hourly',
  unit_price NUMERIC NOT NULL, -- base price
  min_qty INTEGER DEFAULT 1,
  max_qty INTEGER,
  lead_time_days INTEGER DEFAULT 7,
  add_ons_json JSONB DEFAULT '[]', -- Array of {name, price, description}
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

-- Public can view active services from verified vendors
CREATE POLICY "Anyone can view active services from verified vendors"
  ON public.vendor_services FOR SELECT
  USING (
    active = true AND EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.id = vendor_id AND v.verification_status = 'verified'
    )
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

-- Vendors can manage their own services
CREATE POLICY "Vendors can manage their own services"
  ON public.vendor_services FOR ALL
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()));

-- Admins can manage all services
CREATE POLICY "Admins can manage all services"
  ON public.vendor_services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_vendor_services_vendor_id ON public.vendor_services(vendor_id);

CREATE TRIGGER update_vendor_services_updated_at
  BEFORE UPDATE ON public.vendor_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Events Table (evolving from event_proposals for future ticketed events)
-- Note: Keeping event_proposals for now as the submission/approval workflow
-- This table is for published, ticketable events

CREATE TYPE public.event_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'published', 'live', 'completed', 'cancelled'
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.event_proposals(id), -- Link to original proposal
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  venue_id UUID REFERENCES public.venues(id),
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  city TEXT NOT NULL,
  address TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL,
  status event_status NOT NULL DEFAULT 'draft',
  risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
  cover_image_url TEXT,
  images_json JSONB DEFAULT '[]',
  slug TEXT UNIQUE, -- SEO-friendly URL
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public can view published events
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (
    status IN ('published', 'live', 'completed') AND is_private = false
    OR creator_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Creators can manage their own events
CREATE POLICY "Creators can manage their own events"
  ON public.events FOR ALL
  USING (creator_id = auth.uid());

-- Admins can manage all events
CREATE POLICY "Admins can manage all events"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_events_city_status_start ON public.events(city, status, start_at);
CREATE INDEX idx_events_creator_id ON public.events(creator_id);
CREATE INDEX idx_events_slug ON public.events(slug);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Event Budgets Table (versioned budgets)
CREATE TABLE public.event_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  line_items_json JSONB NOT NULL DEFAULT '[]', -- Array of {category, name, qty, unit_price, subtotal}
  totals_json JSONB NOT NULL DEFAULT '{}', -- {revenue, costs, profit, margin}
  margin_rules_json JSONB DEFAULT '{}', -- {min_margin_percent, service_fee_percent}
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(event_id, version)
);

ALTER TABLE public.event_budgets ENABLE ROW LEVEL SECURITY;

-- Creators can view/manage their event budgets
CREATE POLICY "Creators can manage their event budgets"
  ON public.event_budgets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid()));

-- Admins can manage all budgets
CREATE POLICY "Admins can manage all budgets"
  ON public.event_budgets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_event_budgets_event_id ON public.event_budgets(event_id);

-- 9. Event Vendor Quotes Table
CREATE TYPE public.quote_status AS ENUM ('requested', 'quoted', 'accepted', 'rejected', 'expired');

CREATE TABLE public.event_vendor_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vendor_service_id UUID NOT NULL REFERENCES public.vendor_services(id),
  status quote_status NOT NULL DEFAULT 'requested',
  requested_qty INTEGER,
  requested_hours INTEGER,
  quoted_price NUMERIC,
  details_json JSONB DEFAULT '{}',
  notes TEXT,
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_vendor_quotes ENABLE ROW LEVEL SECURITY;

-- Creators can view/request quotes for their events
CREATE POLICY "Creators can manage quotes for their events"
  ON public.event_vendor_quotes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid()));

-- Vendors can view/respond to quotes for their services
CREATE POLICY "Vendors can manage quotes for their services"
  ON public.event_vendor_quotes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.vendor_services vs
    JOIN public.vendors v ON v.id = vs.vendor_id
    WHERE vs.id = vendor_service_id AND v.user_id = auth.uid()
  ));

-- Admins can manage all quotes
CREATE POLICY "Admins can manage all quotes"
  ON public.event_vendor_quotes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_event_vendor_quotes_event_id ON public.event_vendor_quotes(event_id);
CREATE INDEX idx_event_vendor_quotes_vendor_service_id ON public.event_vendor_quotes(vendor_service_id);

CREATE TRIGGER update_event_vendor_quotes_updated_at
  BEFORE UPDATE ON public.event_vendor_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Tickets Table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "General Admission", "VIP", "Early Bird"
  description TEXT,
  price_cents INTEGER NOT NULL, -- Store in cents to avoid float issues
  qty_total INTEGER NOT NULL,
  qty_sold INTEGER NOT NULL DEFAULT 0,
  qty_reserved INTEGER NOT NULL DEFAULT 0, -- For cart holds
  sale_starts_at TIMESTAMPTZ,
  sale_ends_at TIMESTAMPTZ,
  max_per_order INTEGER DEFAULT 10,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can view tickets for published events
CREATE POLICY "Anyone can view tickets for published events"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status IN ('published', 'live'))
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Creators can manage tickets for their events
CREATE POLICY "Creators can manage tickets for their events"
  ON public.tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid()));

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets"
  ON public.tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_tickets_event_id ON public.tickets(event_id);

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Orders Table
CREATE TYPE public.order_status AS ENUM (
  'pending', 'processing', 'completed', 'refunded', 'partially_refunded', 'failed', 'cancelled'
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id),
  buyer_user_id UUID REFERENCES auth.users(id), -- NULL for guest checkout
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  creator_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  line_items_json JSONB NOT NULL, -- [{ticket_id, qty, price_cents, subtotal_cents}]
  metadata_json JSONB DEFAULT '{}',
  refund_amount_cents INTEGER DEFAULT 0,
  refund_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers can view their own orders
CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT
  USING (buyer_user_id = auth.uid() OR buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Creators can view orders for their events
CREATE POLICY "Creators can view orders for their events"
  ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid()));

-- System can insert orders (no user check needed - done via edge function)
CREATE POLICY "System can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_orders_event_id ON public.orders(event_id);
CREATE INDEX idx_orders_buyer_user_id ON public.orders(buyer_user_id);
CREATE INDEX idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX idx_orders_stripe_checkout_session_id ON public.orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Payouts Table
CREATE TYPE public.payout_status AS ENUM (
  'pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled'
);

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  status payout_status NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Creators can view their own payouts
CREATE POLICY "Creators can view their own payouts"
  ON public.payouts FOR SELECT
  USING (creator_id = auth.uid());

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
  ON public.payouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payouts_event_id ON public.payouts(event_id);
CREATE INDEX idx_payouts_creator_id ON public.payouts(creator_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Audit Logs Table (comprehensive)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'login', etc.
  entity_type TEXT NOT NULL, -- 'event', 'order', 'vendor', 'payout', etc.
  entity_id UUID,
  old_values_json JSONB,
  new_values_json JSONB,
  metadata_json JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 14. Create profile on user signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  
  -- Initialize user stats if not exists
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 15. Storage bucket for avatars and event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('event-images', 'event-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('venue-images', 'venue-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vendor-assets', 'vendor-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for event images
CREATE POLICY "Event images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their event images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their event images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can manage all storage
CREATE POLICY "Admins can manage all storage"
  ON storage.objects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));