#!/bin/bash
# generate-pgbouncer-userlist.sh
# Builds infra/config/pgbouncer_userlist.txt from the running postgres
# container by reading the SCRAM-SHA-256 password hashes from pg_authid.
#
# Pgbouncer is configured with `auth_type = scram-sha-256`, so its userlist
# must contain the same SCRAM-SHA-256 verifier strings that postgres stored
# for each role. This script is the single source of truth for keeping the
# pgbouncer userlist in sync with postgres.

set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-azeebo_postgres}"
POSTGRES_DB="${POSTGRES_DB:-azeebo_plus_dev}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_FILE="${OUT_FILE:-$SCRIPT_DIR/../config/pgbouncer_userlist.txt}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

docker exec "$POSTGRES_CONTAINER" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -F "|" \
  -c "SELECT rolname, rolpassword FROM pg_authid WHERE rolpassword IS NOT NULL AND rolpassword <> '';" \
  > "$TMP"

count=$(wc -l < "$TMP" | tr -d ' ')
: > "$OUT_FILE"
while IFS='|' read -r user hash; do
  [ -n "${user:-}" ] && [ -n "${hash:-}" ] || continue
  printf '"%s" "%s"\n' "$user" "$hash" >> "$OUT_FILE"
done < "$TMP"

wrote=$(wc -l < "$OUT_FILE" | tr -d ' ')
echo "Generated $wrote entries (postgres reported $count) -> $OUT_FILE"
