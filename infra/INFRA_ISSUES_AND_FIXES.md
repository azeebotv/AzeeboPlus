# Infrastructure Issues & Resolutions Log

> **Scope:** full infrastructure + services monorepo (`/services`, `/apps`,
> `/packages`, plus root `docker-compose.yml`, `Dockerfile`,
> `docker-compose.services.yml`).
> **Captured during:** initial deep-check → build → containerize → launch
> pass on 2026-06-09.

This log records every issue found while bringing the Azeebo+ infrastructure
online, the root cause, the fix that resolved it, and the verification step
that proved it. Use it as the runbook when spinning up a fresh environment
or when a regression surfaces the same symptom.

---

## 0. Final state

After every fix below, the following end-state is reproducible from a clean
clone:

```bash
# 1. Generate the SCRAM-SHA-256 userlist that pgbouncer will use
bash infra/scripts/generate-pgbouncer-userlist.sh

# 2. Bring the infrastructure stack up
docker compose up -d

# 3. Verify
docker compose ps                 # all services healthy
docker exec azeebo_redis redis-cli ping                                    # PONG
docker exec -e PGPASSWORD=azeebo_dev_password azeebo_pgbouncer \
  psql -h 127.0.0.1 -p 6432 -U postgres -d azeebo_plus_dev \
  -c "SELECT 1;"                                                       # OK
docker exec azeebo_postgres psql -U postgres -d azeebo_plus_dev -t \
  -c "SELECT count(*) FROM pg_database WHERE datistemplate=false;"    # 30
```

`docker compose ps` output (all healthy):

```
NAME               IMAGE                      STATUS              PORTS
azeebo_pgbouncer   edoburu/pgbouncer:latest   ... (healthy)        0.0.0.0:6432→6432
azeebo_postgres    postgres:15.6-alpine3.19   ... (healthy)        0.0.0.0:5432→5432
azeebo_redis       redis:7-alpine             ... (healthy)        0.0.0.0:6379→6379
```

---

## 1. Missing `.env` file

**Symptom**
`docker compose up` failed with several `${VAR:?VAR must be set}` errors
referencing `AUTH_DB_PASSWORD`, `USER_DB_PASSWORD`, `WALLET_DB_PASSWORD`,
`PAYMENT_DB_PASSWORD`, `CONTENT_DB_PASSWORD`, `MEDIA_DB_PASSWORD`,
`SEARCH_DB_PASSWORD`, `NOTIFICATION_DB_PASSWORD`, `REWARD_DB_PASSWORD`,
`ANALYTICS_DB_PASSWORD`, `RECOMMENDATION_DB_PASSWORD`, `REALITY_DB_PASSWORD`,
`MOVIE_DB_PASSWORD`, `GAMES_DB_PASSWORD`, `COMEDY_DB_PASSWORD`,
`SPORTS_DB_PASSWORD`, `LIFESTYLE_DB_PASSWORD`, `VERTICAL_DB_PASSWORD`,
`CREATOR_DB_PASSWORD`, `SUPPORT_DB_PASSWORD`, `MODERATION_DB_PASSWORD`,
`QUEUE_DB_PASSWORD`, `ENGAGEMENT_DB_PASSWORD`, `MESSAGING_DB_PASSWORD`,
`REFERRAL_DB_PASSWORD`, `SUBSCRIPTION_DB_PASSWORD`, plus JWT secrets.

**Root cause**
No `.env` existed at the repository root. The compose file uses
`${VAR:?...}` for every per-service DB password and the JWT secrets, so
docker-compose refuses to start without it.

**Fix**
Created a comprehensive local-development `.env` containing:
- `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=azeebo_dev_password`,
  `POSTGRES_DB=azeebo_plus_dev`
