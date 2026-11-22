CREATE TABLE admin_sessions (
  digest TEXT PRIMARY KEY,
  credential TEXT NOT NULL,
  expires INTEGER NOT NULL
);

CREATE TABLE admin_login_limit (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  expires INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
