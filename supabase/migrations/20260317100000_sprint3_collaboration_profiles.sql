-- Sprint 3: Collaboration + Public Profiles
-- Adds collaborations, connections, and slug-based public profiles

-- ============================================
-- 1. Collaborations table (co-hosts, revenue splits)
-- ============================================
CREATE TABLE IF NOT EXISTS collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  initiator_id uuid NOT NULL REFERENCES auth.users(id),
  collaborator_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('co-host', 'promoter', 'dj', 'mc', 'manager')),
  revenue_split_percent numeric(5,2) CHECK (revenue_split_percent >= 0 AND revenue_split_percent <= 100),
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'removed')),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, collaborator_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborations_event ON collaborations(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_user ON collaborations(collaborator_id, status);

ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaboration parties can view" ON collaborations
  FOR SELECT USING (
    auth.uid() = initiator_id
    OR auth.uid() = collaborator_id
    OR EXISTS (SELECT 1 FROM events WHERE events.id = collaborations.event_id AND events.creator_id = auth.uid())
  );

CREATE POLICY "Event creators can manage collaborations" ON collaborations
  FOR INSERT WITH CHECK (
    auth.uid() = initiator_id
    AND EXISTS (SELECT 1 FROM events WHERE events.id = collaborations.event_id AND events.creator_id = auth.uid())
  );

CREATE POLICY "Parties can update collaboration status" ON collaborations
  FOR UPDATE USING (auth.uid() = collaborator_id OR auth.uid() = initiator_id);

CREATE POLICY "Initiators can delete collaborations" ON collaborations
  FOR DELETE USING (auth.uid() = initiator_id);

-- ============================================
-- 2. Connections table (follow/network)
-- ============================================
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_follower ON connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_following ON connections(following_id);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view connections" ON connections
  FOR SELECT USING (true);

CREATE POLICY "Users manage own follows" ON connections
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON connections
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- 3. Add slug to profiles for public URLs
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug) WHERE slug IS NOT NULL;

-- Make public profiles viewable by everyone
-- (profiles table should already have RLS; add public read if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles viewable'
  ) THEN
    CREATE POLICY "Public profiles viewable" ON profiles
      FOR SELECT USING (public_profile = true OR auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 4. Follower/following count function
-- ============================================
CREATE OR REPLACE FUNCTION get_connection_counts(p_user_id uuid)
RETURNS TABLE (
  followers_count bigint,
  following_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM connections WHERE following_id = p_user_id) AS followers_count,
    (SELECT count(*) FROM connections WHERE follower_id = p_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Get event collaborators with profiles
-- ============================================
CREATE OR REPLACE FUNCTION get_event_collaborators(p_event_id uuid)
RETURNS TABLE (
  collaboration_id uuid,
  user_id uuid,
  display_name text,
  stage_name text,
  avatar_url text,
  role text,
  revenue_split_percent numeric,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS collaboration_id,
    c.collaborator_id AS user_id,
    p.display_name,
    p.stage_name,
    p.avatar_url,
    c.role,
    c.revenue_split_percent,
    c.status
  FROM collaborations c
  JOIN profiles p ON p.user_id = c.collaborator_id
  WHERE c.event_id = p_event_id
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
