CREATE TABLE pieces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  price INTEGER,
  photo TEXT,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1,
  CHECK (price IS NULL OR price BETWEEN 1 AND 99999999),
  CHECK (published = 0 OR (name <> '' AND format <> '' AND price IS NOT NULL AND photo IS NOT NULL))
);
