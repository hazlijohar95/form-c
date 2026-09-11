CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  ya INTEGER NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_engagements_ya ON engagements(ya);
