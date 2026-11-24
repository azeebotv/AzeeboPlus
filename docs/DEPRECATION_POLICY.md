# Deprecation Policy — Azeebo+

This policy defines how we handle API deprecations and removals.

---

## Principles

1. **No Breaking Changes Without Notice** — All breaking changes require a deprecation period
2. **Clear Communication** — Deprecations are announced via multiple channels
3. **Reasonable Timeline** — Minimum 6 months between deprecation and removal
4. **Migration Support** — Provide migration guides for all deprecations

---

## Deprecation Lifecycle

### 1. Announcement (Month 0)
- Deprecation notice added to API response headers
- Announcement in changelog and release notes
- Email notification to affected API consumers
- Documentation updated with deprecation notice

### 2. Deprecation Period (Months 1-6)
- Deprecated endpoint returns `Sunset` header
- Deprecated endpoint returns `Deprecation` header
- Warning logged in analytics for usage tracking
- Migration guide published

### 3. Removal (Month 6+)
- Endpoint removed from API
- Returns 410 Gone for 30 days
- Returns 404 after 30-day grace period
- Final notification to remaining consumers

---

## HTTP Headers

### During Deprecation
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Mar 2025 00:00:00 GMT
Link: <https://docs.azeebo.com/migration/v1-to-v2>; rel="successor-version"
X-Deprecation-Notice: This endpoint will be removed on 2025-03-01. Migrate to /v2/users
```

### After Removal
```http
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": "GONE",
  "message": "This endpoint has been removed.",
  "migrationGuide": "https://docs.azeebo.com/migration/v1-to-v2",
  "alternativeEndpoints": ["/v2/users"]
}
```

---

## Versioning Strategy

### URL Versioning
- Current: `/v1/`
- Next: `/v2/`
- Version in URL path, not headers

### Deprecation Timeline
| Phase | Duration | Action |
|-------|----------|--------|
| Announce | Month 0 | Add deprecation headers |
| Warn | Months 1-6 | Track usage, notify consumers |
| Remove | Month 6+ | Return 410 Gone |
| Cleanup | Month 7+ | Return 404 |

---

## Affected Endpoints

### Currently Deprecated
| Endpoint | Deprecated | Removal Date | Alternative |
|----------|-----------|--------------|-------------|
| — | — | — | — |

### Recently Removed
| Endpoint | Removed | Was Deprecated | Alternative |
|----------|---------|----------------|-------------|
| — | — | — | — |

---

## Migration Guide Template

### Migrating from `/v1/{endpoint}` to `/v2/{endpoint}`

#### Changes
- Request body changes
- Response body changes
- Authentication changes

#### Before (v1)
```json
{
  "old_field": "value"
}
```

#### After (v2)
```json
{
  "new_field": "value"
}
```

#### Code Examples

**Before:**
```javascript
const response = await fetch('/v1/users');
```

**After:**
```javascript
const response = await fetch('/v2/users');
```

---

## Communication Channels

1. **API Response Headers** — Immediate notification
2. **Changelog** — Release notes
3. **Email** — Direct notification to registered API consumers
4. **Documentation** — Updated guides
5. **Status Page** — Announcements

---

## Exceptions

In rare cases, we may need to remove an endpoint with less notice:

- **Security vulnerability** — Immediate removal
- **Legal compliance** — As required by law
- **Critical bug** — If causing data loss or corruption

In these cases, we will:
1. Notify affected consumers immediately
2. Provide migration guide within 48 hours
3. Offer extended support for migration

---

## Data Retention — Archived Tables

When a destructive migration removes columns, their contents are first copied
into the dedicated `archive` schema (outside `public`, so Prisma introspection
and the CI drift gates never see it). Every archive table carries its cutover
date in its name and is destroyed on a fixed schedule.

### `archive.users_legacy_auth_20260908` (user-service DB)

| Property | Value |
|----------|-------|
| Created by | `services/core/user-service/prisma/migrations/20260908113000_user_schema_sync/migration.sql` |
| Archived | 2026-09-08 (auth cutover: `users.password`, `mfa*`, `isVerified`, `preferences` dropped) |
| Rows | 18 |
| Contents | **Credential-grade**: password hashes, MFA TOTP secrets, MFA backup codes, emails, preferences JSON |
| Sensitivity | Highest class — treat access to this table like access to a password store |
| Retention | **90 days** — destroy on **2026-12-07** |

**Why 90 days:** covers a full quarter of auth telemetry after the cutover —
enough for incident response or a rollback decision if the new auth flow
misbehaves. The data has no long-term value: passwords are recoverable via
reset, MFA is re-enrollable, and `preferences` was backfilled into
`user_profiles` by the same migration.

#### Pre-drop verification checklist (all must hold)

1. New auth path healthy for 60+ days (login success rate, no open incidents
   referencing the legacy columns or needing recovery from this backup).
2. `user_profiles` backfill spot-checked (displayName/avatar continuity).
3. No ticket, dispute, or legal hold requires the backup.
4. Sign-off recorded in this document's log below.

#### How to drop it safely

```sql
-- 0. Record final state for the audit note (run OUTSIDE the transaction):
--    SELECT count(*), count(DISTINCT "userId") FROM archive.users_legacy_auth_20260908;

