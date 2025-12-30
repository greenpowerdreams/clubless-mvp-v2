-- Create user_stats table
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lifetime_events_completed int NOT NULL DEFAULT 0,
  lifetime_events_published int NOT NULL DEFAULT 0,
  lifetime_profit_generated numeric NOT NULL DEFAULT 0,
  lifetime_attendance int NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats
CREATE POLICY "Users can view their own stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all stats
CREATE POLICY "Admins can manage all stats"
ON public.user_stats
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create user_levels table
CREATE TABLE public.user_levels (
  level int PRIMARY KEY,
  name text NOT NULL,
  requirements_json jsonb NOT NULL,
  perks_json jsonb NOT NULL
);

-- Enable RLS (public read)
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can read levels
CREATE POLICY "Anyone can view levels"
ON public.user_levels
FOR SELECT
USING (true);

-- Seed level data
INSERT INTO public.user_levels (level, name, requirements_json, perks_json) VALUES
(1, 'Starter', 
  '{"min_completed_events": 0}',
  '{"service_fee_percent": 15, "priority_support": false}'
),
(2, 'Verified',
  '{"min_completed_events": 2}',
  '{"service_fee_percent": 14, "early_access_slots": true}'
),
(3, 'Pro',
  '{"min_completed_events": 5}',
  '{"service_fee_percent": 12, "priority_approval": true}'
),
(4, 'Elite',
  '{"min_completed_events": 10}',
  '{"service_fee_percent": 10, "best_dates_priority": true, "dedicated_rep": true}'
);

-- Create function to update user stats when event is completed
CREATE OR REPLACE FUNCTION public.update_user_stats_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, lifetime_events_completed, lifetime_profit_generated, updated_at)
    VALUES (
      NEW.user_id,
      1,
      COALESCE(NEW.projected_profit, 0),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      lifetime_events_completed = public.user_stats.lifetime_events_completed + 1,
      lifetime_profit_generated = public.user_stats.lifetime_profit_generated + COALESCE(NEW.projected_profit, 0),
      updated_at = now();
  END IF;
  
  -- Handle published status
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

-- Create trigger
CREATE TRIGGER on_event_status_change
AFTER UPDATE ON public.event_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_user_stats_on_completion();

-- Create function to get user level based on stats
CREATE OR REPLACE FUNCTION public.get_user_level(p_user_id uuid)
RETURNS TABLE (
  current_level int,
  level_name text,
  service_fee_percent int,
  perks jsonb,
  next_level int,
  next_level_name text,
  events_to_next_level int
) AS $$
DECLARE
  v_completed_events int;
  v_current_level record;
  v_next_level record;
BEGIN
  -- Get user's completed events count
  SELECT COALESCE(lifetime_events_completed, 0) INTO v_completed_events
  FROM public.user_stats
  WHERE user_id = p_user_id;
  
  IF v_completed_events IS NULL THEN
    v_completed_events := 0;
  END IF;
  
  -- Get current level
  SELECT ul.level, ul.name, ul.perks_json INTO v_current_level
  FROM public.user_levels ul
  WHERE (ul.requirements_json->>'min_completed_events')::int <= v_completed_events
  ORDER BY ul.level DESC
  LIMIT 1;
  
  -- Default to level 1 if no match
  IF v_current_level IS NULL THEN
    SELECT ul.level, ul.name, ul.perks_json INTO v_current_level
    FROM public.user_levels ul
    WHERE ul.level = 1;
  END IF;
  
  -- Get next level
  SELECT ul.level, ul.name, ul.requirements_json INTO v_next_level
  FROM public.user_levels ul
  WHERE ul.level > v_current_level.level
  ORDER BY ul.level ASC
  LIMIT 1;
  
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