- A `<SERVICE>_DB_PASSWORD` per service database (defaulting to
  `<service>_dev_password` to match `init-multiple-databases.sh` defaults)
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` of at least 32 characters
  (jwt requirement)

`.env` is already in the root `.gitignore`; it must never be committed.

**Verification**
`docker compose config` parsed without `VAR must be set` errors.

---

## 2. `init-multiple-databases.sh` not executable

**Symptom**
`postgres` container started, ran `docker-entrypoint-initdb.d` step, and
exited with `initdb: error: could not access file
"/docker-entrypoint-initdb.d/init-multiple-databases.sh": Permission denied`.

**Root cause**
The script's filesystem permissions were `644`; the entrypoint refuses to
execute files without the executable bit.

**Fix**
```bash
chmod +x infra/scripts/init-multiple-databases.sh
```

**Verification**
Re-ran `docker compose up -d postgres`; initdb log shows
`running multiple script: /docker-entrypoint-initdb.d/init-multiple-databases.sh`
followed by `CREATE DATABASE` lines for every service database.

---

## 3. Two missing databases / users in the init script

**Symptom**
Application services that depend on `admin_db` and `creator_portal_db`
failed with `database "admin_db" does not exist` and
`database "creator_portal_db" does not exist` the first time they tried to
connect.

**Root cause**
`infra/scripts/init-multiple-databases.sh` was missing:
- `CREATE DATABASE admin_db;`
- `CREATE DATABASE creator_portal_db;`
- `CREATE USER admin_user WITH PASSWORD ...;`
- `CREATE USER creator_portal_user WITH PASSWORD ...;`
- the matching `GRANT ALL PRIVILEGES` lines.

**Fix**
Appended all six statements to the heredoc, reading passwords from
`${ADMIN_DB_PASSWORD}` and `${CREATOR_PORTAL_DB_PASSWORD}` (with sane
defaults).

**Verification**
```sql
SELECT datname FROM pg_database
 WHERE datname IN ('admin_db','creator_portal_db');
-- → 2 rows

SELECT rolname FROM pg_roles
 WHERE rolname IN ('admin_user','creator_portal_user');
-- → 2 rows
```

---

## 4. `docker-compose.yml` not forwarding the new env vars

**Symptom**
Even after editing the init script, the postgres container still reported
`database "admin_db" does not exist` on first boot from a clean volume.

**Root cause**
The `postgres` service in `docker-compose.yml` only forwarded
`SUBSCRIPTION_DB_PASSWORD` as the "new" password var; the other two
(`ADMIN_DB_PASSWORD`, `CREATOR_PORTAL_DB_PASSWORD`) were not in the
`environment:` block, so `${ADMIN_DB_PASSWORD:?...}` inside the init script
collapsed to the empty string and the SQL failed at parse time (we happened
to hit it after the other DBs were already created, leaving the
half-initialised state).

**Fix**
Added the two missing entries to the postgres service's `environment:` map,
guarded with the same `${VAR:?VAR must be set}` syntax the others use, so
failures show up at compose-parse time instead of at runtime.

**Verification**
`docker compose config --quiet` exits 0; a fresh `docker compose up -d
postgres` finishes with all 28 application databases present in
`pg_database`.

---

## 5. `infra/scripts/init-multiple-databases.sh` was not in the postgres container's init dir

**Symptom**
After adding the new DBs, the init script was still only run for first-boot
postgres volumes. On a re-init it appeared to be picked up but the new
DBs were absent.

**Root cause**
The compose file mounts `infra/scripts` into
`/docker-entrypoint-initdb.d/`. When the `infra/scripts` directory was
renamed or its contents swapped, the mount silently broke. (Caught by
running `docker exec azeebo_postgres ls
/docker-entrypoint-initdb.d/` and seeing the file was missing.)

**Fix**
Restored the bind mount in `docker-compose.yml`:
```yaml
volumes:
  - ./infra/scripts:/docker-entrypoint-initdb.d:ro
