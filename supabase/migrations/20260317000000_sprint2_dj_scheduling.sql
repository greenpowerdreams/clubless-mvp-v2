-- Sprint 2: DJ + Scheduling Layer
-- Adds DJ profile fields, schedules, bookings, event lineup, and expands roles

-- ============================================
-- 1. Expand app_role enum
-- ============================================
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'dj';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'venue_manager';

-- ============================================
-- 2. Expand profiles table for DJ/creator fields
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_type text;           -- 'promoter', 'dj', 'hybrid'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stage_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS genres text[];               -- ['afrohouse', 'techno', 'hiphop']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_open boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_rate_cents integer;  -- per-gig or per-hour
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_rate_type text;      -- 'hourly', 'flat', 'negotiable'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soundcloud_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spotify_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mixcloud_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT true;

-- ============================================
-- 3. Schedules table
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  title text NOT NULL,
  schedule_type text NOT NULL CHECK (schedule_type IN ('gig', 'availability', 'block', 'hold')),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  city text,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_date ON schedules(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_schedules_city_date ON schedules(city, start_at);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Public schedules visible to all, private only to owner
CREATE POLICY "Public schedules viewable by all" ON schedules
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users manage own schedules" ON schedules
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. Bookings table (creator ↔ DJ ↔ venue)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  target_id uuid NOT NULL REFERENCES auth.users(id),
  booking_type text NOT NULL CHECK (booking_type IN ('dj', 'venue', 'vendor')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  proposed_rate_cents integer,
  agreed_rate_cents integer,
  set_start_at timestamptz,
  set_end_at timestamptz,
  notes text,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_target ON bookings(target_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking parties can view" ON bookings
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Requesters can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Parties can update bookings" ON bookings
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- ============================================
-- 5. Event lineup table
-- ============================================
CREATE TABLE IF NOT EXISTS event_lineup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  artist_name text NOT NULL,
  role text DEFAULT 'dj' CHECK (role IN ('dj', 'headliner', 'opener', 'mc', 'live_act')),
  set_start_at timestamptz,
  set_end_at timestamptz,
  sort_order integer DEFAULT 0,
  confirmed boolean DEFAULT false,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lineup_event ON event_lineup(event_id);
CREATE INDEX IF NOT EXISTS idx_lineup_user ON event_lineup(user_id);

ALTER TABLE event_lineup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lineup viewable by all" ON event_lineup
  FOR SELECT USING (true);

CREATE POLICY "Event creators manage lineup" ON event_lineup
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_lineup.event_id AND events.creator_id = auth.uid())
  );

-- ============================================
-- 6. Conflict detection function
-- ============================================
CREATE OR REPLACE FUNCTION detect_schedule_conflicts(
  p_user_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_exclude_schedule_id uuid DEFAULT NULL
)
RETURNS TABLE (
  schedule_id uuid,
  title text,
  schedule_type text,
  start_at timestamptz,
  end_at timestamptz,
  city text,
  severity text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS schedule_id,
    s.title,
    s.schedule_type,
    s.start_at,
    s.end_at,
    s.city,
    CASE
      WHEN s.schedule_type = 'block' THEN 'unavailable'
      ELSE 'conflict'
    END AS severity
  FROM schedules s
  WHERE s.user_id = p_user_id
    AND s.start_at < p_end_at
    AND s.end_at > p_start_at
    AND (p_exclude_schedule_id IS NULL OR s.id != p_exclude_schedule_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