-- 1. Confirm nothing depends on the table:
--    SELECT DISTINCT viewname FROM pg_views WHERE definition LIKE '%users_legacy_auth_20260908%';
--    (expect zero rows; there are no FKs to archive tables by design)

-- 2. Drop inside one transaction with an explicit lock:
BEGIN;
LOCK TABLE archive.users_legacy_auth_20260908 IN ACCESS EXCLUSIVE MODE;
DROP TABLE archive.users_legacy_auth_20260908;
COMMIT;
-- Storage is returned to the filesystem immediately (no VACUUM needed).

-- 3. Only if the archive schema is now empty AND no future archives are planned:
--    DROP SCHEMA archive;   -- fresh replays recreate it (see note below)
```

**Fresh-environment note:** the `CREATE TABLE` lives inside an already-shipped
(immutable) migration, so a replay on a new database recreates the archive
table — **empty** (0 rows). That is acceptable and self-documenting: the drop
procedure above only needs to run on environments that predate the cutover,
and on fresh environments it is a zero-risk no-op whenever someone notices it.

**Backups/WAL caveat:** PITR archives and base backups taken *before* the drop
still contain the table until they age out of backup retention (~30–35 days).
Erasure completes only when those backups expire; record the drop date
so the erasure completion date is known (drop date + backup retention).

#### Retention log

| Table | Archived | Verified | Dropped | Erasure complete (incl. backups) | Approved by |
|-------|----------|----------|---------|----------------------------------|-------------|
| `archive.users_legacy_auth_20260908` | 2026-09-08 | — | — | — | — |

#### Automated cleanup

`scripts/archive-cleanup.mjs` enforces this policy mechanically: it scans
every `azeebo_*` database, computes each archive table's age from its
`_YYYYMMDD` cutover suffix (or the `archivedAt` entry in
`scripts/archive-cleanup.state.json`), and classifies it as KEEP (inside the
retention window), HOLD (expired but not signed off), or DROP (expired and
signed off). Plan mode is the default; nothing is dropped without `--apply`,
and every drop is recorded in the state file's audit log. Operational
details (scheduling, sign-off format, emergency override, recovery SQL) are
in `RUNBOOK.md` — "Archive Schema Retention Cleanup". Tables without any
known cutover date are always KEEP — they must be dated (renamed with a
drop-then-rename, or added to the state file) before they can ever expire.

---

## Contact

For questions about deprecations:
- Email: api-support@azeebo.com
- Discord: #api-support
- GitHub: [Discussions](https://github.com/vmnl/azeebo+/discussions)
