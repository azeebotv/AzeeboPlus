#!/usr/bin/env bash
# federate-admin-db.sh — make azeebo_admin a LIVE federation point.
#
# Instead of mirroring data into azeebo_admin (see seed-all.sh seed_admin_db),
# this script replaces the admin service's local copies of shared tables with
# postgres_fdw foreign tables that point straight at the live per-service
# databases (auth/content/wallet/notification/payment/moderation/creator).
# Reads AND writes from the admin panel then hit the live data at request time.
#
# Admin-owned tables stay local: user_suspensions and saved_items have no home
# service database anywhere in this dev cluster (checked every azeebo_* DB),
# and watch_history, safety_actions, payout_requests have schema drift vs their
# home DBs. azeebo_auth keeps its own audit_logs (auth-service's login/token
# trail — different schema from the admin AuditLog); the admin DB federates it
# read-only as auth_audit_logs so the admin audit page can centralize both
# trails (see apps/admin/src/modules/audit/audit.service.ts).
#
# Idempotent: existing local tables are renamed to <table>__local_backup before
# the foreign table is created, so a re-run is safe and reversible.
#
# Dev-only, like seed-all.sh: uses the shared dev credentials.
#   SUPERUSER / SUPERUSER_PASSWORD — only needed once, to CREATE EXTENSION.
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-azeebo}"
PGPASSWORD="${PGPASSWORD:-azeebo_dev_2024}"
ADMIN_DB="${ADMIN_DB:-azeebo_admin}"
# Name of the auth-service database (home of users + its own audit_logs).
# Overridable so federation-drill.sh scenario 2 can exercise the whole
# bootstrap (incl. the additive-column repair) against a throwaway pair.
AUTH_DB="${AUTH_DB:-azeebo_auth}"
SUPERUSER="${SUPERUSER:-postgres}"
SUPERUSER_PASSWORD="${SUPERUSER_PASSWORD:-postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD

REMOTE_DB_PASS="${REMOTE_DB_PASS:-$PGPASSWORD}"

psql_admin() { psql -q -d "$ADMIN_DB" -v ON_ERROR_STOP=1 "$@"; }
psql_at()    { local db="$1"; shift; psql -q -d "$db" -v ON_ERROR_STOP=1 "$@"; }

log() { printf '\n== %s\n' "$*"; }

# table|remote database (swap scope agreed after the column-diff survey; all of
# these are column-supersets of — or identical to — the admin mirror).
SWAPS=(
  "users|${AUTH_DB}"
  "wallets|azeebo_wallet"
  "wallet_transactions|azeebo_wallet"
  "universes|azeebo_content"
  "categories|azeebo_content"
  "tags|azeebo_content"
  "content_items|azeebo_content"
  "media_assets|azeebo_content"
  "content_relationships|azeebo_content"
  "universe_feature_flags|azeebo_content"
  "system_settings|azeebo_content"
  "_CategoryToContentItem|azeebo_content"
  "_ContentItemToTag|azeebo_content"
  "notifications|azeebo_notification"
  "payment_intents|azeebo_payment"
  "refunds|azeebo_payment"
  "moderation_cases|azeebo_moderation"
  "reports|azeebo_moderation"
  "creator_profiles|azeebo_creator"
)

# ---------------------------------------------------------------------------
log "0. sanity: databases reachable"
for db in "$AUTH_DB" azeebo_wallet azeebo_content azeebo_notification azeebo_payment azeebo_moderation azeebo_creator; do
  psql_at "$db" -tAc "SELECT 1" >/dev/null || { echo "FATAL: cannot reach $db"; exit 1; }
done
echo "ok"

# ---------------------------------------------------------------------------
log "1. postgres_fdw extension in $ADMIN_DB (needs superuser once)"
if ! psql_admin -tAc "SELECT 1 FROM pg_extension WHERE extname='postgres_fdw'" | grep -q 1; then
  PGPASSWORD="$SUPERUSER_PASSWORD" psql -q -h "$PGHOST" -p "$PGPORT" -U "$SUPERUSER" -d "$ADMIN_DB" \
    -c "CREATE EXTENSION IF NOT EXISTS postgres_fdw" \
    || { echo "FATAL: could not CREATE EXTENSION postgres_fdw (superuser $SUPERUSER)"; exit 1; }
  echo "extension created"
else
  echo "already installed"
