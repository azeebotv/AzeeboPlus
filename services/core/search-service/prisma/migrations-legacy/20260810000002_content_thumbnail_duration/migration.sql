-- Add thumbnail + duration to the search index's content_items so the
-- universal search endpoint can power the web search page (thumbnails,
-- duration chip) without a second lookup.
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS duration INTEGER;

-- GIN trigram indexes from the pg_trgm migration don't cover these columns,
-- but they're returned (not filtered), so no index is needed.
