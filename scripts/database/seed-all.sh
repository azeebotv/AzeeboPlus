#!/usr/bin/env bash
# ============================================================
# Azeebo+ Multi-Database Seed Script
# ============================================================
# Seeds all per-service databases with demo data.
# Matches Docker all-in-one setup.
#
# Usage:
#   ./scripts/database/seed-all.sh [database]
#
# If database is specified, only that database is seeded.
# Without arguments, all databases are seeded.
#
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# ---- Configuration ----
DB_USER="azeebo"
DB_PASS="azeebo_dev_2024"
DB_HOST="localhost"
DB_PORT="5432"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}"

# ---- Colors ----
if [ -t 1 ]; then
  GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[0;33m'
  RED='\033[0;31m'; BOLD='\033[1m'; RESET='\033[0m'
else
  GREEN=''; CYAN=''; YELLOW=''; RED=''; BOLD=''; RESET=''
fi

info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[OK]${RESET}    %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }
err()   { printf "${RED}[ERR]${RESET}   %s\n" "$*" >&2; }

run_sql() {
  local db="$1" sql="$2" out
  # Surface psql's real error instead of swallowing it: the old
  # `2>/dev/null || warn "idempotent"` reported syntax/FK errors as benign
  # re-runs while every caller still printed [OK] — five broken seed
  # statements hid behind it for months.
  if ! out=$(psql -U "$DB_USER" -d "$db" -c "$sql" 2>&1); then
    warn "statement failed in $db (not idempotency — real error):"
    printf '%s\n' "$out" | sed 's/^/    /' >&2
  else
    printf '%s\n' "$out"
  fi
}

run_file() {
  local db="$1" file="$2"
  if [[ -f "$file" ]]; then
    psql -U "$DB_USER" -d "$db" -f "$file" 2>/dev/null || true
    ok "  Seeded $db from $(basename "$file")"
  else
    warn "  File not found: $file"
  fi
}

# ============================================================
# Seed: Auth Database
# ============================================================
seed_auth_db() {
  info "Seeding azeebo_auth (admin, moderator, creators, viewers)..."

  # Password hash for "Demo123!" (bcrypt, matches Docker demo seed)
  local demo_hash='$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.'

  run_sql "azeebo_auth" "
    INSERT INTO users (id, email, password, \"displayName\", avatar, role, \"isVerified\", \"createdAt\", \"updatedAt\")
    VALUES
      ('a0000001-0000-0000-0000-000000000001', 'admin@azeeboplus.com', '${demo_hash}', 'Admin Chidi', '/images/placeholders/avatars/100x100_07.png', 'admin', true, '2025-01-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000002', 'moderator@azeeboplus.com', '${demo_hash}', 'Mod Amina', '/images/placeholders/avatars/100x100_08.png', 'moderator', true, '2025-01-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000003', 'creator1@azeeboplus.com', '${demo_hash}', 'Tunde Creates', '/images/placeholders/avatars/100x100_09.png', 'creator', true, '2025-02-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000004', 'creator2@azeeboplus.com', '${demo_hash}', 'Ngozi Vibes', '/images/placeholders/avatars/100x100_10.png', 'creator', true, '2025-02-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000005', 'creator3@azeeboplus.com', '${demo_hash}', 'Emeka Studios', '/images/placeholders/avatars/100x100_11.png', 'creator', true, '2025-03-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000006', 'user1@azeeboplus.com', '${demo_hash}', 'Kemi Watch', '/images/placeholders/avatars/100x100_12.png', 'user', true, '2025-03-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000007', 'user2@azeeboplus.com', '${demo_hash}', 'Olumide F', '/images/placeholders/avatars/100x100_01.png', 'user', true, '2025-04-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000008', 'user3@azeeboplus.com', '${demo_hash}', 'Fatima A', '/images/placeholders/avatars/100x100_02.png', 'user', true, '2025-04-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000009', 'banned@azeeboplus.com', '${demo_hash}', 'Chukwu M', NULL, 'user', true, '2025-02-20T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000010', 'unverified@azeeboplus.com', '${demo_hash}', 'Yemi O', NULL, 'user', false, '2025-05-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000011', 'sportscreator@azeeboplus.com', '${demo_hash}', 'Chinedu Sports', '/images/placeholders/avatars/100x100_03.png', 'creator', true, '2025-05-10T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000012', 'gamer@azeeboplus.com', '${demo_hash}', 'Tunde Gaming', '/images/placeholders/avatars/100x100_04.png', 'creator', true, '2025-06-01T00:00:00Z', NOW())
    ON CONFLICT (email) DO UPDATE SET
      password = EXCLUDED.password,
      role = EXCLUDED.role,
      \"displayName\" = EXCLUDED.\"displayName\",
      avatar = EXCLUDED.avatar,
      \"isVerified\" = EXCLUDED.\"isVerified\",
      \"updatedAt\" = NOW();
  "
  ok "Auth database seeded (12 users: admin, moderator, 5 creators, 4 viewers, 1 banned, 1 unverified)"
}

# ============================================================
# Mirror: azeebo_auth.users → a service DB's own users table
# ============================================================
# Every service whose Prisma schema declares `users` also FKs it (creator:
# watch_history, saved_items, wallets, payment_intents, payout_requests,
# challenge_submissions, creator_profiles, notifications, tips, …), but the
# real user rows live ONLY in azeebo_auth. Without this mirror those FKs dangle
# against an empty local table — that is the "creator DB FKs to a local empty
# users table" drift: every insert/join through them fails or silently 500s.
#
# Column sets legitimately differ per DB (azeebo_content carries
# isActive/isEmailVerified, azeebo_creator carries password/preferences), so
# we intersect BOTH sides' column lists and refuse to run if a
# NOT-NULL-without-default column of the target would be left unset.
# Idempotent: staging table + ON CONFLICT (id) DO NOTHING.
#   usage: mirror_users_into <database>
mirror_users_into() {
  local db="$1" auth_cols target_cols common qcols missing csv
  auth_cols="$(psql "${DB_URL}/azeebo_auth" -X -tAq -v ON_ERROR_STOP=1 \
    -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public' ORDER BY column_name")"
  target_cols="$(psql "${DB_URL}/$db" -X -tAq -v ON_ERROR_STOP=1 \
    -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public' ORDER BY column_name")"
  if [ -z "$target_cols" ]; then
    err "$db has no users table to mirror into"
    return 1
  fi
  common="$(comm -12 <(printf '%s\n' "$auth_cols" | sort) <(printf '%s\n' "$target_cols" | sort) | grep . || true)"
  if [ -z "$common" ]; then
    err "$db.users shares no columns with azeebo_auth.users — refusing to mirror"
    return 1
  fi

  # Refuse if a NOT-NULL/no-default target column would be omitted.
  missing="$(psql "${DB_URL}/$db" -X -tAq -v ON_ERROR_STOP=1 \
    -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public' AND is_nullable='NO' AND column_default IS NULL ORDER BY column_name" \
    | while IFS= read -r c; do printf '%s\n' "$common" | grep -qx "$c" || printf '%s\n' "$c"; done | grep . || true)"
  if [ -n "$missing" ]; then
    err "cannot mirror users into $db: required column(s) absent from azeebo_auth.users: $(printf '%s ' $missing)"
    return 1
  fi

  qcols="$(printf '%s\n' "$common" | sed 's/.*/"&"/' | paste -sd, -)"
  csv="$(mktemp "${TMPDIR:-/tmp}/azeebo-users-mirror.XXXXXX")"
  psql "${DB_URL}/azeebo_auth" -X -q -v ON_ERROR_STOP=1 \
    -c "\copy (SELECT $qcols FROM users ORDER BY id) TO STDOUT WITH (FORMAT csv)" >"$csv"
  psql "${DB_URL}/$db" -X -q -v ON_ERROR_STOP=1 <<SQL
