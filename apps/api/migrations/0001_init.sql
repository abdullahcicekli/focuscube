-- Initial schema: users, sessions, focus_sessions.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mode_id TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_focus_sessions_user_date ON focus_sessions (user_id, date);
CREATE INDEX idx_focus_sessions_user_completed ON focus_sessions (user_id, completed_at);
