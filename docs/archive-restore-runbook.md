# Archive Schema Restore Runbook — Azeebo+

> Companion to `RUNBOOK.md` ("Archive Schema Retention Cleanup") and
> `docs/DEPRECATION_POLICY.md` ("Data Retention — Archived Tables").
> This document is the **service-by-service, audited** version of the generic
> restore recipe, with the live table inventory, row counts, and the caveats
> that matter when you actually restore something.

## What's in the `archive` schema, and why

Destructive migrations copy dropped tables/columns into the dedicated
`archive` schema (outside `public`, so Prisma introspection and the CI drift
gates never see it) before dropping them, giving a **recovery window**. Each
archive table is named either with a dated cutover suffix (`_YYYYMMDD`) or —
for two migrations — without one, by copying every member of a table list.

**This runbook covers the six services that currently have an `archive`
schema on the live DB.** Row counts below were taken from the local cluster
at audit time; treat them as a snapshot, not a guarantee — re-run the inventory
before any restore.

---

## Inventory (as of audit date)

### 1. `azeebo_user` — `archive.users_legacy_auth_20260908`

| Property | Value |
|----------|-------|
| Created by | `services/core/user-service/prisma/migrations/20260908113000_user_schema_sync/migration.sql` |
| Cutover | 2026-09-08 (auth migration: `users.password`, `mfaEnabled`, `mfaSecret`, `mfaBackupCodes`, `isVerified`, `preferences` dropped; `preferences` backfilled into `user_profiles`) |
| Rows | **18** |
| Columns | `id, userId, email, password, mfaEnabled, mfaSecret, mfaBackupCodes, isVerified, preferences, archivedAt` |
| Source table | `public.users` still exists but no longer has `password`/`mfa*`/`isVerified`/`preferences` |
| Sensitivity | **Highest** — password hashes, MFA TOTP secrets, MFA backup codes, emails, preferences JSON. Treat access like access to a password store. |
| Retention | 90 days — destroy on **2026-12-07** (per `docs/DEPRECATION_POLICY.md`) |
| Drop status | Not yet dropped — retention window still open |

This is the only archive table explicitly classified as credential-grade in
policy. It is the highest-value restore target and the highest-sensitivity one.

### 2. `azeebo_notification` — 7 tables

Created by `services/engagement/notification-service/prisma/migrations/20260908150000_retire_fossil_domain_tables/migration.sql` (retires fossil domain tables cloned from an early all-in-one template; tables verified empty before migration except `users`).

| Table | Rows | Columns | Source table still exists? |
|-------|------|---------|----------------------------|
| `archive.users_20260908` | **6** | `id, email, password, displayName, avatar, phone, role, preferences, notificationPreferences, createdAt, updatedAt` | No — `public.users` was dropped here |
| `archive.payment_intents_20260908` | 0 | `id, userId, amount, currency, status, description, providerReference, metadata, completedAt, createdAt, updatedAt` | n/a |
| `archive.refunds_20260908` | 0 | `id, paymentIntentId, amount, reason, status, providerReference, createdAt, updatedAt` | n/a |
| `archive.saved_items_20260908` | 0 | `id, userId, contentId, createdAt` | n/a |
| `archive.wallets_20260908` | 0 | `id, userId, balance, bonusBalance, promoBalance, currency, createdAt, updatedAt` | n/a |
| `archive.wallet_transactions_20260908` | 0 | `id, walletId, type, amount, status, description, reference, metadata, createdAt` | n/a |
| `archive.watch_history_20260908` | 0 | `id, userId, contentId, contentType, watchedAt, createdAt` | n/a |

Only `users_20260908` has data (6 rows). Restoring it re-creates the fossil
`users` table **without** the FK context the live DB no longer has; this is a
data-recovery restore, not a re-enablement of notification's user model (the
service's real user data lives in `azeebo_user` now).

### 3. `azeebo_media` — `archive.media_uploads_20260910`

Created by `services/core/media-service/prisma/migrations/20260908143000_archive_then_drop_filename_mimetype_size_bigint/migration.sql` (retires the legacy `filename`/`mimetype` columns, archive-then-drop; widen `size` INT→BIGINT).

