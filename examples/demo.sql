-- Entirely fictional text and identifiers. No source publication is represented.
CREATE TABLE sentences (
  id TEXT PRIMARY KEY, article TEXT, title TEXT, source_id TEXT,
  page_pdf INTEGER, frequency_eligible INTEGER, canonical_verified INTEGER,
  text TEXT, word_count INTEGER
);
CREATE TABLE jev_labels (
  sentence_id TEXT, label TEXT, choice TEXT, choice_probability REAL
);
INSERT INTO sentences VALUES
  ('demo-1', 'demo:paper-a', 'Fictional snow study', 'demo:source-a', 4, 1, 0,
   'These assumptions may underestimate melt.', 6),
  ('demo-2', 'demo:paper-b', 'Fictional ice study', 'demo:source-b', 9, 1, 0,
   'The estimate provides an upper bound.', 7);
-- Fabricated label for demonstrating filtering; not a real Jev response.
INSERT INTO jev_labels VALUES ('demo-1', 'certainty', 'possible', 0.94);
