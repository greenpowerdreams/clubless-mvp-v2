-- Sprint 4: Calculator Snapshots + Analytics Events

-- ============================================
-- 1. Calculator snapshots (persist calculator runs)
-- ============================================
CREATE TABLE IF NOT EXISTS calculator_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  inputs_json jsonb NOT NULL,
  outputs_json jsonb NOT NULL,
  viability_score numeric(3,1) CHECK (viability_score >= 0 AND viability_score <= 10),
  viability_factors jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calc_snapshots_user ON calculator_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calc_snapshots_event ON calculator_snapshots(event_id);

ALTER TABLE calculator_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own snapshots" ON calculator_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create snapshots" ON calculator_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own snapshots" ON calculator_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. Analytics events (granular tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  properties jsonb,
  city text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (including anonymous)
CREATE POLICY "Anyone can track events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins read analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Users can read their own analytics
CREATE POLICY "Users read own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);