| Property | Value |
|----------|-------|
| Rows | 0 |
| Columns | `id, filename, mimetype, archived_at` |
| Source table | `public.media_uploads` still exists (holds current schema columns only) |
| Notes | The archive holds the legacy `filename`/`mimetype` values that were removed from `media_uploads`. With 0 rows, there's nothing to restore — but the table documents that the retirement ran. A non-empty archive here would mean a filename/mimetype backfill is recoverable. |

### 4. `azeebo_creator` — 2 tables

Created by `services/universes/creator-service/prisma/migrations/20260908120000_wallet_retirement_and_fk_anchors/migration.sql` (wallets retirement; wallets/wallet_transactions dropped after archiving).

| Table | Rows | Columns | Source table still exists? |
|-------|------|---------|----------------------------|
| `archive.wallets_backup_20260908` | 0 | `id, userId, balance, currency, createdAt, updatedAt` | No — dropped |
| `archive.wallet_transactions_backup_20260908` | 0 | `id, walletId, type, amount, description, reference, createdAt` | No — dropped |

Both empty. A restore would re-create the wallet tables standalone, but the
service's current wallet data lives in `azeebo_wallet` now; these archives
are the cutover safety net, not active data.

### 5. `azeebo_recommendation` — 25 fossil tables (no dated suffix)

Created by `services/intelligence/recommendation-service/prisma/migrations-legacy/20260908144000_retire_cross_domain_fossils/migration.sql` (retires 25 legacy tables cloned from an old all-in-one template — badges, wallets, missions, refunds, moderation, etc.; all verified 0 rows before the migration).

All 25 tables are empty. The archive copies them with `CREATE TABLE IF NOT EXISTS archive.<table> AS SELECT * FROM public.<table>`, so each archive table has the same columns as the now-dropped public table did.

| Archive tables (all empty) |
|----------------------------|
| `_BadgeToRewardAccount`, `_CategoryToContentItem`, `_ContentItemToTag`, `appeals`, `badges`, `categories`, `levels`, `media_assets`, `mission_completions`, `mission_rewards`, `missions`, `moderation_cases`, `notifications`, `refunds`, `reports`, `reward_accounts`, `reward_redemptions`, `rewards`, `saved_items`, `search_query_logs`, `tags`, `user_searches`, `wallet_transactions`, `wallets`, `watch_history` |

**No dated suffix** — `scripts/archive-cleanup.mjs` cannot compute an age from
the name and has no `archivedAt` in its state file for these, so it treats them
as **KEEP** (never eligible for drop until a cutover date is recorded). This is
by design: the migration's header says "belt-and-braces so nothing is ever
dropped unrecoverable," and the tables being empty makes that cheap. If you
ever want these to expire, record the cutover date in
`scripts/archive-cleanup.state.json` (or rename the tables to add a `_YYYYMMDD`
suffix).

### 6. `azeebo_vertical` — 37 PascalCase legacy tables (no dated suffix)

Created by `services/universes/vertical-service/prisma/migrations-legacy/20260908151000_universe_centric_rename_and_copy/migration.sql` (universe-centric rename and copy; 37 old PascalCase tables archived before drop).

**6 of these tables have real data** — the ones worth restoring:

| Table | Rows | Notes |
|-------|------|-------|
| `AgbalaCharacter` | **10** | Character definitions for the legacy Agbala universe |
| `AgbalaTitle` | **6** | Titles (the legacy "show"/story unit) |
| `AgbalaOrisaFile` | **5** | Orisa file content |
| `AgbalaQuizQuestion` | **5** | Quiz questions |
| `AgbalaRealm` | **5** | Realms |
| `Storyworld` | **1** | The legacy storyworld root |

The remaining 31 tables are empty (e.g. `AgbalaArtifact`, `AgbalaMap`,
`AgbalaCharacterProphecy`, `Chapter`, `Crossover`, `Title`, etc.).

**No dated suffix** — same KEEP-always situation as recommendation. The
migration header says the copies above left these at 0 rows *after the copies*,
but the live DB shows 6 tables still holding data, so the archive is the only
record of that legacy universe's content. **This is the only archive where a
restore is actually meaningful today** — recreating the legacy Agbala universe's
content tables.

All 37 archive tables use plain `id` columns (no serial/identity), so restoring
does not require sequence reseeding.

