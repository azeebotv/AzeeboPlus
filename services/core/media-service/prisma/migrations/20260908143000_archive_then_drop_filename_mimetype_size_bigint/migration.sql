-- Media-service schema sync — REVIEWED
--
-- Reconciles media_uploads to schema.prisma: introduces fileName/mimeType,
-- retires the legacy filename/mimetype columns (archive-then-drop), and
-- widens `size` INT→BIGINT.
--
-- Why archive-then-drop: Prisma migrate diff models this drift as RENAME
-- (which preserves data), but the platform's reviewed policy for legacy
-- columns is archive-then-drop (extensive-report §4): legacy names land in
-- the archive schema, the table keeps only schema.prisma columns. New rows
-- already write fileName/mimeType (upload.service.ts).
--
-- Order matters: on a fresh replay, init creates filename/mimetype (NOT
-- NULL) with no fileName/mimeType — so the new columns are added and
-- backfilled BEFORE the legacy columns are dropped. On the live dev DB the
-- rename predecessor already renamed them, so every branch here is a no-op
-- except the widening; the pre-rename values survive inside the renamed
-- columns themselves.
--
-- Verification (2026-09-10, dev DB):
--   media_uploads: 4 rows; fileName/mimeType/size NOT NULL, content intact
--     after the applied rename predecessor; 0 rows in media_uploads archive
--     schemas (none existed).
--   Replay: chain (init → this) must equal schema.prisma exactly —
--     fileName, mimeType, size BIGINT present; filename/mimetype absent.

-- Widen size first (lossless INT→BIGINT; rows keep their values).
ALTER TABLE "media_uploads" ALTER COLUMN "size" SET DATA TYPE BIGINT;

-- Introduce the schema columns if a fresh replay path still has legacy
-- names (no-op on live DB where the rename already ran).
ALTER TABLE "media_uploads" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "media_uploads" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;

-- Backfill from the legacy columns (only where they exist), then enforce
-- NOT NULL — the backfill guarantees every row has a value. The UPDATEs run
-- inside the DO block because Postgres parses column references even when
-- the WHERE excludes all rows: on the live DB the rename predecessor already
-- removed filename/mimetype, so an unguarded UPDATE would fail at parse time
-- (caught live: E42702/E42703 on the first deploy attempt).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'media_uploads' AND column_name = 'filename') THEN
    UPDATE "media_uploads" SET "fileName" = "filename" WHERE "fileName" IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'media_uploads' AND column_name = 'mimetype') THEN
    UPDATE "media_uploads" SET "mimeType" = "mimetype" WHERE "mimeType" IS NULL;
  END IF;
END $$;
ALTER TABLE "media_uploads" ALTER COLUMN "fileName" SET NOT NULL;
ALTER TABLE "media_uploads" ALTER COLUMN "mimeType" SET NOT NULL;

-- Archive namespace (idempotent)
CREATE SCHEMA IF NOT EXISTS archive;

-- Archive the legacy columns, then drop them. Idempotent: the rename
-- predecessor may have already removed filename/mimetype (live DB), in
-- which case an empty archive shell records that the retirement ran.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'media_uploads' AND column_name = 'filename') THEN
    CREATE TABLE IF NOT EXISTS archive.media_uploads_20260910 AS
      SELECT id, filename, mimetype, now() AS archived_at FROM "media_uploads";
  ELSE
    CREATE TABLE IF NOT EXISTS archive.media_uploads_20260910 (
      id TEXT,
      filename TEXT,
      mimetype TEXT,
      archived_at TIMESTAMPTZ
    );
  END IF;
END $$;

ALTER TABLE "media_uploads" DROP COLUMN IF EXISTS "filename";
ALTER TABLE "media_uploads" DROP COLUMN IF EXISTS "mimetype";
