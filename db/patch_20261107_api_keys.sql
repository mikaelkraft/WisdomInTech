-- Migration: Add developer API keys table for external headless projects API
CREATE TABLE IF NOT EXISTS wisdomintech.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES wisdomintech.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['projects:read'],
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON wisdomintech.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash_active ON wisdomintech.api_keys(key_hash) WHERE is_active = true;
