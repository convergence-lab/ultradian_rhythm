CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('activity', 'rest')),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  planned_minutes INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  energy_before INTEGER,
  energy_after INTEGER,
  focus_rating INTEGER,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