**Live row tally (audit snapshot):** 32 rows across the 6 non-empty tables
(AgbalaCharacter 10 + AgbalaTitle 6 + AgbalaOrisaFile 5 + AgbalaQuizQuestion 5
+ AgbalaRealm 5 + Storyworld 1); the other 31 tables are empty.

---

## Generic restore recipe (verified)

For any archive table, the restore pattern is the same as `RUNBOOK.md`
documents:

```sql
-- 1. Recreate the table in public with the archive's column defs, indexes,
--    constraints, and storage parameters:
CREATE TABLE public.<table> (LIKE archive.<table> INCLUDING ALL);

-- 2. Copy the data:
INSERT INTO public.<table> SELECT * FROM archive.<table>;

-- 3. If the restored table must receive new writes, confirm the id space:
--    the archive still holds max(id); new rows must start above it.
--    (No sequence to reset — all archive tables use plain id columns.)
SELECT max(id) FROM public.<table>;
```

`INCLUDING ALL` copies column definitions, not null constraints, defaults,
storage parameters, and indexes. It does **not** copy foreign keys — archive
tables were created with `CREATE TABLE ... AS SELECT`, so they have no FK
constraints; if the restored table needs FKs to other tables, add them
explicitly after the restore.

**Important:** the `archive` schema is recreated by migrations on fresh
environments (the `CREATE SCHEMA IF NOT EXISTS archive` + `CREATE TABLE IF
NOT EXISTS archive.<table>` live in already-shipped migrations). On a new DB
the archive tables exist but are **empty** — the restore recipe above only
makes sense on a DB that predates the cutover and actually holds archived rows.

---

## Service-by-service restore procedures

### `azeebo_user` — restore `users_legacy_auth_20260908`

**When to use:** auth cutover rollback decision, incident where a user's legacy
credential state must be recovered, legal/dispute hold. **Not for routine
operations.**

**Pre-restore checklist:**
1. Confirm the reason is legitimate and documented (ticket/incident reference).
2. Confirm no other restore of the same table is in progress.
3. Confirm access to the DB is via a connection that can see the `archive`
   schema (it's not introspected by Prisma, so service clients won't see it —
   use `psql` or a direct SQL client).

**Restore:**
```sql
BEGIN;
CREATE TABLE public.users_legacy_auth_20260908
  (LIKE archive.users_legacy_auth_20260908 INCLUDING ALL);
INSERT INTO public.users_legacy_auth_20260908
  SELECT * FROM archive.users_legacy_auth_20260908;
COMMIT;
```

**Validation:**
```sql
-- row count matches archive
SELECT count(*) FROM public.users_legacy_auth_20260908;       -- expect 18
SELECT count(*) FROM archive.users_legacy_auth_20260908;      -- expect 18

-- spot-check credential-grade columns present
SELECT "userId", email, mfaEnabled, mfaSecret IS NOT NULL AS has_totp,
       mfaBackupCodes IS NOT NULL AS has_backup_codes
FROM public.users_legacy_auth_20260908
LIMIT 3;
```

**Sensitivity reminder:** this table contains password hashes and MFA secrets.
After restore, restrict access, log the restore, and plan to re-drop it once
the recovery reason is resolved. Do **not** leave it in `public` as a
long-lived table.

**Rollback:**
```sql
DROP TABLE public.users_legacy_auth_20260908;
```

### `azeebo_notification` — restore `users_20260908` (the only non-empty table)

**When to use:** data recovery of the 6 rows of legacy notification users.
This is a standalone data table with no FK context in notification anymore.

**Restore:**
```sql
BEGIN;
CREATE TABLE public.users_20260908
  (LIKE archive.users_20260908 INCLUDING ALL);
INSERT INTO public.users_20260908
  SELECT * FROM archive.users_20260908;
COMMIT;
```

**Validation:**
```sql
SELECT count(*) FROM public.users_20260908;       -- expect 6
SELECT count(*) FROM archive.users_20260908;      -- expect 6
```

**Rollback:**
```sql
DROP TABLE public.users_20260908;
```

For the other 6 empty tables in this DB, there is nothing to restore — the
archive tables are empty shells documenting that the fossil tables were
dropped. If you ever need to recover one of them (e.g. a future row appears),
the same recipe applies.

