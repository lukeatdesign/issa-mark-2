-- ============================================================
-- Demo auth tables used by the current /register and /login flow
-- ============================================================

CREATE TABLE IF NOT EXISTS mock_users (
  username      text PRIMARY KEY,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mock_sessions (
  token      text PRIMARY KEY,
  username   text NOT NULL REFERENCES mock_users(username) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mock_sessions_username_idx
  ON mock_sessions (username);

-- Only the backend should access these via the service role.
ALTER TABLE mock_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_sessions ENABLE ROW LEVEL SECURITY;
