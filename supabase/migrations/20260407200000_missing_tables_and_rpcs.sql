-- =============================================================================
-- Missing tables, enums, and RPCs for clawbot-prod
-- Creates: app_role, user_roles, has_role(), event_proposals, user_stats,
--          user_levels, get_user_level(), get_proposal_status(),
--          update_updated_at_column()
-- =============================================================================

-- 1. app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. has_role() function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Now create admin policy on user_roles (depends on has_role)
DO $$ BEGIN
  CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. update_updated_at_column() trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. event_proposals table (with evolved columns from later migrations)
CREATE TABLE IF NOT EXISTS public.event_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  submitter_email TEXT NOT NULL,
  email TEXT, -- legacy column alias
  instagram_handle TEXT,
  city TEXT,
  event_concept TEXT,
  preferred_date TEXT,
  preferred_event_date TEXT,
  fee_model TEXT,
  profit_summary JSONB,
  projected_profit NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  eventbrite_status TEXT,
  eventbrite_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.event_proposals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can submit proposals"
  ON public.event_proposals FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can read all proposals"
  ON public.event_proposals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update proposals"
  ON public.event_proposals FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_event_proposals_updated_at ON public.event_proposals;
CREATE TRIGGER update_event_proposals_updated_at
BEFORE UPDATE ON public.event_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lifetime_events_completed INT NOT NULL DEFAULT 0,
  lifetime_events_published INT NOT NULL DEFAULT 0,
  lifetime_profit_generated NUMERIC NOT NULL DEFAULT 0,
  lifetime_attendance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all stats"
  ON public.user_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. user_levels table + seed data
CREATE TABLE IF NOT EXISTS public.user_levels (
  level INT PRIMARY KEY,
  name TEXT NOT NULL,
  requirements_json JSONB NOT NULL,
  perks_json JSONB NOT NULL
);
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view levels"
  ON public.user_levels FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed levels (upsert)
INSERT INTO public.user_levels (level, name, requirements_json, perks_json) VALUES
(1, 'Starter',
  '{"min_completed_events": 0}',
  '{"service_fee_percent": 15, "priority_support": false}'),
(2, 'Verified',
  '{"min_completed_events": 2}',
  '{"service_fee_percent": 14, "early_access_slots": true}'),
(3, 'Pro',
  '{"min_completed_events": 5}',
  '{"service_fee_percent": 12, "priority_approval": true}'),
(4, 'Elite',
  '{"min_completed_events": 10}',
  '{"service_fee_percent": 10, "best_dates_priority": true, "dedicated_rep": true}')
ON CONFLICT (level) DO UPDATE SET
  name = EXCLUDED.name,
  requirements_json = EXCLUDED.requirements_json,
  perks_json = EXCLUDED.perks_json;

-- 8. update_user_stats_on_completion() trigger function
CREATE OR REPLACE FUNCTION public.update_user_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, lifetime_events_completed, lifetime_profit_generated, updated_at)
    VALUES (NEW.user_id, 1, COALESCE(NEW.projected_profit, 0), now())
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_events_completed = public.user_stats.lifetime_events_completed + 1,
      lifetime_profit_generated = public.user_stats.lifetime_profit_generated + COALESCE(NEW.projected_profit, 0),
      updated_at = now();
  END IF;

  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, lifetime_events_published, updated_at)
    VALUES (NEW.user_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_events_published = public.user_stats.lifetime_events_published + 1,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on event_proposals
DROP TRIGGER IF EXISTS on_event_status_change ON public.event_proposals;
CREATE TRIGGER on_event_status_change
AFTER UPDATE ON public.event_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_completion();

-- 9. get_user_level() RPC
CREATE OR REPLACE FUNCTION public.get_user_level(p_user_id UUID)
RETURNS TABLE (
  current_level INT,
  level_name TEXT,
  service_fee_percent INT,
  perks JSONB,
  next_level INT,
  next_level_name TEXT,
  events_to_next_level INT
) AS $$
DECLARE
  v_completed_events INT;
  v_current_level RECORD;
  v_next_level RECORD;
BEGIN
  SELECT COALESCE(lifetime_events_completed, 0) INTO v_completed_events
  FROM public.user_stats WHERE user_id = p_user_id;

  IF v_completed_events IS NULL THEN v_completed_events := 0; END IF;

  SELECT ul.level, ul.name, ul.perks_json INTO v_current_level
  FROM public.user_levels ul
  WHERE (ul.requirements_json->>'min_completed_events')::int <= v_completed_events
  ORDER BY ul.level DESC LIMIT 1;

  IF v_current_level IS NULL THEN
    SELECT ul.level, ul.name, ul.perks_json INTO v_current_level
    FROM public.user_levels ul WHERE ul.level = 1;
  END IF;

  SELECT ul.level, ul.name, ul.requirements_json INTO v_next_level
  FROM public.user_levels ul
  WHERE ul.level > v_current_level.level
  ORDER BY ul.level ASC LIMIT 1;

  current_level := v_current_level.level;
  level_name := v_current_level.name;
  service_fee_percent := (v_current_level.perks_json->>'service_fee_percent')::int;
  perks := v_current_level.perks_json;

  IF v_next_level IS NOT NULL THEN
    next_level := v_next_level.level;
    next_level_name := v_next_level.name;
    events_to_next_level := (v_next_level.requirements_json->>'min_completed_events')::int - v_completed_events;
  ELSE
    next_level := NULL;
    next_level_name := NULL;
    events_to_next_level := NULL;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_level(UUID) TO anon, authenticated;

-- 10. get_proposal_status() RPC (latest version with input validation + auth checks)
CREATE OR REPLACE FUNCTION public.get_proposal_status(lookup_email TEXT)
RETURNS TABLE(
  id UUID,
  status TEXT,
  eventbrite_status TEXT,
  eventbrite_url TEXT,
  city TEXT,
  preferred_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Validate email
  IF lookup_email IS NULL
     OR LENGTH(lookup_email) < 5
     OR LENGTH(lookup_email) > 255
     OR lookup_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN QUERY
    SELECT ep.id, ep.status, ep.eventbrite_status, ep.eventbrite_url,
           ep.city, ep.preferred_event_date as preferred_date, ep.created_at
    FROM public.event_proposals ep
    WHERE LOWER(ep.submitter_email) = LOWER(lookup_email)
      AND ep.user_id IS NULL;
  ELSIF public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT ep.id, ep.status, ep.eventbrite_status, ep.eventbrite_url,
           ep.city, ep.preferred_event_date as preferred_date, ep.created_at
    FROM public.event_proposals ep
    WHERE LOWER(ep.submitter_email) = LOWER(lookup_email);
  ELSE
    RETURN QUERY
    SELECT ep.id, ep.status, ep.eventbrite_status, ep.eventbrite_url,
           ep.city, ep.preferred_event_date as preferred_date, ep.created_at
    FROM public.event_proposals ep
    WHERE LOWER(ep.submitter_email) = LOWER(lookup_email)
      AND (ep.user_id = auth.uid() OR ep.user_id IS NULL);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_proposal_status(TEXT) TO anon, authenticated;
