-- Migration 012: Inverter integrations for automated reading sync
-- Stores per-plant integration config with encrypted credentials (AES-256-GCM)

CREATE TABLE IF NOT EXISTS inverter_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider config
  provider text NOT NULL CHECK (provider IN ('solaredge', 'huawei')),

  -- Encrypted credentials (AES-256-GCM, base64-encoded)
  -- SolarEdge: { apiKey, siteId }
  -- Huawei: { userName, systemCode, region }
  credentials_encrypted text NOT NULL,
  credentials_iv text NOT NULL,
  credentials_tag text NOT NULL,

  -- External identifier (NOT secret, used for display/dedup)
  external_site_id text,

  -- Sync state
  is_active boolean NOT NULL DEFAULT true,
  sync_enabled boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  last_sync_status text CHECK (last_sync_status IN ('success', 'partial', 'error')),
  last_sync_error text,
  last_sync_readings_count integer DEFAULT 0,
  consecutive_failures integer NOT NULL DEFAULT 0,
  next_sync_after timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One integration per plant
  UNIQUE(plant_id)
);

ALTER TABLE inverter_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users read own integrations"
  ON inverter_integrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own integrations"
  ON inverter_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own integrations"
  ON inverter_integrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own integrations"
  ON inverter_integrations FOR DELETE USING (auth.uid() = user_id);

-- Index for cron: active integrations with sync enabled
CREATE INDEX idx_integrations_active_sync
  ON inverter_integrations (is_active, sync_enabled)
  WHERE is_active = true AND sync_enabled = true;

CREATE INDEX idx_integrations_plant
  ON inverter_integrations (plant_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inverter_integrations_updated_at
  BEFORE UPDATE ON inverter_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