### `azeebo_media` — `media_uploads_20260910` (empty)

Nothing to restore (0 rows). The archive exists to document that the legacy
`filename`/`mimetype` columns were retired. If a filename/mimetype backfill
is ever needed and the archive is non-empty, the recipe is:

```sql
BEGIN;
CREATE TABLE public.media_uploads_legacy_<date>
  (LIKE archive.media_uploads_20260910 INCLUDING ALL);
INSERT INTO public.media_uploads_legacy_<date>
  SELECT * FROM archive.media_uploads_20260910;
COMMIT;
```

Note: this restores only `filename`/`mimetype`/`id`/`archived_at` — the live
`media_uploads` table's current columns are not in this archive. A full column
backfill would need a join on `id` against the live table. **No FKs in the
archive** (it was `CREATE TABLE ... AS SELECT`), so no FK re-creation needed.

### `azeebo_creator` — `wallets_backup_20260908` / `wallet_transactions_backup_20260908` (both empty)

Nothing to restore (0 rows). These are the cutover safety net for the wallet
retirement; creator's current wallet data lives in `azeebo_wallet`. If a
future row appears, restore with the generic recipe — but re-creating these
tables in `public` would not reconnect them to the service's current wallet
model.

### `azeebo_recommendation` — 25 fossil tables (all empty)

Nothing to restore. All 25 tables are empty; the archive exists as a
belt-and-braces safety net ("nothing is ever dropped unrecoverable"). The
tables have no dated suffix, so `archive-cleanup.mjs` will never drop them
until a cutover date is recorded.

### `azeebo_vertical` — 37 legacy Agbala tables (8 with data)

**When to use:** recreating the legacy Agbala universe's content — e.g. a
feature revival, data migration to the new universe model, or an audit where
the legacy content must be examined. This is the only archive with meaningful
data today.

**Pre-restore checklist:**
1. Decide which tables to restore — the 8 with data are the likely candidates;
   restore the full set only if you need referential completeness (the legacy
   FKs are not in the archive, so referential integrity is partial).
2. Decide the target schema — restore to `public` for a full re-creation, or
   to a new schema (e.g. `legacy_agbala`) to inspect without colliding with
   any current tables.
3. Confirm no current `public` tables share these names (they don't — the
   PascalCase tables were dropped).

**Restore (all 37, to public):**
```sql
BEGIN;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'AgbalaArtifact','AgbalaArtifactTitle','AgbalaAssemblyRoom','AgbalaBlackCurrentExposure',
    'AgbalaCharacter','AgbalaCharacterProphecy','AgbalaCharacterRealm','AgbalaCharacterTimeline',
    'AgbalaMap','AgbalaMapNode','AgbalaMemoryFile','AgbalaOrisaFile','AgbalaProphecy',
    'AgbalaProphecyTitle','AgbalaQuizQuestion','AgbalaQuizResult','AgbalaRealm','AgbalaRoomPost',
    'AgbalaTheory','AgbalaTitle','AgbalaTitleChapter','AgbalaTitleCharacter','AgbalaUnlockRule',
    'AgbalaUserArchiveState','Chapter','Character','CharacterLocation','CharacterRelationship',
    'Crossover','CrossoverTitle','Location','LoreEntry','Recap','Storyworld','TimelineEvent',
    'Title','UniverseMap'
  ]
  LOOP
    EXECUTE format('CREATE TABLE public.%I (LIKE archive.%I INCLUDING ALL)', t, t);
    EXECUTE format('INSERT INTO public.%I SELECT * FROM archive.%I', t, t);
  END LOOP;
END $$;
COMMIT;
```

**Restore (only the 6 with data, to a named schema for inspection):**
```sql
BEGIN;
CREATE SCHEMA IF NOT EXISTS legacy_agbala;
CREATE TABLE legacy_agbala.AgbalaCharacter
  (LIKE archive.AgbalaCharacter INCLUDING ALL);
INSERT INTO legacy_agbala.AgbalaCharacter
  SELECT * FROM archive.AgbalaCharacter;
-- repeat for the other 7 with data ...
COMMIT;
```

**Validation:**
```sql
-- row counts per table (compare to the inventory above)
SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'legacy_agbala')
  AND relname IN (
    'AgbalaCharacter','AgbalaOrisaFile','AgbalaQuizQuestion',
    'AgbalaRealm','AgbalaTitle','Storyworld'
  )
ORDER BY relname;
```

