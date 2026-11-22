CREATE TABLE home (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  draft TEXT NOT NULL,
  published TEXT NOT NULL,
  previous TEXT,
  revision INTEGER NOT NULL DEFAULT 1
);

INSERT INTO home (id, draft, published)
VALUES (
  1,
  '{"cover":"approved","photo":null,"sections":[{"id":"available","visible":true},{"id":"references","visible":true}],"highlights":[]}',
  '{"cover":"original","photo":null,"sections":[{"id":"available","visible":true},{"id":"references","visible":true}],"highlights":[]}'
);

ALTER TABLE pieces ADD COLUMN sold INTEGER NOT NULL DEFAULT 0 CHECK (sold IN (0, 1));

CREATE TRIGGER remove_unavailable_highlights
AFTER UPDATE OF published ON pieces
WHEN OLD.published = 1 AND NEW.published = 0
BEGIN
  UPDATE home
  SET draft = json_set(draft, '$.highlights', json((
        SELECT json_group_array(value) FROM json_each(draft, '$.highlights') WHERE value <> NEW.id
      ))),
      published = json_set(published, '$.highlights', json((
        SELECT json_group_array(value) FROM json_each(published, '$.highlights') WHERE value <> NEW.id
      ))),
      previous = json_set(previous, '$.highlights', json((
        SELECT json_group_array(value) FROM json_each(previous, '$.highlights') WHERE value <> NEW.id
      ))),
      revision = revision + 1
  WHERE EXISTS (
    SELECT 1 FROM json_each(draft, '$.highlights') WHERE value = NEW.id
    UNION ALL
    SELECT 1 FROM json_each(published, '$.highlights') WHERE value = NEW.id
    UNION ALL
    SELECT 1 FROM json_each(previous, '$.highlights') WHERE value = NEW.id
  );
END;
