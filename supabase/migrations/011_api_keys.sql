-- Migration 011: API Keys for Public REST API
-- Enables stateless authentication via Bearer tokens

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{plants:read,readings:read,readings:write}',
  last_used_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own keys"
  ON api_keys FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own keys"
  ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own keys"
  ON api_keys FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own keys"
  ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- Index for fast key lookup during API auth
CREATE INDEX idx_api_keys_hash ON api_keys (key_hash) WHERE is_active = true;