**Expect (6 tables with data):**
- `AgbalaCharacter` 10, `AgbalaTitle` 6, `AgbalaOrisaFile` 5,
  `AgbalaQuizQuestion` 5, `AgbalaRealm` 5, `Storyworld` 1.
- The other 31 archive tables remain empty after restore.

**Rollback (public restore):**
```sql
DROP TABLE "AgbalaCharacter", "AgbalaOrisaFile", "AgbalaQuizQuestion",
      "AgbalaRealm", "AgbalaTitle", "Storyworld",
      "AgbalaArtifact", "AgbalaArtifactTitle", "AgbalaAssemblyRoom",
      "AgbalaBlackCurrentExposure", "AgbalaCharacterProphecy",
      "AgbalaCharacterRealm", "AgbalaCharacterTimeline", "AgbalaMap",
      "AgbalaMapNode", "AgbalaMemoryFile", "AgbalaProphecy",
      "AgbalaProphecyTitle", "AgbalaQuizResult", "AgbalaRoomPost",
      "AgbalaTheory", "AgbalaTitleChapter", "AgbalaTitleCharacter",
      "AgbalaUnlockRule", "AgbalaUserArchiveState", "Chapter",
      "Character", "CharacterLocation", "CharacterRelationship",
      "Crossover", "CrossoverTitle", "Location", "LoreEntry", "Recap",
      "Title", "TimelineEvent", "UniverseMap";
DROP SCHEMA IF EXISTS legacy_agbala;  -- if you used the named-schema approach
```

**Caveat — referential integrity:** the archive tables were created with
`CREATE TABLE ... AS SELECT`, so they carry **no foreign keys**. The legacy
universe had FKs among these tables (e.g. `AgbalaCharacterRealm` → realm +
character, `AgbalaTitleChapter` → title); restoring to `public` does **not**
re-create those FKs. If you need referential integrity, add the FKs
explicitly after the restore, using the original FK definitions from the
migration that dropped them (in
`services/universes/vertical-service/prisma/migrations-legacy/20260908151000_universe_centric_rename_and_copy/migration.sql`).

---

## Retention and drop status (as of audit date)

| DB | Archive table | Rows | Cutover date known? | Retention window | Drop status |
|----|---------------|------|---------------------|------------------|-------------|
| azeebo_user | `users_legacy_auth_20260908` | 18 | Yes — 2026-09-08 | 90 days → 2026-12-07 | Not dropped; window open |
| azeebo_notification | `users_20260908` | 6 | Yes — 2026-09-08 | 90 days → 2026-12-07 | Not dropped; window open |
| azeebo_notification | `payment_intents_20260908` | 0 | Yes | 90 days | Not dropped |
| azeebo_notification | `refunds_20260908` | 0 | Yes | 90 days | Not dropped |
| azeebo_notification | `saved_items_20260908` | 0 | Yes | 90 days | Not dropped |
| azeebo_notification | `wallets_20260908` | 0 | Yes | 90 days | Not dropped |
| azeebo_notification | `wallet_transactions_20260908` | 0 | Yes | 90 days | Not dropped |
| azeebo_notification | `watch_history_20260908` | 0 | Yes | 90 days | Not dropped |
| azeebo_media | `media_uploads_20260910` | 0 | Yes — 2026-09-10 | 90 days → 2026-12-09 | Not dropped; window open |
| azeebo_creator | `wallets_backup_20260908` | 0 | Yes — 2026-09-08 | 90 days | Not dropped |
| azeebo_creator | `wallet_transactions_backup_20260908` | 0 | Yes — 2026-09-08 | 90 days | Not dropped |
| azeebo_recommendation | 25 fossil tables | 0 | **No** | KEEP until dated | Not dropped; cannot age |
| azeebo_vertical | 37 legacy tables | 6 tables non-empty | **No** | KEEP until dated | Not dropped; cannot age |

The two "no cutover date" cases (recommendation, vertical) are the gap:
`archive-cleanup.mjs` classifies them as KEEP and they will never be dropped
until someone records a cutover date. For recommendation that's fine (empty,
belt-and-braces). For vertical, the 8 tables with data are the ones where a
future drop decision will need a date.