CREATE TEMP TABLE _mirror_users_stage (LIKE users);
\\copy _mirror_users_stage ($qcols) FROM '$csv' WITH (FORMAT csv)
INSERT INTO users ($qcols) SELECT $qcols FROM _mirror_users_stage ON CONFLICT (id) DO NOTHING;
SELECT '  users in $db: ' || COUNT(*) FROM users;
SQL
  rm -f "$csv"
  ok "  Users mirrored from azeebo_auth into $db"
}

# ============================================================
# Seed: User Database
# ============================================================
seed_user_db() {
  info "Seeding azeebo_user (user profiles + roles)..."

  # User roles
  run_sql "azeebo_user" "
    INSERT INTO \"user_roles\" (id, \"userId\", role, \"grantedBy\", \"createdAt\", \"updatedAt\")
    VALUES
      ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'admin', 'system', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
      ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'moderator', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z', '2025-01-15T00:00:00Z'),
      ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z', '2025-02-01T00:00:00Z'),
      ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z', '2025-02-15T00:00:00Z'),
      ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z'),
      ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000011', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-03-10T00:00:00Z', '2025-03-10T00:00:00Z'),
      ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000012', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-04-01T00:00:00Z', '2025-04-01T00:00:00Z')
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  User roles seeded"

  # User profiles
  run_sql "azeebo_user" "
    INSERT INTO \"user_profiles\" (id, \"userId\", \"displayName\", avatar, bio, location, \"isPublic\", \"createdAt\", \"updatedAt\")
    VALUES
      ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Admin Chidi', '/images/placeholders/avatars/100x100_05.png', 'Platform administrator', 'Lagos', true, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Mod Amina', '/images/placeholders/avatars/100x100_06.png', 'Community moderator', 'Abuja', true, '2025-01-15T00:00:00Z', '2025-01-15T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Tunde Creates', '/images/placeholders/avatars/100x100_07.png', 'Vlogs and creator content', 'Lagos', true, '2025-02-01T00:00:00Z', '2025-02-01T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Ngozi Vibes', '/images/placeholders/avatars/100x100_08.png', 'Lifestyle and fashion', 'Port Harcourt', true, '2025-02-15T00:00:00Z', '2025-02-15T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Emeka Studios', '/images/placeholders/avatars/100x100_09.png', 'Films and series', 'Enugu', true, '2025-03-01T00:00:00Z', '2025-03-01T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'Kemi Watch', '/images/placeholders/avatars/100x100_10.png', 'Always streaming', 'Lagos', true, '2025-03-15T00:00:00Z', '2025-03-15T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'Olumide F', '/images/placeholders/avatars/100x100_11.png', 'Comedy fan', 'Ibadan', true, '2025-04-01T00:00:00Z', '2025-04-01T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'Fatima A', '/images/placeholders/avatars/100x100_12.png', 'Nollywood buff', 'Kano', true, '2025-04-15T00:00:00Z', '2025-04-15T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000011', 'Chinedu Sports', '/images/placeholders/avatars/100x100_01.png', 'Sports highlights', 'Abuja', true, '2025-05-10T00:00:00Z', '2025-05-10T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000012', 'Tunde Gaming', '/images/placeholders/avatars/100x100_02.png', 'Gaming creator', 'Lagos', true, '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z'),      ('c0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000009', 'Chukwu M', NULL, 'Former user (banned)', NULL, false, '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
      ('c0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000010', 'Yemi O', NULL, 'Unverified account', NULL, false, '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z')
    ON CONFLICT (id) DO UPDATE SET \"displayName\" = EXCLUDED.\"displayName\", avatar = EXCLUDED.avatar, bio = EXCLUDED.bio, location = EXCLUDED.\"location\", \"isPublic\" = EXCLUDED.\"isPublic\";
  "
  ok "  User profiles seeded (12 users with Nigerian names and bios)"
}