fi
# non-superuser owner needs USAGE on the wrapper to CREATE SERVER
PGPASSWORD="$SUPERUSER_PASSWORD" psql -q -h "$PGHOST" -p "$PGPORT" -U "$SUPERUSER" -d "$ADMIN_DB" \
  -c "GRANT USAGE ON FOREIGN DATA WRAPPER postgres_fdw TO \"$PGUSER\"" \
  || { echo "FATAL: could not GRANT USAGE on postgres_fdw (superuser $SUPERUSER)"; exit 1; }

# ---------------------------------------------------------------------------
log "2. additive columns on ${AUTH_DB}.users (admin-owned suspension fields)"
# THE additive-column repair: if this service DB was ever recreated from its
# Prisma baseline, these admin-owned columns vanish and every admin query
# touching them breaks. ADD COLUMN IF NOT EXISTS converges it back.
psql_at "$AUTH_DB" -v ON_ERROR_STOP=1 <<'SQL'
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isSuspended" boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendedAt" timestamp(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendedBy" text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendedUntil" timestamp(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspensionReason" text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "notificationPreferences" jsonb;
SQL
echo "ok"

# ---------------------------------------------------------------------------
log "3. local enum + FDW servers + user mappings in $ADMIN_DB"
# users.role is an enum (UserRole) on azeebo_auth; IMPORT FOREIGN SCHEMA needs
# the type to exist locally with the same labels.
psql_admin -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('user','creator','admin','moderator','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
SQL

servers=("$AUTH_DB" azeebo_wallet azeebo_content azeebo_notification azeebo_payment azeebo_moderation azeebo_creator)
for db in "${servers[@]}"; do
  # NOTE: unquoted heredoc — psql does not interpolate :"vars" inside dollar-quoted
  # bodies, so the db name is expanded by the shell instead (identifiers are our
  # own azeebo_* names; values still go through format(%L) for quoting).
  psql_admin -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  EXECUTE format('CREATE SERVER azeebo_fdw_${db} FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host %L, port %L, dbname %L)',
    '${PGHOST}', '${PGPORT}', '${db}');
EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;
SQL
  # re-runs must converge server options too: if anything (e.g.
  # federation-drill.sh or manual testing) repointed dbname, force it back to
  # the canonical target. This is what makes a re-run a true self-heal.
  psql_admin -v ON_ERROR_STOP=1 <<SQL
ALTER SERVER azeebo_fdw_${db} OPTIONS (SET dbname '${db}');
SQL
  # password_required=false is superuser-only, so the mapping is created by the
  # superuser. It is needed because loopback remotes use trust auth and
  # postgres_fdw refuses non-superuser FDW connections when the server never
  # asks for a password. Drop/recreate so re-runs pick up new credentials.
  PGPASSWORD="$SUPERUSER_PASSWORD" psql -q -h "$PGHOST" -p "$PGPORT" -U "$SUPERUSER" -d "$ADMIN_DB" <<SQL
DROP USER MAPPING IF EXISTS FOR PUBLIC SERVER azeebo_fdw_${db};
CREATE USER MAPPING FOR PUBLIC SERVER azeebo_fdw_${db} OPTIONS (user '${PGUSER}', password '${REMOTE_DB_PASS}', password_required 'false');
SQL
done
echo "ok"

# ---------------------------------------------------------------------------
log "4. drop local FKs that touch swapped tables (cross-DB integrity lives remotely now)"
psql_admin -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname, con.conrelid::regclass AS tbl
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    WHERE con.contype = 'f'
      AND c.relnamespace = 'public'::regnamespace
      AND (
        EXISTS (SELECT 1 FROM pg_class ref WHERE ref.oid = con.confrelid AND ref.relname IN
          ('users','wallets','wallet_transactions','universes','categories','tags','content_items',
           'media_assets','content_relationships','universe_feature_flags','system_settings',
           '_CategoryToContentItem','_ContentItemToTag','notifications','payment_intents','refunds',
           'moderation_cases','reports','creator_profiles'))
        OR c.relname IN
          ('users','wallets','wallet_transactions','universes','categories','tags','content_items',
           'media_assets','content_relationships','universe_feature_flags','system_settings',
           '_CategoryToContentItem','_ContentItemToTag','notifications','payment_intents','refunds',
           'moderation_cases','reports','creator_profiles')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tbl, r.conname);
    RAISE NOTICE 'dropped FK % on %', r.conname, r.tbl;
  END LOOP;
END $$;
SQL
echo "ok"

# ---------------------------------------------------------------------------
log "5. swap local mirrors -> foreign tables (locals kept as <table>__local_backup)"
for entry in "${SWAPS[@]}"; do
  t="${entry%%|*}"; db="${entry##*|}"
  # skip if already foreign
  if psql_admin -tAc "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='$t'" | grep -q 1; then
    echo "$t: already foreign, skipping"
    continue
  fi
  psql_admin -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF to_regclass(format('public.%I', '${t}')) IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.%I RENAME TO %I', '${t}', '${t}' || '__local_backup');
  END IF;
  -- import the live table (columns are a superset of the old mirror)
  EXECUTE format(
    'IMPORT FOREIGN SCHEMA public LIMIT TO (%I) FROM SERVER azeebo_fdw_${db} INTO public',
    '${t}');
END \$\$;
SQL
  echo "$t -> $db: foreign table created"
done

# ---------------------------------------------------------------------------
log "5b. federate auth's own audit trail read-only (different schema, not a swap)"
# azeebo_auth.audit_logs is auth-service's own audit table (actor/result/error/
# timestamp — login & token events). It is NOT the admin AuditLog shape, and
# the admin's own local audit_logs keeps its name — so this is added as a
# separate read-only foreign table via CREATE FOREIGN TABLE (an IMPORT would
# collide with the local table). Consumed by
# apps/admin/src/modules/audit/audit.service.ts (fetchAuthTrail).
if ! psql_admin -tAc "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='auth_audit_logs'" | grep -q 1; then
  psql_admin -v ON_ERROR_STOP=1 <<SQL
CREATE FOREIGN TABLE public."auth_audit_logs" (
  id            text NOT NULL,
  actor         text,
  action        text NOT NULL,
  "resourceType" text,
  "resourceId"  text,
  result        text NOT NULL,
  error         text,
  "ipAddress"   text,
  "userAgent"   text,
  "timestamp"   timestamp NOT NULL,
  "createdAt"   timestamp NOT NULL,
  "updatedAt"   timestamp NOT NULL
) SERVER azeebo_fdw_${AUTH_DB} OPTIONS (schema_name 'public', table_name 'audit_logs');
GRANT SELECT ON public."auth_audit_logs" TO "${PGUSER}";
SQL
  echo "auth_audit_logs -> azeebo_auth.audit_logs (read-only)"
else
  echo "auth_audit_logs: already foreign, skipping"
fi

# ---------------------------------------------------------------------------
log "6. sanity: foreign-table rowcounts match the live databases"
fail=0
for entry in "${SWAPS[@]}"; do
  t="${entry%%|*}"; db="${entry##*|}"
  local_n=$(psql_admin -tAc "SELECT count(*) FROM public.\"$t\"")
  remote_n=$(psql_at "$db" -tAc "SELECT count(*) FROM public.\"$t\"")
  if [ "$local_n" = "$remote_n" ]; then
    echo "  $t: $local_n rows (matches $db)"
  else
    echo "  MISMATCH $t: admin sees $local_n, $db has $remote_n"; fail=1
  fi
done
[ "$fail" = 0 ] || { echo "FATAL: rowcount mismatch"; exit 1; }

# ---------------------------------------------------------------------------
log "7. job_runs ledger (admin-owned, local; both scheduled jobs append here)"
psql_admin -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS job_runs (
  id           text PRIMARY KEY,
  job          text NOT NULL,
  status       text NOT NULL,
  detail       text,
  "rowsPurged" integer,
  "durationMs" integer,
  "ranAt"      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS job_runs_job_ranat_idx ON job_runs (job, "ranAt" DESC);
SQL
# The transport-flip ledger (apps/admin ops.service recordTransportSweep)
# UPSERTs on a deterministic per-(service, transport, day) id — the unique
# index makes ON CONFLICT (id) a guaranteed no-throw merge even on the plain
# PRIMARY KEY alone, but the partial index keeps the trend query fast as the
# ledger grows.
psql_admin -v ON_ERROR_STOP=1 -c "CREATE INDEX IF NOT EXISTS job_runs_transport_flip_idx ON job_runs (\"ranAt\" DESC) WHERE job = 'transport-flip'" || true

echo
echo "Federation complete. azeebo_admin now serves LIVE data for the swapped tables."
echo "Local mirrors kept as <table>__local_backup for rollback. Admin-owned tables"
echo "(user_suspensions, saved_items, watch_history, safety_actions, payout_requests)"
echo "remain local. auth_audit_logs federates azeebo_auth.audit_logs read-only."
