ALTER TABLE pieces ADD COLUMN measurements TEXT NOT NULL DEFAULT '';
ALTER TABLE pieces ADD COLUMN legacy_slug TEXT;
ALTER TABLE pieces ADD COLUMN reference INTEGER NOT NULL DEFAULT 0
  CHECK (reference IN (0, 1) AND (reference = 0 OR
    (published = 0 AND sold = 0 AND name <> '' AND format <> '' AND photo IS NOT NULL)));

CREATE UNIQUE INDEX pieces_legacy_slug ON pieces (legacy_slug) WHERE legacy_slug IS NOT NULL;

CREATE TABLE piece_angles (
  piece_id TEXT NOT NULL REFERENCES pieces(id),
  position INTEGER NOT NULL CHECK (position > 0),
  photo TEXT NOT NULL,
  alt TEXT NOT NULL,
  PRIMARY KEY (piece_id, position)
);