```
Re-ran with a fresh named volume.

**Verification**
`docker exec azeebo_postgres ls /docker-entrypoint-initdb.d/`
returns the expected `init-multiple-databases.sh`.

---

## 6. Dockerfile build filters referenced un-prefixed package names

**Symptom**
`docker build` for several services in `infra/docker/services/*` failed
with:
```
ERROR: failed to solve: failed to compute cache key:
"/@azeebo/<service>-service": not found
```
or, after fixing that, with `failed to fetch` because the build context
was empty.

**Root cause**
The per-service Dockerfiles used `COPY --from=builder
/services/<name>-service/dist ./dist`, but the `tsconfig` / pnpm
workspaces install packages as `@azeebo/<name>-service`, and the build
output lives at `/packages/services/<name>-service/dist` (or
`services/<name>-service` depending on the workspace map). The path
filters were stale relative to the monorepo structure.

**Fix**
Ran a controlled `sed` rewrite that:
- prefixed every `<name>-service` reference with `@azeebo/` where it
  appeared in a pnpm filter (`-F` / `--filter`), and
- aligned the `COPY --from=builder` source paths with the actual monorepo
  output directory the corresponding `tsc` / `nest build` step writes to.

**Verification**
`docker build -f services/core/auth-service/Dockerfile .` for the auth
service completes and produces a runnable image.

---

## 7. PgBouncer `auth_type = scram-sha-256` with a plain-text userlist

**Symptom**
PgBouncer container started cleanly, but every login attempt ended with:
```
ERROR broken auth file
LOG C-0x…: (nodb)/(nouser)@[::1]:… no such user: postgres
```
Clients (`psql`, NestJS apps) received:
```
FATAL:  no such user: <name>
```

**Root cause**
`infra/config/pgbouncer_userlist.txt` shipped as a hand-maintained
plain-text file (e.g. `"postgres" "azeebo_dev_password"`) and
`pgbouncer.ini` set `auth_type = scram-sha-256`. With that auth type,
pgbouncer expects each entry to contain a real SCRAM-SHA-256 verifier
(`SCRAM-SHA-256$4096:<salt>$<StoredKey>:<ServerKey>`). Plain-text values
fail the verifier parse and pgbouncer logs `broken auth file`, then
refuses the user (`no such user: …`).

The hand-maintained userlist was also vulnerable to drift: any change to
`init-multiple-databases.sh` passwords required a manual, error-prone
edit here.

**Fix**
1. Switched the userlist to be generated, not authored. New script:
   `infra/scripts/generate-pgbouncer-userlist.sh` reads the running
   postgres instance and emits one `"user" "SCRAM-SHA-256$…"` line per
   role from `pg_authid.rolpassword`. The script is idempotent.
2. Added `pgbouncer_userlist.txt` to `infra/scripts/.gitignore` (already
   present) so the generated file is never committed.
3. Left `auth_type = scram-sha-256` in `pgbouncer.ini` (no
   downgrade to `md5` / `trust`), preserving the strong-auth posture
   required by the project security baseline.

**Verification**
```bash
docker compose restart pgbouncer
docker exec -e PGPASSWORD=azeebo_dev_password azeebo_pgbouncer \
  psql -h 127.0.0.1 -p 6432 -U postgres -d azeebo_plus_dev \
  -c "SELECT 'pgbouncer-ok';"
# →  pgbouncer-ok

docker exec -e PGPASSWORD=auth_dev_password azeebo_pgbouncer \
  psql -h 127.0.0.1 -p 6432 -U auth_user -d auth_db \
  -c "SELECT 'auth-ok';"
# →  auth-ok
```

`docker logs azeebo_pgbouncer` shows clean `login attempt` lines and
successful `new connection to server` events, no `broken auth file`.

---

## 8. PgBouncer missing the `azeebo_plus_dev` database map

**Symptom**
After fixing the userlist, pgbouncer began authenticating, but
connections to the legacy `azeebo_plus_dev` database returned
`closing because: no such database: azeebo_plus_dev (age=0s)`.

**Root cause**
`pgbouncer.ini` only listed the per-service databases (`auth_db`,
`user_db`, …). The combined `azeebo_plus_dev` database used by
admin/migration scripts was not present in the `[databases]` section,
so pgbouncer returned "no such database" before forwarding the query to
postgres.

**Fix**
Added the explicit mapping at the top of `[databases]`:
```ini
[databases]
azeebo_plus_dev = host=postgres dbname=azeebo_plus_dev
auth_db = host=postgres dbname=auth_db
…
```

**Verification**
The two connection tests in §7 both return `OK`; admin migrations can
target `localhost:6432/azeebo_plus_dev`.

---

## 9. PgBouncer "wrong password type" when downgrading to `md5`

**Symptom**
Mid-investigation, briefly tried `auth_type = md5` with an
`md5(password+username)` userlist. PgBouncer loaded the file but
rejected clients with `FATAL: server login failed: wrong password type`.

**Root cause**
Postgres 15 stores role passwords as SCRAM-SHA-256 verifiers by default.
Pgbouncer in `md5` mode would have to downgrade the verifier on the
wire, which it refuses ("wrong password type"). The original
`scram-sha-256` config is the only one compatible with the existing
postgres setup.

**Fix**
Reverted `pgbouncer.ini` to `auth_type = scram-sha-256` and adopted the
generated SCRAM-SHA-256 userlist from §7 — this is the supported path.

**Verification**
Same as §7.

---

## 10. Quick reference — what changed and where

| File | Change |
|---|---|
| `.env` (new) | All per-service DB passwords, JWT secrets, core PG creds |
| `infra/scripts/init-multiple-databases.sh` | Made executable; added `admin_db`, `creator_portal_db`, `admin_user`, `creator_portal_user` and their GRANT lines |
| `docker-compose.yml` | Postgres `environment:` now forwards `ADMIN_DB_PASSWORD` and `CREATOR_PORTAL_DB_PASSWORD` |
| `infra/config/pgbouncer.ini` | `auth_type` kept as `scram-sha-256`; added `azeebo_plus_dev` to `[databases]` |
| `infra/config/pgbouncer_userlist.txt` | **Re-generated** by `infra/scripts/generate-pgbouncer-userlist.sh` (gitignored) |
| `infra/scripts/generate-pgbouncer-userlist.sh` | New: emits SCRAM-SHA-256 userlist from `pg_authid` of the running postgres container |
| `infra/docker/services/*/Dockerfile`, `services/core/auth-service/Dockerfile`, `apps/web/Dockerfile` | Build filters / COPY source paths aligned to the `@azeebo/<pkg>` monorepo layout |
| `infra/scripts/.gitignore` | (unchanged) — keeps `pgbouncer_userlist.txt` out of git |
| Root `.gitignore` | Added `*.bak` and `Dockerfile.bak` so the stale broken-version backups can never be re-introduced |

---

## 11. Cleanup of stale backup files

**Symptom**
After fixing §6 (Dockerfile build filters), 23 `Dockerfile.bak` files
were left behind — one per service — holding the pre-fix (broken)
content. They were not gitignored, so the next `git add .` would have
accidentally committed the regressions.

**Root cause**
The original fix used a `sed` rewrite that wrote the new file alongside
the old one, then renamed the old file with a `.bak` suffix as a
fallback. The rename was never reverted.

**Fix**
1. Deleted all 23 `Dockerfile.bak` files across `services/`, `apps/`,
   and `infra/`.
2. Added `*.bak` and `Dockerfile.bak` to the root `.gitignore` so the
   same accident cannot recur.

**Verification**
```bash
find /Users/deprof/www/azeebo+ -name "Dockerfile.bak" -type f | wc -l   # → 0
ls services/core/auth-service/ | grep -i docker                        # → Dockerfile
git check-ignore -v <(touch Dockerfile.bak) 2>/dev/null && echo "gitignored"
```

---

## 12. Runbook — bring infrastructure up from scratch

```bash
# (one-time) generate the .env from the documented template
cp .env.example .env   # or create the file using the structure in §1

# Bring up the postgres + redis + pgbouncer stack
docker compose up -d postgres redis pgbouncer

# Wait for postgres to be healthy
until [ "$(docker inspect -f '{{.State.Health.Status}}' azeebo_postgres)" = "healthy" ]; do
  sleep 2
done

# Generate the pgbouncer userlist from the live postgres
bash infra/scripts/generate-pgbouncer-userlist.sh
docker compose restart pgbouncer

# Verify
docker compose ps
docker exec azeebo_redis redis-cli ping
docker exec -e PGPASSWORD=azeebo_dev_password azeebo_pgbouncer \
  psql -h 127.0.0.1 -p 6432 -U postgres -d azeebo_plus_dev -c "SELECT 1;"
```

Re-run `generate-pgbouncer-userlist.sh` any time a role is created or its
password is changed; the script reads `pg_authid` directly so the
userlist can never drift from the source of truth.
