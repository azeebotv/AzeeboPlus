-- Typo-tolerant (fuzzy) search: enable trigram similarity so candidate
-- retrieval can be computed in SQL (similarity() + ILIKE '%…%') instead of a
-- bounded in-process pool. The GIN trigram indexes back BOTH similarity()
-- comparisons and ILIKE substring patterns, so fuzzy search scales with the
-- catalog size rather than a fixed pool cap.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS content_items_title_trgm_idx
  ON content_items USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS content_items_description_trgm_idx
  ON content_items USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS creator_profiles_displayName_trgm_idx
  ON creator_profiles USING gin ("displayName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS creator_profiles_bio_trgm_idx
  ON creator_profiles USING gin (bio gin_trgm_ops);

CREATE INDEX IF NOT EXISTS universes_name_trgm_idx
  ON universes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS universes_displayName_trgm_idx
  ON universes USING gin ("displayName" gin_trgm_ops);
