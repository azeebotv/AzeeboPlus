-- Add denormalized categories + creatorName to the search index's
-- content_items so the universal search endpoint can power the web search
-- page's category filter and creator chip without a second lookup.
-- `categories` mirrors the content_categories relation (category names);
-- `creatorName` mirrors creator_profiles.displayName. Both are returned (not
-- filtered), so no index is needed beyond the existing ones.
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "creatorName" TEXT;
