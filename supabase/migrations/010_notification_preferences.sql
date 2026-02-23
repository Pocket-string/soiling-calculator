-- Migration 010: Notification preferences + alert log
-- Enables configurable soiling threshold alerts via email

-- ── notification_preferences ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soiling_threshold_warning numeric NOT NULL DEFAULT 5.0,
  soiling_threshold_urgent numeric NOT NULL DEFAULT 10.0,
  email_alerts_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prefs"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own prefs"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own prefs"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── notification_log (cooldown per plant: 1 alert / 24h) ───────────────────

CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id uuid NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('warning', 'urgent')),
  soiling_percent numeric NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Service role inserts alert logs; users can read their own
CREATE POLICY "Service insert logs"
  ON notification_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users read own logs"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- Index for cooldown lookup: recent alerts per user+plant
CREATE INDEX idx_notification_log_cooldown
  ON notification_log (user_id, plant_id, sent_at DESC);