---

## Backup and PITR caveat

The platform has an encrypted daily database backup workflow
(`.github/workflows/database-backup.yml` + `scripts/encrypted-db-backup.sh` —
pg_dump → GPG(AES256) → S3, 30-day retention, per-DB dumps). The backup
story is **database-level**, not table-level: a backup contains the `archive`
schema and its tables as part of the whole DB dump.

Two consequences for archive restore:

1. **Before the archive table is dropped**, you have two restore paths:
   - Fast path: `CREATE TABLE public.<table> (LIKE archive.<table> INCLUDING ALL); INSERT ... SELECT * FROM archive.<table>` (this runbook's recipe).
   - Full path: restore the whole DB from the most recent backup to an isolated
     instance and extract the table. Use this only if the archive table itself
     is corrupted or missing.

2. **After the archive table is dropped**, the archive-schema recipe no longer
   works. Restore then requires PITR to a point **before** the `DROP TABLE`,
   using the WAL/archive backups. Per `docs/DEPRECATION_POLICY.md`, backup
   retention is ~30–35 days, so erasure is complete only when both the archive
   table is dropped **and** backups containing it have aged out. Record the
   drop date so the erasure-completion date is known (drop date + backup
   retention).

**Bottom line:** the archive schema is the fast, surgical restore path. Don't
drop an archive table you might need to restore from — once it's gone, you're
in PITR territory.

---

## Audit gaps and recommendations

1. **Two archives have no cutover date** (recommendation, vertical). If either
   should ever expire, record the date — either by renaming the tables to add a
   `_YYYYMMDD` suffix, or by adding an `archivedAt` entry in
   `scripts/archive-cleanup.state.json`. For vertical, the 8 tables with data
   are the priority: a future drop decision will need a date.

2. **`azeebo_user.archive.users_legacy_auth_20260908` is credential-grade and
   still present.** It's within its 90-day retention window until 2026-12-07.
   The pre-drop checklist in `docs/DEPRECATION_POLICY.md` (auth healthy 60+ days,
   `user_profiles` backfill spot-checked, no legal hold, sign-off recorded)
   should be completed and the retention log updated before the 2026-12-07
   deadline.

3. **`azeebo_media.archive.media_uploads_20260910` is empty** — there's
   nothing to restore, but its presence documents the filename/mimetype
   retirement. If a future migration adds rows to it (e.g. a backfill that
   needs a rollback path), treat it like any other non-empty archive.

4. **No archive table has foreign keys** (all were `CREATE TABLE ... AS
   SELECT`). The runbook's restore recipes re-create the table and data but
   not FKs. If a restored table must participate in FK relationships, add the
   FKs explicitly after the restore. The FK definitions are in the migrations
   that dropped the source tables.

5. **No archive table uses a serial/identity `id`** (all are plain `id`). Restoring
   does not require sequence reseeding. If a restored table will receive new
   writes, ensure new `id` values start above `max(id)` from the restored data.

6. **Inventory is a snapshot.** Re-run the row-count survey (the `pg_stat_user_tables`
   query in the service-by-service sections) before any restore — the numbers
   above reflect the local cluster at audit time.

---

## Ownership

| Archive | Owning service | DB | Restoring service (if different) |
|---------|----------------|----|----------------------------------|
| `users_legacy_auth_20260908` | user-service | azeebo_user | user-service (auth team) |
| notification fossil archives | notification-service | azeebo_notification | notification-service |
| `media_uploads_20260910` | media-service | azeebo_media | media-service |
| `wallets_backup_20260908` / `wallet_transactions_backup_20260908` | creator-service | azeebo_creator | creator-service (wallet team for context) |
| 25 fossil tables | recommendation-service | azeebo_recommendation | recommendation-service |
| 37 legacy Agbala tables | vertical-service | azeebo_vertical | vertical-service (universe team) |

Restores that touch credential-grade data (`users_legacy_auth_20260908`) or
that recreate dropped tables in a live service's DB should be approved by the
owning service's on-call and, where the data is sensitive, by the security lead.
The operational cleanup path (drop, sign-off, state file) is governed by
`docs/DEPRECATION_POLICY.md` and `RUNBOOK.md`.
