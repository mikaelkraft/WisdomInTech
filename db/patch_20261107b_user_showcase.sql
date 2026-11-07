-- Patch 20261107b: User Portfolio Showcase, Workspaces, Repositories, and Agent Tasks
-- Adds username handle, skills array, and theme preferences to user_profiles
-- Introduces tables for project collaboration, connected repositories, and project agent tasks

ALTER TABLE wisdomintech.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'cyberpunk';

-- Auto-backfill existing users without a username using sanitized email prefix
UPDATE wisdomintech.user_profiles
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
WHERE username IS NULL AND email IS NOT NULL;

-- If any duplicate exists or empty, append random suffix
UPDATE wisdomintech.user_profiles
SET username = LOWER(COALESCE(NULLIF(username, ''), 'user')) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL OR username = '';

-- Ensure index for fast case-insensitive username lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_lower
ON wisdomintech.user_profiles (LOWER(username));

-- Project Collaboration: Project Members / Contributors
CREATE TABLE IF NOT EXISTS wisdomintech.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES wisdomintech.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES wisdomintech.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor', -- 'owner', 'editor', 'contributor', 'viewer'
  invited_by UUID REFERENCES wisdomintech.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id
ON wisdomintech.project_members (project_id);

CREATE INDEX IF NOT EXISTS idx_project_members_user_id
ON wisdomintech.project_members (user_id);

-- Connected Repositories: GitHub / GitLab Integration
CREATE TABLE IF NOT EXISTS wisdomintech.project_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES wisdomintech.projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'github', -- 'github', 'gitlab'
  repo_url TEXT NOT NULL,
  repo_full_name TEXT NOT NULL, -- e.g. 'octocat/Hello-World'
  default_branch TEXT DEFAULT 'main',
  webhook_secret TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, repo_url)
);

CREATE INDEX IF NOT EXISTS idx_project_repositories_project
ON wisdomintech.project_repositories (project_id);

-- Agent Workforce: Project Agent Tasks
CREATE TABLE IF NOT EXISTS wisdomintech.project_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES wisdomintech.projects(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'doc_generator', 'code_reviewer', 'release_notes', 'custom_webhook'
  status TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'queued', 'running', 'completed', 'failed'
  input_payload JSONB DEFAULT '{}',
  output_payload JSONB DEFAULT '{}',
  created_by UUID REFERENCES wisdomintech.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_agent_tasks_project
ON wisdomintech.project_agent_tasks (project_id);

-- Record patch in applied patches table if present
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'wisdomintech' AND table_name = '__applied_patches') THEN
    INSERT INTO wisdomintech.__applied_patches (patch_name)
    VALUES ('patch_20261107b_user_showcase')
    ON CONFLICT (patch_name) DO NOTHING;
  END IF;
END $$;
