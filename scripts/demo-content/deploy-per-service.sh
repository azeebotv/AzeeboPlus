#!/usr/bin/env bash
# =============================================================================
# Azeebo+ Demo Content Deploy — Per-Service Databases
# Creates all tables + seeds demo data into each microservice's database.
# Usage: ./deploy-per-service.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION="$SCRIPT_DIR/migrations/001_create_all_tables.sql"
SEED="$SCRIPT_DIR/migrations/002_seed_demo_data.sql"
PSQL="/Users/deprof/Library/FlyEnv/env/postgresql/bin/psql -U postgres"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log()  { echo "[demo-seed] $*"; }

# All service databases
DBS=(azeebo_auth azeebo_user azeebo_content azeebo_wallet azeebo_creator
     azeebo_reality azeebo_sports azeebo_games azeebo_comedy
     azeebo_engagement azeebo_notification azeebo_reward azeebo_referral
     azeebo_moderation azeebo_support azeebo_search azeebo_recommendation
     azeebo_vertical azeebo_movie azeebo_lifestyle azeebo_messaging
     azeebo_queue azeebo_analytics azeebo_subscription azeebo_media)

# Users SQL (same for every DB that has a users table)
USERS_SQL=$(cat <<'ENDSQL'
INSERT INTO "users" (id, email, password, "displayName", avatar, role, "isVerified", "createdAt", "updatedAt") VALUES
  ('a0000001-0000-0000-0000-000000000001','admin@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Admin Chidi','https://ui-avatars.com/api/?name=Chidi+Okonkwo&background=1B5E20&color=fff','admin',true,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000002','moderator@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Mod Amina','https://ui-avatars.com/api/?name=Amina+Bello&background=E65100&color=fff','moderator',true,'2025-01-15T00:00:00Z','2025-01-15T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000003','creator1@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Tunde Creates','https://ui-avatars.com/api/?name=Tunde+Adebayo&background=1565C0&color=fff','user',true,'2025-02-01T00:00:00Z','2025-02-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000004','creator2@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Ngozi Vibes','https://ui-avatars.com/api/?name=Ngozi+Eze&background=6A1B9A&color=fff','user',true,'2025-02-15T00:00:00Z','2025-02-15T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000005','creator3@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Emeka Studios','https://ui-avatars.com/api/?name=Emeka+Nwosu&background=B71C1C&color=fff','user',true,'2025-03-01T00:00:00Z','2025-03-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000006','user1@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Kemi Watch','https://ui-avatars.com/api/?name=Kemi+Adesanya&background=00695C&color=fff','user',true,'2025-03-15T00:00:00Z','2025-03-15T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000007','user2@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Olumide F','https://ui-avatars.com/api/?name=Olumide+Fashola&background=4E342E&color=fff','user',true,'2025-04-01T00:00:00Z','2025-04-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000008','user3@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Fatima A','https://ui-avatars.com/api/?name=Fatima+Abubakar&background=0277BD&color=fff','user',true,'2025-04-15T00:00:00Z','2025-04-15T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000009','banned@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Chukwu M',NULL,'user',true,'2025-02-20T00:00:00Z','2025-02-20T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000010','unverified@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Yemi O',NULL,'user',false,'2025-05-01T00:00:00Z','2025-05-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000011','sportscreator@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Chinedu Sports','https://ui-avatars.com/api/?name=Chinedu+Obi&background=E65100&color=fff','user',true,'2025-03-10T00:00:00Z','2025-03-10T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000012','gamer@azeeboplus.com','$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.','Tunde Gaming','https://ui-avatars.com/api/?name=Tunde+Olatunji&background=1A237E&color=fff','user',true,'2025-04-01T00:00:00Z','2025-04-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, password = EXCLUDED.password,
  "displayName" = EXCLUDED."displayName", avatar = EXCLUDED.avatar,
  role = EXCLUDED.role, "isVerified" = EXCLUDED."isVerified",
  "updatedAt" = EXCLUDED."updatedAt";
ENDSQL
)

log "=== Step 1: Create all tables in each service database ==="
for db in "${DBS[@]}"; do
  # Check if DB exists
  exists=$($PSQL -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" 2>/dev/null || echo "")
  if [[ "$exists" != "1" ]]; then
    log "  $db: does not exist, creating..."
    $PSQL -c "CREATE DATABASE $db;" 2>/dev/null || true
  fi
  log "  $db: creating tables..."
  $PSQL -d "$db" -f "$MIGRATION" 2>&1 | tail -1 || true
done

log ""
log "=== Step 2: Copy users into each database ==="
for db in "${DBS[@]}"; do
  has_users=$($PSQL -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='users' AND table_schema='public'" -d "$db" 2>/dev/null || echo "")
  if [[ "$has_users" == "1" ]]; then
    log "  $db: inserting users..."
    echo "$USERS_SQL" | $PSQL -d "$db" 2>&1 | grep -c "INSERT" || true
  fi
done

log ""
log "=== Step 3: Seed demo data ==="
for db in "${DBS[@]}"; do
  log "  Seeding $db..."
  $PSQL -d "$db" -f "$SEED" 2>&1 | grep -E "INSERT|ERROR" | head -5 || true
  log "  $db: done"
done

log ""
log "=== Summary ==="
for db in "${DBS[@]}"; do
  count=$($PSQL -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" -d "$db" 2>/dev/null || echo "?")
  log "  $db: $count tables"
done

log ""
log "=== Demo content deployment complete ==="