# ============================================================
# Seed: Content Database (Universes + Categories)
# ============================================================
seed_content_db() {
  info "Seeding azeebo_content (users, universes, categories, tags, 30 content items)..."

  # content_items.creatorId FKs content.users(id) — seed the authors first
  # (this block was missing entirely; every fresh DB failed the FK below).
  # ON CONFLICT (id) DO NOTHING tolerates the three rows a prior partial run
  # may have left behind.
  run_sql "azeebo_content" "
    INSERT INTO users (id, email, \"displayName\", role, \"isActive\", \"isEmailVerified\", \"createdAt\", \"updatedAt\")
    VALUES
      ('a0000001-0000-0000-0000-000000000001', 'admin@azeeboplus.com', 'Admin Chidi', 'admin', true, true, '2025-01-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000002', 'moderator@azeeboplus.com', 'Mod Amina', 'moderator', true, true, '2025-01-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000003', 'creator1@azeeboplus.com', 'Tunde Creates', 'creator', true, true, '2025-02-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000004', 'creator2@azeeboplus.com', 'Ngozi Vibes', 'creator', true, true, '2025-02-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000005', 'creator3@azeeboplus.com', 'Emeka Studios', 'creator', true, true, '2025-03-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000006', 'user1@azeeboplus.com', 'Kemi Watch', 'user', true, true, '2025-03-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000007', 'user2@azeeboplus.com', 'Olumide F', 'user', true, true, '2025-04-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000008', 'user3@azeeboplus.com', 'Fatima A', 'user', true, true, '2025-04-15T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000009', 'banned@azeeboplus.com', 'Chukwu M', 'user', true, true, '2025-02-20T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000010', 'unverified@azeeboplus.com', 'Yemi O', 'user', true, false, '2025-05-01T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000011', 'sportscreator@azeeboplus.com', 'Chinedu Sports', 'creator', true, true, '2025-05-10T00:00:00Z', NOW()),
      ('a0000001-0000-0000-0000-000000000012', 'gamer@azeeboplus.com', 'Tunde Gaming', 'creator', true, true, '2025-06-01T00:00:00Z', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Content authors seeded (12)"

  # Universes — matches Docker demo seed
  run_sql "azeebo_content" "
    INSERT INTO universes (id, name, \"displayName\", description, icon, color, \"isEnabled\", \"sortOrder\", \"createdAt\", \"updatedAt\")
    VALUES
      ('u0000001-0000-0000-0000-000000000001', 'reality',  'Reality TV',     'Nigerian reality shows including Big Brother, dating shows, and competition series.', '🎬', '#E91E63', true, 1,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000002', 'creator',  'Creator Content','Original content from top Nigerian creators, vlogs, and independent productions.', '🎨', '#9C27B0', true, 2,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000003', 'lifestyle','Lifestyle',     'Fashion, food, travel, wellness, and everyday Nigerian living.', '🏠', '#FF9800', true, 3,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000004', 'movies',   'Movies',        'Nollywood blockbusters, indie films, and cinematic masterpieces.', '🎥', '#2196F3', true, 4,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000005', 'comedy',   'Comedy',        'Stand-up specials, comedy sketches, and hilarious Naija content.', '😂', '#FFEB3B', true, 5,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000006', 'sports',   'Sports',        'Football highlights, basketball, athletics, and sports commentary.', '⚽', '#4CAF50', true, 6,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000007', 'music',    'Music',         'Music videos, concert recordings, acoustic sessions, and behind-the-scenes.', '🎵', '#FF5722', true, 7,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000008', 'games',    'Gaming',        'Nigerian gaming content, esports, reviews, and live streams.', '🎮', '#607D8B', true, 8,  NOW(), NOW()),
      ('u0000001-0000-0000-0000-000000000009', 'vertical', 'Vertical Series','Premium African storytelling with interconnected characters and lore.', '📖', '#8B5CF6', true, 9,  NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Universes seeded (9)"

  # Categories — matches Docker demo seed
  run_sql "azeebo_content" "
    INSERT INTO categories (id, name, slug, description, icon, color, \"createdAt\", \"updatedAt\")
    VALUES
      ('cat00001-0000-0000-0000-000000000001', 'Trending Now', 'trending-now', 'Currently popular content', '🔥', '#F44336', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000002', 'New Releases', 'new-releases', 'Freshly published content', '✨', '#FF9800', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000003', 'Editor Picks', 'editor-picks', 'Handpicked by our editorial team', '⭐', '#FFD700', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000004', 'Exclusive', 'exclusive', 'Only on Azeebo+', '👑', '#9C27B0', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000005', 'Free Content', 'free-content', 'Watch for free', '🆓', '#4CAF50', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000006', 'Live Events', 'live-events', 'Upcoming and live screenings', '📡', '#E91E63', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000007', 'Nollywood Classics', 'nollywood-classics', 'Timeless Nigerian cinema classics', '🎞️', '#795548', NOW(), NOW()),
      ('cat00001-0000-0000-0000-000000000008', 'Documentaries', 'documentaries', 'Real stories, real impact', '📽️', '#607D8B', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Categories seeded (8)"

  # Tags
  run_sql "azeebo_content" "
    INSERT INTO tags (id, name, description, \"createdAt\")
    VALUES
      ('tag00001-0000-0000-0000-000000000001', 'naija', 'Nigerian content', NOW()),
      ('tag00001-0000-0000-0000-000000000002', 'big-brother', 'Big Brother related', NOW()),
      ('tag00001-0000-0000-0000-000000000003', 'nollywood', 'Nigerian cinema', NOW()),
      ('tag00001-0000-0000-0000-000000000004', 'afrobeats', 'Afrobeats music', NOW()),
      ('tag00001-0000-0000-0000-000000000005', 'comedy', 'Funny content', NOW()),
      ('tag00001-0000-0000-0000-000000000006', 'fashion', 'Fashion and style', NOW()),
      ('tag00001-0000-0000-0000-000000000007', 'food', 'Food and cooking', NOW()),
      ('tag00001-0000-0000-0000-000000000008', 'football', 'Football content', NOW()),
      ('tag00001-0000-0000-0000-000000000009', 'reality-show', 'Reality show content', NOW()),
      ('tag00001-0000-0000-0000-000000000010', 'premiere', 'Premiere releases', NOW()),
      ('tag00001-0000-0000-0000-000000000011', 'behind-the-scenes', 'BTS content', NOW()),
      ('tag00001-0000-0000-0000-000000000012', 'exclusive', 'Exclusive content', NOW()),
      ('tag00001-0000-0000-0000-000000000013', 'documentary', 'Documentary content', NOW()),
      ('tag00001-0000-0000-0000-000000000014', 'gaming', 'Gaming content', NOW()),
      ('tag00001-0000-0000-0000-000000000015', 'live', 'Live content', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Tags seeded (15)"

  # Content items — 30 items across all universes (matches Docker demo seed)
  run_sql "azeebo_content" "
    INSERT INTO content_items (id, title, description, thumbnail, \"mediaUrl\", \"universeId\", \"creatorId\", status, \"viewCount\", \"publishedAt\", \"releaseDate\", \"windowType\", \"isExclusive\", \"isPremiere\", metadata, \"createdAt\", \"updatedAt\")
    VALUES
      -- Reality TV (6 items)
      ('cnt00001-0000-0000-0000-000000000001', 'BBNaija Season 10: Day 45 Highlights', 'The drama intensifies as housemates face the latest nomination challenge.', '/images/placeholders/content/800x450_01.png', 'https://www.youtube.com/watch?v=lbV3pRW1qbc', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 245000, '2025-06-15T20:00:00Z', '2025-06-15T20:00:00Z', 'premium', true, true, '{\"duration\":3600,\"episode\":45,\"season\":10,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000002', 'The Real Housewives of Lagos S2 E3', 'The ladies of Lagos bring the glamour and the shade.', '/images/placeholders/content/800x450_02.png', 'https://www.youtube.com/watch?v=09R8_2nJtjg', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 189000, '2025-06-12T20:00:00Z', '2025-06-12T20:00:00Z', 'standard', false, false, '{\"duration\":2700,\"episode\":3,\"season\":2,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000003', 'Nigerian Idol S9: Audition Highlights', 'The most emotional and hilarious auditions from this season.', '/images/placeholders/content/800x450_03.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 312000, '2025-06-01T18:00:00Z', '2025-06-01T18:00:00Z', 'standard', false, false, '{\"duration\":4200,\"episode\":1,\"season\":9,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000004', 'Love Island Naija: Coupling Ceremony', 'New couples are formed as the islanders make their decisions.', '/images/placeholders/content/800x450_04.png', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 156000, '2025-06-10T21:00:00Z', '2025-06-10T21:00:00Z', 'premium', true, false, '{\"duration\":3300,\"episode\":8,\"season\":3,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000005', 'Cooking with Chioma: Jollof Rice Battle', 'Chef Chioma takes on the ultimate jollof rice challenge - Ghana vs Nigeria!', '/images/placeholders/content/800x450_05.png', 'https://www.youtube.com/watch?v=5GoGJuY-moM', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 89000, '2025-06-08T14:00:00Z', '2025-06-08T14:00:00Z', 'basic', false, false, '{\"duration\":1800,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000006', 'Survivor Naija: Immunity Challenge', 'Tribes clash in the most physically demanding immunity challenge.', '/images/placeholders/content/800x450_06.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'published', 67000, '2025-06-05T19:00:00Z', '2025-06-05T19:00:00Z', 'standard', false, false, '{\"duration\":2400,\"episode\":12,\"season\":2,\"language\":\"en\"}', NOW(), NOW()),

      -- Creator Content (6 items)
      ('cnt00001-0000-0000-0000-000000000007', 'Lagos to Abuja Road Trip Vlog', 'Join me on an epic 12-hour road trip from Lagos to Abuja.', '/images/placeholders/content/800x450_07.png', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 78000, '2025-06-14T10:00:00Z', '2025-06-14T10:00:00Z', 'basic', false, false, '{\"duration\":2400,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000008', 'My Apartment Tour - Lagos Luxury', 'Full tour of my new Lagos apartment. From empty space to dream home!', '/images/placeholders/content/800x450_08.png', 'https://www.youtube.com/watch?v=CevxZvSJLk8', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 234000, '2025-06-11T15:00:00Z', '2025-06-11T15:00:00Z', 'basic', false, false, '{\"duration\":1500,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000009', 'Day in My Life as a Nigerian Creator', 'A raw and real look at what it takes to create content in Lagos.', '/images/placeholders/content/800x450_09.png', 'https://www.youtube.com/watch?v=5GoGJuY-moM', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 156000, '2025-06-09T09:00:00Z', '2025-06-09T09:00:00Z', 'basic', false, false, '{\"duration\":1200,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000010', 'Reacting to My Old Videos', 'Looking back at my earliest content. Cringe alert! But also growth.', '/images/placeholders/content/800x450_10.png', 'https://www.youtube.com/watch?v=kXYiU_JCYt0', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 92000, '2025-06-07T12:00:00Z', '2025-06-07T12:00:00Z', 'basic', false, false, '{\"duration\":1800,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000011', 'How I Started: My Creator Journey', 'From zero to 500K followers - the real story behind the success.', '/images/placeholders/content/800x450_11.png', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 187000, '2025-05-28T11:00:00Z', '2025-05-28T11:00:00Z', 'basic', false, false, '{\"duration\":2100,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000012', 'Ngozi x Zara Collaboration BTS', 'Behind the scenes of our latest fashion collaboration shoot.', '/images/placeholders/content/800x450_12.png', 'https://www.youtube.com/watch?v=kXYiU_JCYt0', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 45000, '2025-06-13T16:00:00Z', '2025-06-13T16:00:00Z', 'standard', false, false, '{\"duration\":900,\"language\":\"en\"}', NOW(), NOW()),

      -- Lifestyle (5 items)
      ('cnt00001-0000-0000-0000-000000000013', 'Lagos Street Food Guide: Yaba Edition', 'The ultimate guide to the best street food spots in Yaba, Lagos.', '/images/placeholders/content/800x450_13.png', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 67000, '2025-06-06T13:00:00Z', '2025-06-06T13:00:00Z', 'basic', false, false, '{\"duration\":1800,\"language\":\"en\",\"location\":\"Yaba, Lagos\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000014', 'My Skincare Routine for Nigerian Weather', 'Tested and trusted skincare products that work in our tropical climate.', '/images/placeholders/content/800x450_14.png', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 123000, '2025-06-04T08:00:00Z', '2025-06-04T08:00:00Z', 'basic', false, false, '{\"duration\":900,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000015', 'Abuja Weekend Getaway Guide', 'Best spots to visit in Abuja this weekend.', '/images/placeholders/content/800x450_15.png', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 34000, '2025-05-30T09:00:00Z', '2025-05-30T09:00:00Z', 'basic', false, false, '{\"duration\":2400,\"language\":\"en\",\"location\":\"Abuja\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000016', 'Nigerian Wedding Lookbook 2025', 'Top wedding guest outfit ideas for the 2025 Nigerian wedding season.', '/images/placeholders/content/800x450_16.png', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 89000, '2025-06-02T10:00:00Z', '2025-06-02T10:00:00Z', 'standard', false, false, '{\"duration\":1500,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000017', 'Home Workout: No Equipment Needed', 'Full body workout routine you can do at home. No gym required!', '/images/placeholders/content/800x450_17.png', 'https://www.youtube.com/watch?v=rYEDAozJrWw', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'published', 56000, '2025-05-25T07:00:00Z', '2025-05-25T07:00:00Z', 'basic', false, false, '{\"duration\":2700,\"language\":\"en\"}', NOW(), NOW()),

      -- Movies (5 items)
      ('cnt00001-0000-0000-0000-000000000018', 'Lagos King: The Return', 'A retired crime lord must return to his old ways when his family is threatened.', '/images/placeholders/content/800x450_18.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 456000, '2025-05-20T18:00:00Z', '2025-05-20T18:00:00Z', 'premium', true, true, '{\"duration\":7200,\"genre\":\"action/thriller\",\"language\":\"en\",\"rating\":\"16+\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000019', 'Ada of Lagos', 'A young woman navigates love, career, and family in modern Lagos.', '/images/placeholders/content/800x450_19.png', 'https://www.youtube.com/watch?v=nfWlot6h_JM', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 234000, '2025-06-01T17:00:00Z', '2025-06-01T17:00:00Z', 'standard', false, false, '{\"duration\":6600,\"genre\":\"drama/romance\",\"language\":\"en\",\"rating\":\"12+\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000020', 'The Ghost of Naira Falls', 'A supernatural thriller set in a small Nigerian town with a dark secret.', '/images/placeholders/content/800x450_20.png', 'https://www.youtube.com/watch?v=rYEDAozJrWw', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 123000, '2025-06-10T19:00:00Z', '2025-06-10T19:00:00Z', 'standard', false, false, '{\"duration\":5400,\"genre\":\"horror/thriller\",\"language\":\"en\",\"rating\":\"18+\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000021', 'Hustle in Victoria Island', 'Three friends risk everything on a tech startup in Lagos.', '/images/placeholders/content/800x450_21.png', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 89000, '2025-06-08T16:00:00Z', '2025-06-08T16:00:00Z', 'basic', false, false, '{\"duration\":6000,\"genre\":\"drama/comedy\",\"language\":\"en\",\"rating\":\"12+\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000022', 'Love at First Jollof', 'A romantic comedy about two food bloggers who keep meeting at jollof competitions.', '/images/placeholders/content/800x450_22.png', 'https://www.youtube.com/watch?v=iS1g8A-n85o', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'published', 178000, '2025-06-14T17:00:00Z', '2025-06-14T17:00:00Z', 'standard', false, false, '{\"duration\":5400,\"genre\":\"romcom\",\"language\":\"en\",\"rating\":\"PG\"}', NOW(), NOW()),

      -- Comedy (4 items)
      ('cnt00001-0000-0000-0000-000000000023', 'AY Live 2025: Full Show', 'The biggest comedy show of the year. AY, Bovi, Akpororo, and more.', '/images/placeholders/content/800x450_23.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 567000, '2025-04-15T19:00:00Z', '2025-04-15T19:00:00Z', 'premium', true, false, '{\"duration\":10800,\"genre\":\"stand-up/comedy\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000024', 'Mark Angel Comedy: Episode 345', 'When Emmanuelle tries to write an exam without studying.', '/images/placeholders/content/800x450_24.png', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 890000, '2025-06-12T14:00:00Z', '2025-06-12T14:00:00Z', 'basic', false, false, '{\"duration\":600,\"genre\":\"sketch comedy\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000025', 'Basketmouth: Yabasi Special', 'Basketmouth goes deep on Nigerian parents and Jollof rice politics.', '/images/placeholders/content/800x450_25.png', 'https://www.youtube.com/watch?v=CevxZvSJLk8', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'published', 345000, '2025-05-20T20:00:00Z', '2025-05-20T20:00:00Z', 'premium', false, false, '{\"duration\":5400,\"genre\":\"stand-up\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000026', 'Craze Clown: Family Drama', 'When Nigerian parents discover TikTok. Pure comedy gold.', '/images/placeholders/content/800x450_26.png', 'https://www.youtube.com/watch?v=2vMPFrLmzkE', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 234000, '2025-06-03T12:00:00Z', '2025-06-03T12:00:00Z', 'basic', false, false, '{\"duration\":480,\"genre\":\"sketch comedy\",\"language\":\"en\"}', NOW(), NOW()),

      -- Sports (2 items)
      ('cnt00001-0000-0000-0000-000000000027', 'NPFL Highlights: Enyimba vs Rangers', 'The Oriental Derby delivers as always. All goals and key moments.', '/images/placeholders/content/800x450_27.png', 'https://www.youtube.com/watch?v=lbV3pRW1qbc', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005', 'published', 78000, '2025-06-15T17:00:00Z', '2025-06-15T17:00:00Z', 'basic', false, false, '{\"duration\":1200,\"sport\":\"football\",\"league\":\"NPFL\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000028', 'Super Eagles World Cup Qualifier Recap', 'Full analysis of Nigeria latest World Cup qualifying match.', '/images/placeholders/content/800x450_28.png', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'published', 456000, '2025-06-11T21:00:00Z', '2025-06-11T21:00:00Z', 'standard', false, false, '{\"duration\":1800,\"sport\":\"football\",\"league\":\"FIFA\"}', NOW(), NOW()),

      -- Music (2 items)
      ('cnt00001-0000-0000-0000-000000000029', 'Burna Boy: Live in Concert Lagos 2025', 'The full concert recording of Burna Boy sold-out Lagos show.', '/images/placeholders/content/800x450_29.png', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'published', 1200000, '2025-05-10T20:00:00Z', '2025-05-10T20:00:00Z', 'premium', true, false, '{\"duration\":9000,\"genre\":\"afrobeats/concert\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000030', 'Tems Acoustic Session: Unplugged', 'Tems performs her biggest hits stripped down in an intimate acoustic session.', '/images/placeholders/content/800x450_30.png', 'https://www.youtube.com/watch?v=09R8_2nJtjg', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'published', 890000, '2025-06-07T19:00:00Z', '2025-06-07T19:00:00Z', 'standard', false, true, '{\"duration\":3600,\"genre\":\"acoustic/rnb\",\"language\":\"en\"}', NOW(), NOW()),

      -- Games (8 items)
      ('cnt00001-0000-0000-0000-000000000031', 'FIFA World Cup Qualifier Highlights', 'Best moments from the latest FIFA qualifier match.', '/images/placeholders/content/800x450_01.png', 'https://www.youtube.com/watch?v=RgKAFK5djSk', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'published', 150000, NOW(), NOW(), 'standard', false, false, '{\"duration\":3600,\"game\":\"FIFA\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000032', 'NBA 2K MyCareer: Road to Glory', 'Follow the journey of a Nigerian basketball star.', '/images/placeholders/content/800x450_02.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 89000, NOW(), NOW(), 'standard', false, false, '{\"duration\":2400,\"game\":\"NBA 2K\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000033', 'Call of Duty: Mobile Tournament', 'Top plays from the latest Call of Duty Mobile tournament.', '/images/placeholders/content/800x450_03.png', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 67000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1800,\"game\":\"COD Mobile\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000034', 'PES 2025: Nigerian League Highlights', 'Best goals from the Nigerian PES league.', '/images/placeholders/content/800x450_04.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 45000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1200,\"game\":\"PES 2025\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000035', 'Free Fire: Squad Clash Highlights', 'Epic squad battles from Free Fire tournaments.', '/images/placeholders/content/800x450_05.png', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 78000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1500,\"game\":\"Free Fire\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000036', 'GTA V: Nigerian Mod Showcase', 'Exploring the Nigerian mod for GTA V.', '/images/placeholders/content/800x450_06.png', 'https://www.youtube.com/watch?v=OPf6jTZ1B5Y', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'published', 120000, NOW(), NOW(), 'standard', false, false, '{\"duration\":2400,\"game\":\"GTA V\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000037', 'Mobile Legends: Bang Bang Pro League', 'Highlights from the Nigerian MLBB league.', '/images/placeholders/content/800x450_07.png', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 56000, NOW(), NOW(), 'standard', false, false, '{\"duration\":2100,\"game\":\"MLBB\",\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000038', 'Valorant: Nigerian Pro Plays', 'Best plays from Nigerian Valorant professionals.', '/images/placeholders/content/800x450_08.png', 'https://www.youtube.com/watch?v=60ItHLz5WEQ', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'published', 34000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1800,\"game\":\"Valorant\",\"language\":\"en\"}', NOW(), NOW()),

      -- Vertical (10 items)
      ('cnt00001-0000-0000-0000-000000000039', 'The Lagos Diaries: Episode 1', 'A young woman navigates life in Lagos.', '/images/placeholders/content/800x450_09.png', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'published', 234000, NOW(), NOW(), 'premium', true, true, '{\"duration\":1800,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000040', 'The Lagos Diaries: Episode 2', 'The drama continues in Episode 2.', '/images/placeholders/content/800x450_10.png', 'https://www.youtube.com/watch?v=hT_nvWreIhg', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'published', 189000, NOW(), NOW(), 'premium', false, false, '{\"duration\":1800,\"episode\":2,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000041', 'Nollywood Nights: The Secret', 'A thrilling vertical series about secrets in Lagos high society.', '/images/placeholders/content/800x450_11.png', 'https://www.youtube.com/watch?v=YQHsXMglC9A', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000005', 'published', 156000, NOW(), NOW(), 'premium', true, false, '{\"duration\":1200,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000042', 'Abuja Love Story: Episode 1', 'A romantic vertical series set in Abuja.', '/images/placeholders/content/800x450_12.png', 'https://www.youtube.com/watch?v=lbV3pRW1qbc', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 123000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1500,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000043', 'Campus Life: Freshman Year', 'Follow five university students through their first year.', '/images/placeholders/content/800x450_13.png', 'https://www.youtube.com/watch?v=CevxZvSJLk8', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 89000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1200,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000044', 'Market Days: Iya Basira', 'The daily adventures of a Lagos market woman.', '/images/placeholders/content/800x450_14.png', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'published', 67000, NOW(), NOW(), 'standard', false, false, '{\"duration\":900,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000045', 'The Hustle: Lagos Edition', 'Three friends chase their dreams in Lagos.', '/images/placeholders/content/800x450_15.png', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 56000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1500,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000046', 'Fashion Forward: Lagos Style', 'A vertical series about Lagos fashion culture.', '/images/placeholders/content/800x450_16.png', 'https://www.youtube.com/watch?v=nfWlot6h_JM', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'published', 45000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1200,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000047', 'Tech Startup: The Beginning', 'Follow a tech startup journey in Lagos.', '/images/placeholders/content/800x450_17.png', 'https://www.youtube.com/watch?v=rtOvBOTFBX0', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 34000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1800,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW()),
      ('cnt00001-0000-0000-0000-000000000048', 'Music Star: Rise to Fame', 'A vertical series about a music artist journey.', '/images/placeholders/content/800x450_18.png', 'https://www.youtube.com/watch?v=iS1g8A-n85o', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000005', 'published', 78000, NOW(), NOW(), 'standard', false, false, '{\"duration\":1500,\"episode\":1,\"season\":1,\"language\":\"en\"}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Content database seeded (48 items across 9 universes)"
}

# ============================================================
# Seed: Wallet Database
# ============================================================
seed_wallet_db() {
  info "Seeding azeebo_wallet..."
  # One run_sql per statement: psql -c runs the whole batch in a single
  # implicit transaction, so one bad row used to abort the rest and the
  # "may have already existed" warning hid the real error.
  run_sql "azeebo_wallet" "
    INSERT INTO wallets (id, \"userId\", balance, currency, \"createdAt\", \"updatedAt\")
    VALUES
      ('w0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 5000.00, 'NGN', NOW(), NOW()),
      ('w0000000-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 12500.00, 'NGN', NOW(), NOW()),
      ('w0000000-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 8750.00, 'NGN', NOW(), NOW()),
      ('w0000000-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 15000.00, 'NGN', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  run_sql "azeebo_wallet" "
    INSERT INTO partner_banks (id, slug, name, \"productName\", \"licenceRef\", \"registrationNumber\", \"minAmount\", \"maxAmount\", \"minTenorMonths\", \"maxTenorMonths\", \"interestRateMin\", \"interestRateMax\", \"feeDisclosure\", \"totalCostExample\", eligibility, \"applyUrl\", \"termsUrl\", \"privacyUrl\", \"displayOrder\", \"isActive\", \"isSample\", \"createdAt\", \"updatedAt\")
    VALUES
      ('pb000000-0000-0000-0000-000000000001', 'sample-bank-a', 'Sample Partner Bank A', 'Short-tenor personal advance', 'CBN MICROFINANCE BANK LICENCE 00000-PLACEHOLDER', 'RC 0000000 (placeholder)', 10000.00, 500000.00, 1, 6, 12.000, 24.000, '2.5% facility fee deducted at disbursement; no early-repayment charge.', 'NGN 100,000 over 6 months at 18% p.a. = NGN 109,000 total repayment (illustrative).', 'Existing Azeebo+ account in good standing; partner runs its own credit check.', 'https://apply.example.org/sample-bank-a', 'https://example.org/terms', 'https://example.org/privacy', 1, true, true, NOW(), NOW()),
      ('pb000000-0000-0000-0000-000000000002', 'sample-bank-b', 'Sample Partner Bank B', 'Income-linked loan', 'CBN LICENCE 00000-PLACEHOLDER', 'RC 0000001 (placeholder)', 50000.00, 2000000.00, 3, 24, 9.500, 19.000, 'NGN 1,500 account fee per loan; interest accrues daily on the outstanding balance.', 'NGN 500,000 over 12 months at 15% p.a. = NGN 543,750 total repayment (illustrative).', 'Salaried applicants with 6 months of payslips; partner verifies income directly.', 'https://apply.example.org/sample-bank-b', 'https://example.org/terms', 'https://example.org/privacy', 2, true, true, NOW(), NOW()),
      ('pb000000-0000-0000-0000-000000000003', 'sample-bank-c', 'Sample Partner Bank C', 'Small-ticket starter loan', 'CBN LICENCE 00000-PLACEHOLDER', 'RC 0000002 (placeholder)', 2000.00, 60000.00, 1, 3, 15.000, 30.000, 'Flat 3% origination fee; late repayment attracts 5% of the overdue instalment.', 'NGN 20,000 over 3 months at 24% p.a. = NGN 21,200 total repayment (illustrative).', 'First-time borrowers; minimum account age 30 days.', 'https://apply.example.org/sample-bank-c', 'https://example.org/terms', 'https://example.org/privacy', 3, true, true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Wallet database seeded (4 wallets with NGN balances, 3 sample partner banks)"
}

# ============================================================
# Seed: Media Database
# ============================================================
seed_media_db() {
  info "Seeding azeebo_media..."
  run_sql "azeebo_media" "
    INSERT INTO media_uploads (id, \"userId\", \"fileName\", \"originalName\", \"mimeType\", size, key, \"cdnUrl\", folder, status, metadata, \"createdAt\", \"updatedAt\")
    VALUES
      ('m0000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'tunde-avatar.png', 'tunde-avatar.png', 'image/png', 15360, 'avatars/tunde-avatar.png', '/images/placeholders/avatars/100x100_03.png', 'avatars', 'uploaded', '{}', NOW(), NOW()),
      ('m0000000-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'platform-logo.png', 'platform-logo.png', 'image/png', 81920, 'logos/platform-logo.png', '/assets/logo.png', 'logos', 'uploaded', '{}', NOW(), NOW()),
      ('m0000000-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'ngozi-avatar.png', 'ngozi-avatar.png', 'image/png', 18432, 'avatars/ngozi-avatar.png', '/images/placeholders/avatars/100x100_04.png', 'avatars', 'uploaded', '{}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Media database seeded (3 items: avatars + logo)"
}

# ============================================================
# Seed: Creator Database
# ============================================================
seed_creator_db() {
  info "Seeding azeebo_creator..."

  # creator_profiles.userId and every other user FK here reference
  # azeebo_creator.users(id) — mirror the auth users FIRST, otherwise the
  # profiles below (and any portal join) dangle against an empty table.
  mirror_users_into "azeebo_creator"

  run_sql "azeebo_creator" "
    INSERT INTO creator_profiles (id, \"userId\", \"displayName\", bio, verified, \"createdAt\", \"updatedAt\")
    VALUES
      ('cp000000-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'Tunde Creates', 'Content creator specializing in reality TV reactions and Nigerian pop culture commentary. 500K+ followers.', true, NOW(), NOW()),
      ('cp000000-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'Ngozi Vibes', 'Lifestyle and fashion content creator. Showing you the best of Nigerian living.', true, NOW(), NOW()),
      ('cp000000-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'Emeka Studios', 'Independent filmmaker and short film producer. Telling Nigerian stories to the world.', true, NOW(), NOW()),
      ('cp000000-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000011', 'Chinedu Sports', 'Sports content creator covering NPFL, Super Eagles, and Nigerian athletics.', true, NOW(), NOW()),
      ('cp000000-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000012', 'Tunde Gaming', 'Professional gamer and content creator. FIFA champion and Naija gaming ambassador.', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Creator database seeded (5 creator profiles)"
}

# ============================================================
# Seed: Reward Database
# ============================================================
seed_reward_db() {
  info "Seeding azeebo_reward..."
  run_sql "azeebo_reward" "
    INSERT INTO rewards (id, name, description, cost, type, \"updatedAt\")
    VALUES
      ('rp000000-0000-0000-0000-000000000001', 'Daily Login', 'Earn points for logging in daily', 10, 'points', NOW()),
      ('rp000000-0000-0000-0000-000000000002', 'Content Watch', 'Earn points for watching content', 5, 'points', NOW()),
      ('rp000000-0000-0000-0000-000000000003', 'Referral Bonus', 'Earn points for referring friends', 500, 'points', NOW()),
      ('rp000000-0000-0000-0000-000000000004', 'Creator Milestone', 'Earn points for reaching subscriber milestones', 1000, 'points', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Reward database seeded"
}

# ============================================================
# Seed: Search Database
# ============================================================
seed_search_db() {
  info "Seeding azeebo_search..."
  run_sql "azeebo_search" "
    -- Suggestions
    INSERT INTO suggestions (id, term, type, universe, weight, \"isActive\", \"createdAt\", \"updatedAt\")
    VALUES
      ('sg000000-0000-0000-0000-000000000001', 'nollywood', 'trending', 'movies', 10, true, NOW(), NOW()),
      ('sg000000-0000-0000-0000-000000000002', 'comedy', 'trending', 'comedy', 8, true, NOW(), NOW()),
      ('sg000000-0000-0000-0000-000000000003', 'sports', 'trending', 'sports', 6, true, NOW(), NOW()),
      ('sg000000-0000-0000-0000-000000000004', 'lagos', 'trending', 'lifestyle', 5, true, NOW(), NOW()),
      ('sg000000-0000-0000-0000-000000000005', 'food', 'category', 'lifestyle', 4, true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Search database seeded"
}

# ============================================================
# Seed: Notification Database
# ============================================================
seed_notification_db() {
  info "Seeding azeebo_notification..."
  run_sql "azeebo_notification" "
    INSERT INTO notification_templates (id, key, channel, subject, body, variables, \"createdAt\", \"updatedAt\")
    VALUES
      ('nt000000-0000-0000-0000-000000000001', 'welcome', 'email', 'Welcome to Azeebo+!', 'Welcome to Azeebo+, {{name}}!', '{\"name\": true}', NOW(), NOW()),
      ('nt000000-0000-0000-0000-000000000002', 'new_follower', 'push', NULL, '{{name}} started following you', '{\"name\": true}', NOW(), NOW()),
      ('nt000000-0000-0000-0000-000000000003', 'content_published', 'push', NULL, 'Your content {{title}} is now live!', '{\"title\": true}', NOW(), NOW()),
      ('nt000000-0000-0000-0000-000000000004', 'reward_earned', 'push', NULL, 'You earned {{points}} points!', '{\"points\": true}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Notification database seeded"
}

# ============================================================
# Seed: Analytics Database
# ============================================================
seed_analytics_db() {
  info "Seeding azeebo_analytics..."
  run_sql "azeebo_analytics" "
    INSERT INTO product_events (id, \"eventName\", \"userId\", metadata, \"createdAt\")
    VALUES
      ('ae000000-0000-0000-0000-000000000001', 'platform_launch', 'a0000001-0000-0000-0000-000000000001', '{\"version\": \"1.0.0\", \"env\": \"development\"}', NOW()),
      ('ae000000-0000-0000-0000-000000000002', 'content_view', 'a0000001-0000-0000-0000-000000000006', '{\"universe\": \"reality\", \"entityType\": \"content\", \"entityId\": \"cnt00001-0000-0000-0000-000000000001\"}', NOW()),
      ('ae000000-0000-0000-0000-000000000003', 'content_view', 'a0000001-0000-0000-0000-000000000007', '{\"universe\": \"movies\", \"entityType\": \"content\", \"entityId\": \"cnt00001-0000-0000-0000-000000000018\"}', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Analytics database seeded (3 events)"
}

# ============================================================
# Feature Flags (Redis)
# ============================================================
# Seeds a small set of dev-friendly feature flags into Redis so local runs
# exercise flag-gated paths out of the box. Idempotent: existing keys are
# ============================================================
# Seed: Admin Database
# ============================================================
# The admin panel (apps/admin, port 4016) reads its OWN database
# (azeebo_admin) — it does not join across the per-service databases.
# Without this seed, every admin page shows 0s even though users,
# content, and wallets exist in azeebo_auth / azeebo_content /
# azeebo_wallet.
#
# NOTE: when azeebo_admin is FEDERATED (scripts/database/federate-admin-db.sh),
# the panel already reads/writes the live service databases through foreign
# tables and this mirror seed skips itself automatically.
#
# Strategy: mirror the rows the admin panel displays from the service
# databases via psql \copy (client-side, no superuser/extensions needed):
#   users            ← azeebo_auth.users
#   universes        ← azeebo_content.universes
#   content_items    ← azeebo_content.content_items (+ universe FK)
#   wallets          ← azeebo_wallet.wallets
#   wallet_transactions ← azeebo_wallet.wallet_transactions (via wallet FK)
#
# Rows are keyed by the same IDs as the source services, so the mirror
# is idempotent (ON CONFLICT DO UPDATE) and re-runs refresh counts.
seed_admin_db() {
  # With database federation (scripts/database/federate-admin-db.sh), azeebo_admin's
  # shared tables are postgres_fdw foreign tables over the LIVE service databases —
  # seeding them here would duplicate data in the wrong place. The mirror seed is
  # only needed on a non-federated admin DB.
  if psql "${DB_URL}/azeebo_admin" -X -q -tAc \
      "SELECT 1 FROM pg_foreign_table ft JOIN pg_class c ON c.oid=ft.ftrelid WHERE c.relnamespace='public'::regnamespace AND c.relname='users'" 2>/dev/null | grep -q 1; then
    info "azeebo_admin is federated to the live service DBs — skipping mirror seed"
    return 0
  fi
  info "Seeding azeebo_admin (mirror of auth/content/wallet data the panel reads)..."

  # Staging CSV tables for the \copy pipe. Recreated each run so schema
  # changes in the source DBs can't desync the column lists; dropped after.
  local psql_admin
  psql_admin=(psql "${DB_URL}/azeebo_admin" -X -q -v ON_ERROR_STOP=1)
  "${psql_admin[@]}" <<'SQL'
DROP TABLE IF EXISTS tmp_admin_users, tmp_admin_universes, tmp_admin_content, tmp_admin_wallets, tmp_admin_txs CASCADE;
CREATE TABLE tmp_admin_users (
  id text PRIMARY KEY, email text, password text, "displayName" text,
  avatar text, role text, preferences jsonb, "createdAt" timestamptz, "updatedAt" timestamptz
);
CREATE TABLE tmp_admin_universes (
  id text PRIMARY KEY, name text, "displayName" text, description text,
  icon text, color text, "isEnabled" boolean, "sortOrder" integer, metadata jsonb,
  "createdAt" timestamptz, "updatedAt" timestamptz
);
CREATE TABLE tmp_admin_content (
  id text PRIMARY KEY, title text, description text, thumbnail text,
  "mediaUrl" text, "universeId" text, "creatorId" text, status text,
  "viewCount" integer, metadata jsonb, "publishedAt" timestamptz, "createdAt" timestamptz, "updatedAt" timestamptz
);
CREATE TABLE tmp_admin_wallets (
  id text PRIMARY KEY, "userId" text, balance numeric(18,2), currency text,
  "createdAt" timestamptz, "updatedAt" timestamptz
);
CREATE TABLE tmp_admin_txs (
  id text PRIMARY KEY, "walletId" text, type text, amount numeric(18,2),
  status text, description text, reference text, metadata jsonb, "createdAt" timestamptz
);
SQL

  local psql_auth
  psql_auth=(psql "${DB_URL}/azeebo_auth" -X -q -v ON_ERROR_STOP=1)
  local psql_content
  psql_content=(psql "${DB_URL}/azeebo_content" -X -q -v ON_ERROR_STOP=1)
  local psql_wallet
  psql_wallet=(psql "${DB_URL}/azeebo_wallet" -X -q -v ON_ERROR_STOP=1)

  # users (password column carries the same bcrypt hashes as the auth DB —
  # the admin app never authenticates against it, but keeping the column
  # NOT NULL constraint satisfied matters)
  info "  users ← azeebo_auth.users"
  "${psql_auth[@]}" -c "\copy (SELECT id, email, password, \"displayName\", avatar, role::text, preferences FROM users ORDER BY id) TO STDOUT WITH (FORMAT csv)" \
    | "${psql_admin[@]}" -c "\copy tmp_admin_users (id, email, password, \"displayName\", avatar, role, preferences) FROM STDIN WITH (FORMAT csv)"
  # role::\"UserRole\": the staging table holds text (the CSV pipe drops
  # types), but azeebo_admin.users.role is the UserRole enum — casting the
  # label back to the enum; both enums carry identical labels.
  "${psql_admin[@]}" -c "
    INSERT INTO users (id, email, password, \"displayName\", avatar, role, preferences, \"createdAt\", \"updatedAt\")
    SELECT id, email, password, \"displayName\", avatar, role::\"UserRole\", preferences, COALESCE(\"createdAt\", NOW()), NOW() FROM tmp_admin_users
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      password = EXCLUDED.password,
      \"displayName\" = EXCLUDED.\"displayName\",
      avatar = EXCLUDED.avatar,
      role = EXCLUDED.role,
      preferences = EXCLUDED.preferences,
      \"updatedAt\" = NOW();
  "

  # universes
  info "  universes ← azeebo_content.universes"
  "${psql_content[@]}" -c "\copy (SELECT id, name, \"displayName\", description, icon, color, \"isEnabled\", \"sortOrder\", metadata FROM universes ORDER BY id) TO STDOUT WITH (FORMAT csv)" \
    | "${psql_admin[@]}" -c "\copy tmp_admin_universes (id, name, \"displayName\", description, icon, color, \"isEnabled\", \"sortOrder\", metadata) FROM STDIN WITH (FORMAT csv)"
  "${psql_admin[@]}" -c "
    INSERT INTO universes (id, name, \"displayName\", description, icon, color, \"isEnabled\", \"sortOrder\", metadata, \"createdAt\", \"updatedAt\")
    SELECT id, name, \"displayName\", description, icon, color, \"isEnabled\", \"sortOrder\", metadata, COALESCE(\"createdAt\", NOW()), NOW() FROM tmp_admin_universes
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      \"displayName\" = EXCLUDED.\"displayName\",
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      color = EXCLUDED.color,
      \"isEnabled\" = EXCLUDED.\"isEnabled\",
      \"sortOrder\" = EXCLUDED.\"sortOrder\",
      metadata = EXCLUDED.metadata,
      \"updatedAt\" = NOW();
  "

  # content items (needs a universe FK — seeded above)
  info "  content_items ← azeebo_content.content_items"
  "${psql_content[@]}" -c "\copy (SELECT id, title, description, thumbnail, \"mediaUrl\", \"universeId\", \"creatorId\", status, \"viewCount\", metadata, \"publishedAt\" FROM content_items ORDER BY id) TO STDOUT WITH (FORMAT csv)" \
    | "${psql_admin[@]}" -c "\copy tmp_admin_content (id, title, description, thumbnail, \"mediaUrl\", \"universeId\", \"creatorId\", status, \"viewCount\", metadata, \"publishedAt\") FROM STDIN WITH (FORMAT csv)"
  "${psql_admin[@]}" -c "
    INSERT INTO content_items (id, title, description, thumbnail, \"mediaUrl\", \"universeId\", \"creatorId\", status, \"viewCount\", metadata, \"publishedAt\", \"createdAt\", \"updatedAt\")
    SELECT id, title, description, thumbnail, \"mediaUrl\", \"universeId\", \"creatorId\", status, \"viewCount\", metadata, \"publishedAt\", COALESCE(\"createdAt\", NOW()), NOW() FROM tmp_admin_content
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      thumbnail = EXCLUDED.thumbnail,
      \"mediaUrl\" = EXCLUDED.\"mediaUrl\",
      \"universeId\" = EXCLUDED.\"universeId\",
      \"creatorId\" = EXCLUDED.\"creatorId\",
      status = EXCLUDED.status,
      \"viewCount\" = EXCLUDED.\"viewCount\",
      metadata = EXCLUDED.metadata,
      \"publishedAt\" = EXCLUDED.\"publishedAt\",
      \"updatedAt\" = NOW();
  "

  # wallets (skip rows whose owner wasn't mirrored into azeebo_admin.users —
  # test leftovers etc. — the FK would reject them). The wallet DB has no
  # users table, so filter against the mirrored user IDs explicitly.
  info "  wallets ← azeebo_wallet.wallets"
  local user_id_list
  # chr(39) = single quote, chr(44) = comma — builds 'id1','id2',… without
  # nested-quote hell; COALESCE to NULL so an empty user set matches nothing.
  user_id_list=$("${psql_admin[@]}" -t -A -c $'SELECT COALESCE(string_agg(chr(39) || id || chr(39), chr(44)), \'NULL\') FROM users')
  "${psql_wallet[@]}" -c "\copy (SELECT id, \"userId\", balance, currency FROM wallets WHERE \"userId\" IN (${user_id_list:-''}) ORDER BY id) TO STDOUT WITH (FORMAT csv)" \
    | "${psql_admin[@]}" -c "\copy tmp_admin_wallets (id, \"userId\", balance, currency) FROM STDIN WITH (FORMAT csv)"
  "${psql_admin[@]}" -c "
    INSERT INTO wallets (id, \"userId\", balance, currency, \"createdAt\", \"updatedAt\")
    SELECT id, \"userId\", balance, currency, COALESCE(\"createdAt\", NOW()), NOW() FROM tmp_admin_wallets
    ON CONFLICT (id) DO UPDATE SET
      \"userId\" = EXCLUDED.\"userId\",
      balance = EXCLUDED.balance,
      currency = EXCLUDED.currency,
      \"updatedAt\" = NOW();
  "

  # wallet transactions (FK: walletId → wallets.id, seeded above; same
  # orphan-row filter as wallets)
  info "  wallet_transactions ← azeebo_wallet.wallet_transactions"
  "${psql_wallet[@]}" -c "\copy (SELECT t.id, t.\"walletId\", t.type, t.amount, t.status, t.description, t.reference, t.metadata FROM wallet_transactions t JOIN wallets w ON w.id = t.\"walletId\" AND w.\"userId\" IN (${user_id_list:-''}) ORDER BY t.id) TO STDOUT WITH (FORMAT csv)" \
    | "${psql_admin[@]}" -c "\copy tmp_admin_txs (id, \"walletId\", type, amount, status, description, reference, metadata) FROM STDIN WITH (FORMAT csv)"
  "${psql_admin[@]}" -c "
    INSERT INTO wallet_transactions (id, \"walletId\", type, amount, status, description, reference, metadata, \"createdAt\")
    SELECT id, \"walletId\", type, amount, status, description, reference, metadata, COALESCE(\"createdAt\", NOW()) FROM tmp_admin_txs
    ON CONFLICT (id) DO UPDATE SET
      \"walletId\" = EXCLUDED.\"walletId\",
      type = EXCLUDED.type,
      amount = EXCLUDED.amount,
      status = EXCLUDED.status,
      description = EXCLUDED.description,
      reference = EXCLUDED.reference,
      metadata = EXCLUDED.metadata;
  "

  # Tally what the panel will now show
  local total_users total_content total_revenue
  total_users=$("${psql_admin[@]}" -t -A -c 'SELECT COUNT(*) FROM users')
  total_content=$("${psql_admin[@]}" -t -A -c 'SELECT COUNT(*) FROM content_items')
  total_revenue=$("${psql_admin[@]}" -t -A -c "SELECT COALESCE(SUM(amount),0) FROM wallet_transactions WHERE type='credit' AND status='completed'")
  ok "  azeebo_admin seeded: ${total_users} users, ${total_content} content items, ₦${total_revenue} revenue"

  "${psql_admin[@]}" -c 'DROP TABLE IF EXISTS tmp_admin_users, tmp_admin_universes, tmp_admin_content, tmp_admin_wallets, tmp_admin_txs CASCADE'
}

# ============================================================
# Feature Flags (Redis)
# ============================================================
# Seeds the DEV default feature flags into Redis. Existing values are
# never overwritten (defaults are code-registered per service anyway — these
# rows only pin the values for local experimentation).
# Redis key convention: feature_flags:{key} → JSON.
seed_flags() {
  if ! command -v redis-cli &>/dev/null; then
    warn "redis-cli not found — skipping feature-flag seeding"
    return 0
  fi
  if ! redis-cli ping &>/dev/null; then
    warn "Redis not reachable — skipping feature-flag seeding"
    return 0
  fi

  info "Seeding dev feature flags (idempotent — existing keys untouched)"
  # Each entry is a full JSON payload under feature_flags:{key}; booleans set
  # enabled, numerics carry a value with enabled=true.
  local flags=( \
    "web_maintenance_mode|{\"key\":\"web_maintenance_mode\",\"enabled\":false}" \
    "web_dark_mode|{\"key\":\"web_dark_mode\",\"enabled\":true}" \
    "mobile_autoplay|{\"key\":\"mobile_autoplay\",\"enabled\":true}" \
    "search_typo_tolerance|{\"key\":\"search_typo_tolerance\",\"enabled\":true}" \
    "search_fuzzy_trigram_weight|{\"key\":\"search_fuzzy_trigram_weight\",\"enabled\":true,\"value\":0.4}" \
    "content_premium_gate|{\"key\":\"content_premium_gate\",\"enabled\":false}" \
  )
  for entry in "${flags[@]}"; do
    local key="${entry%%|*}" payload="${entry#*|}"
    # SETNX: only seed when the flag has no stored value yet.
    if redis-cli --raw SETNX "feature_flags:${key}" "$payload" | grep -q 1; then
      ok "  Seeded flag ${key}"
    else
      info "  Flag ${key} already set — skipped"
    fi
  done
}

# ============================================================
# Main
# ============================================================

main() {
  local target_db="${1:-all}"

  echo ""
  printf "${BOLD}Azeebo+ Multi-Database Seed Script${RESET}\n"
  echo "Target: ${target_db}"
  echo ""

  case "$target_db" in
    auth)         seed_auth_db ;;
    user)         seed_user_db ;;
    content)      seed_content_db ;;
    wallet)       seed_wallet_db ;;
    media)        seed_media_db ;;
    creator)      seed_creator_db ;;
    reward)       seed_reward_db ;;
    search)       seed_search_db ;;
    notification) seed_notification_db ;;
    analytics)    seed_analytics_db ;;
    admin)        seed_admin_db ;;
    all)
      seed_auth_db
      seed_user_db
      seed_content_db
      seed_wallet_db
      seed_media_db
      seed_creator_db
      seed_reward_db
      seed_search_db
      seed_notification_db
      seed_analytics_db
      seed_admin_db
      seed_flags
      ;;
    flags)
      seed_flags
      ;;
    *)
      err "Unknown database: $target_db"
      echo "Available: auth, user, content, wallet, media, creator, reward, search, notification, analytics, admin, flags, all"
      exit 1
      ;;
  esac

  echo ""
  ok "Seeding complete!"
}

main "$@"
