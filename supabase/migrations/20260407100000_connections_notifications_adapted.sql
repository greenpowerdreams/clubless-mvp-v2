-- Phase 1: Social Connections + Notifications
-- Adapted for clawbot-prod schema (profiles.id = auth user id)

-- ============================================================
-- 1. Connections table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT connections_no_self CHECK (requester_id != target_id),
  CONSTRAINT connections_unique_pair UNIQUE (requester_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_target ON public.connections (target_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_accepted ON public.connections (requester_id, target_id) WHERE status = 'accepted';

-- RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
CREATE POLICY "Users can view their own connections"
  ON public.connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Users can send connection requests" ON public.connections;
CREATE POLICY "Users can send connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

DROP POLICY IF EXISTS "Target user can respond to requests" ON public.connections;
CREATE POLICY "Target user can respond to requests"
  ON public.connections FOR UPDATE
  USING (auth.uid() = target_id)
  WITH CHECK (status IN ('accepted', 'declined', 'blocked'));

DROP POLICY IF EXISTS "Users can delete their own connections" ON public.connections;
CREATE POLICY "Users can delete their own connections"
  ON public.connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- ============================================================
-- 2. Notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'connection_request', 'connection_accepted', 'event_invite',
    'booking_request', 'event_reminder', 'ticket_purchased', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, read, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 3. Profile enhancements (IF NOT EXISTS for safety)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS primary_role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS calendar_visibility TEXT NOT NULL DEFAULT 'connections'
    CHECK (calendar_visibility IN ('public', 'connections', 'private'));

CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles (handle) WHERE handle IS NOT NULL;

-- ============================================================
-- 4. get_connections — uses p.id for clawbot-prod
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_connections(p_user_id UUID)
RETURNS TABLE (
  connection_id UUID,
  connected_user_id UUID,
  display_name TEXT,
  handle TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  primary_role TEXT,
  connected_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.id AS connection_id,
    CASE WHEN c.requester_id = p_user_id THEN c.target_id ELSE c.requester_id END AS connected_user_id,
    p.display_name,
    p.handle,
    p.avatar_url,
    p.bio,
    p.city,
    p.primary_role,
    c.responded_at AS connected_at
  FROM public.connections c
  JOIN public.profiles p ON p.id = (
    CASE WHEN c.requester_id = p_user_id THEN c.target_id ELSE c.requester_id END
  )
  WHERE (c.requester_id = p_user_id OR c.target_id = p_user_id)
    AND c.status = 'accepted'
  ORDER BY c.responded_at DESC;
$$;

-- ============================================================
-- 5. search_users — uses p.id for clawbot-prod
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_users(
  p_query TEXT,
  p_role TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  handle TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  primary_role TEXT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.id::UUID AS user_id,
    p.display_name,
    p.handle,
    p.avatar_url,
    p.bio,
    p.city,
    p.primary_role
  FROM public.profiles p
  WHERE (
    p_query IS NULL
    OR p.display_name ILIKE '%' || p_query || '%'
    OR p.handle ILIKE '%' || p_query || '%'
    OR p.bio ILIKE '%' || p_query || '%'
  )
  AND (p_role IS NULL OR p.primary_role = p_role)
  AND (p_city IS NULL OR p.city ILIKE '%' || p_city || '%')
  ORDER BY p.display_name ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;
