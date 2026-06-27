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
  local db="$1" sql="$2"
  psql -U "$DB_USER" -d "$db" -c "$sql" 2>/dev/null || {
    warn "Some statements in $db may have already existed (idempotent)"
  }
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
  info "Seeding azeebo_auth (admin + demo users)..."

  # Pre-hashed passwords (Admin123! / Demo123!)
  local admin_hash='$2b$10$blGhWs64W.AOGB7UmXU4RuuQnZnGADYRW6iwncr1ECYMPHvXDcc7C'
  local demo_hash='$2b$10$woG0bBvunTUwOziTR2RzEOmvL9Avf8vmZ.AxJqWDYv6sWti7Ryd62'

  run_sql "azeebo_auth" "
    INSERT INTO users (id, email, password, \"displayName\", role, \"isVerified\", \"createdAt\", \"updatedAt\")
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'admin@azeebo.com', '${admin_hash}', 'Platform Admin', 'admin', true, NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000002', 'demo@azeebo.com', '${demo_hash}', 'Demo User', 'user', true, NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000003', 'creator@azeebo.com', '${demo_hash}', 'Demo Creator', 'creator', true, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      password = EXCLUDED.password,
      role = EXCLUDED.role,
      \"displayName\" = EXCLUDED.\"displayName\",
      \"isVerified\" = EXCLUDED.\"isVerified\",
      \"updatedAt\" = NOW();
  "
  ok "Auth database seeded"
}

# ============================================================
# Seed: User Database
# ============================================================
seed_user_db() {
  info "Seeding azeebo_user (user profiles)..."

  local demo_hash='$2b$10$woG0bBvunTUwOziTR2RzEOmvL9Avf8vmZ.AxJqWDYv6sWti7Ryd62'

  run_sql "azeebo_user" "
    INSERT INTO users (id, email, password, \"displayName\", role, \"isVerified\", \"createdAt\", \"updatedAt\")
    VALUES
      ('00000000-0000-0000-0000-000000000002', 'demo@azeebo.com', '${demo_hash}', 'Demo User', 'user', true, NOW(), NOW()),
      ('00000000-0000-0000-0000-000000000003', 'creator@azeebo.com', '${demo_hash}', 'Demo Creator', 'creator', true, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      password = EXCLUDED.password,
      role = EXCLUDED.role,
      \"displayName\" = EXCLUDED.\"displayName\",
      \"updatedAt\" = NOW();
  "
  ok "User database seeded"
}

# ============================================================
# Seed: Content Database (Universes + Categories)
# ============================================================
seed_content_db() {
  info "Seeding azeebo_content (universes, categories, tags, content)..."

  # Universes — camelCase columns matching the content-service Prisma schema
  run_sql "azeebo_content" "
    INSERT INTO universes (id, name, \"displayName\", description, icon, color, \"isEnabled\", \"sortOrder\", \"createdAt\", \"updatedAt\")
    VALUES
      ('64f1a2b0-0000-0000-0000-000000000001', 'comedy',       'Comedy',       'Comedy shows, skits, and humor content',          'ComedyIcon', '#FF6B35', true, 1,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000002', 'reality',      'Reality',      'Reality shows, dating shows, and unscripted TV',    'RealityIcon', '#E91E63', true, 2,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000003', 'movies',       'Movies',       'Nollywood, Ghallywood, and African cinema',         'MoviesIcon', '#9C27B0', true, 3,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000004', 'sports',       'Sports',       'Sports highlights, live games, and analysis',       'SportsIcon', '#4CAF50', true, 4,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000005', 'lifestyle',    'Lifestyle',    'Food, travel, fashion, and wellness content',       'LifestyleIcon', '#FF9800', true, 5,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000006', 'music',        'Music',        'Music videos, live performances, and interviews',   'MusicIcon', '#2196F3', true, 6,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000007', 'gaming',       'Gaming',       'Game streams, esports, and gaming culture',         'GamingIcon', '#00BCD4', true, 7,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000008', 'tech',         'Tech',         'Tech reviews, startups, and digital innovation',    'TechIcon', '#607D8B', true, 8,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000009', 'news',         'News',         'Breaking news, politics, and current affairs',      'NewsIcon', '#795548', true, 9,  NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000010', 'education',    'Education',    'Tutorials, courses, and educational content',       'EducationIcon', '#3F51B5', true, 10, NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000011', 'nollywood',    'Nollywood',    'Dedicated Nollywood movie universe',               'NollywoodIcon', '#880E4F', true, 11, NOW(), NOW()),
      ('64f1a2b0-0000-0000-0000-000000000012', 'pan-african',  'Pan-African',  'Content from across the African continent',        'PanAfricanIcon', '#FF5722', true, 12, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Universes seeded"

  # Categories
  run_sql "azeebo_content" "
    INSERT INTO categories (id, name, slug, description, sortOrder, createdAt, updatedAt)
    VALUES
      ('cat000000-0000-0000-0000-000000000001', 'Nollywood Movies', 'nollywood-movies', 'Best of Nigerian cinema', 1, NOW(), NOW()),
      ('cat000000-0000-0000-0000-000000000002', 'Comedy Sketches', 'comedy-sketches', 'Nigerian comedy and skits', 2, NOW(), NOW()),
      ('cat000000-0000-0000-0000-000000000003', 'Lifestyle & Food', 'lifestyle-food', 'Food, travel, and lifestyle content', 3, NOW(), NOW()),
      ('cat000000-0000-0000-0000-000000000004', 'Sports Highlights', 'sports-highlights', 'NPFL, NBA, and local sports', 4, NOW(), NOW()),
      ('cat000000-0000-0000-0000-000000000005', 'How To & Tutorials', 'how-to-tutorials', 'Educational content and guides', 5, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Categories seeded"

  # Tags
  run_sql "azeebo_content" "
    INSERT INTO tags (id, name, slug, createdAt)
    VALUES
      ('t0000000-0000-0000-0000-000000000001', 'nollywood', 'nollywood', NOW()),
      ('t0000000-0000-0000-0000-000000000002', 'comedy', 'comedy', NOW()),
      ('t0000000-0000-0000-0000-000000000003', 'lagos', 'lagos', NOW()),
      ('t0000000-0000-0000-0000-000000000004', 'food', 'food', NOW()),
      ('t0000000-0000-0000-0000-000000000005', 'sports', 'sports', NOW()),
      ('t0000000-0000-0000-0000-000000000006', 'tutorial', 'tutorial', NOW()),
      ('t0000000-0000-0000-0000-000000000007', 'nigerian-culture', 'nigerian-culture', NOW()),
      ('t0000000-0000-0000-0000-000000000008', 'sketch', 'sketch', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "  Tags seeded"

  # Demo content items (use jsonb_build_object to avoid shell escaping issues)
  run_sql "azeebo_content" "
    INSERT INTO content_items (id, title, description, thumbnail, \"universeId\", \"creatorId\", status, \"viewCount\", metadata, \"createdAt\", \"updatedAt\")
    VALUES
      ('c0000000-0000-0000-0000-000000000001', 'Welcome to Azeebo+', 'Platform introduction and getting started guide', '/assets/thumbnails/welcome.jpg', '64f1a2b0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'PUBLISHED', 0, jsonb_build_object('duration', 120), NOW(), NOW()),
      ('c0000000-0000-0000-0000-000000000002', 'Nollywood Classics Top 10', 'Our pick of the best Nollywood films of all time', '/assets/thumbnails/nollywood.jpg', '64f1a2b0-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003', 'PUBLISHED', 0, jsonb_build_object('readTime', 5), NOW(), NOW()),
      ('c0000000-0000-0000-0000-000000000003', 'Lagos Street Food Tour', 'Exploring the best street food spots in Lagos', '/assets/thumbnails/food.jpg', '64f1a2b0-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'PUBLISHED', 0, jsonb_build_object('duration', 300), NOW(), NOW()),
      ('c0000000-0000-0000-0000-000000000004', 'NPFL Match Highlights', 'Week 10 highlights from the Nigerian Premier Football League', '/assets/thumbnails/sports.jpg', '64f1a2b0-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'PUBLISHED', 0, jsonb_build_object('duration', 180), NOW(), NOW()),
      ('c0000000-0000-0000-0000-000000000005', 'How to Start Content Creation', 'A beginner guide to becoming a content creator on Azeebo+', '/assets/thumbnails/tutorial.jpg', '64f1a2b0-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'PUBLISHED', 0, jsonb_build_object('readTime', 8), NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Content database seeded"
}

# ============================================================
# Seed: Wallet Database
# ============================================================
seed_wallet_db() {
  info "Seeding azeebo_wallet..."
  run_sql "azeebo_wallet" "
    INSERT INTO wallets (id, user_id, balance, currency, status, created_at, updated_at)
    VALUES
      ('w0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 5000.00, 'NGN', 'active', NOW(), NOW()),
      ('w0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 12500.00, 'NGN', 'active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Wallet database seeded"
}

# ============================================================
# Seed: Media Database
# ============================================================
seed_media_db() {
  info "Seeding azeebo_media..."
  run_sql "azeebo_media" "
    INSERT INTO media (id, filename, original_filename, mime_type, size, url, thumbnail_url, uploaded_by, created_at)
    VALUES
      ('m0000000-0000-0000-0000-000000000001', 'default-avatar.png', 'default-avatar.png', 'image/png', 15360, '/assets/default-avatar.png', '/assets/default-avatar-thumb.png', '00000000-0000-0000-0000-000000000002', NOW()),
      ('m0000000-0000-0000-0000-000000000002', 'platform-logo.png', 'platform-logo.png', 'image/png', 81920, '/assets/logo.png', '/assets/logo-thumb.png', '00000000-0000-0000-0000-000000000001', NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Media database seeded"
}

# ============================================================
# Seed: Creator Database
# ============================================================
seed_creator_db() {
  info "Seeding azeebo_creator..."
  run_sql "azeebo_creator" "
    INSERT INTO creator_profiles (id, user_id, display_name, bio, verified, subscriber_count, total_earnings, created_at, updated_at)
    VALUES
      ('cp000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Demo Creator', 'Content creator on Azeebo+ platform', true, 0, 0.00, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Creator database seeded"
}

# ============================================================
# Seed: Reward Database
# ============================================================
seed_reward_db() {
  info "Seeding azeebo_reward..."
  run_sql "azeebo_reward" "
    INSERT INTO reward_programs (id, name, description, points_per_action, status, created_at, updated_at)
    VALUES
      ('rp000000-0000-0000-0000-000000000001', 'Daily Login', 'Earn points for logging in daily', 10, 'active', NOW(), NOW()),
      ('rp000000-0000-0000-0000-000000000002', 'Content Watch', 'Earn points for watching content', 5, 'active', NOW(), NOW()),
      ('rp000000-0000-0000-0000-000000000003', 'Referral Bonus', 'Earn points for referring friends', 500, 'active', NOW(), NOW()),
      ('rp000000-0000-0000-0000-000000000004', 'Creator Milestone', 'Earn points for reaching subscriber milestones', 1000, 'active', NOW(), NOW())
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
    -- Search configuration
    INSERT INTO search_config (id, config_key, config_value, created_at, updated_at)
    VALUES
      ('sc000000-0000-0000-0000-000000000001', 'default_language', 'en', NOW(), NOW()),
      ('sc000000-0000-0000-0000-000000000002', 'max_results_per_page', '20', NOW(), NOW()),
      ('sc000000-0000-0000-0000-000000000003', 'enable_fuzzy_search', 'true', NOW(), NOW())
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
    INSERT INTO notification_templates (id, name, channel, template, created_at, updated_at)
    VALUES
      ('nt000000-0000-0000-0000-000000000001', 'welcome', 'email', 'Welcome to Azeebo+, {{name}}!', NOW(), NOW()),
      ('nt000000-0000-0000-0000-000000000002', 'new_follower', 'push', '{{name}} started following you', NOW(), NOW()),
      ('nt000000-0000-0000-0000-000000000003', 'content_published', 'push', 'Your content {{title}} is now live!', NOW(), NOW()),
      ('nt000000-0000-0000-0000-000000000004', 'reward_earned', 'push', 'You earned {{points}} points!', NOW(), NOW())
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
    INSERT INTO analytics_events (id, event_type, user_id, entity_type, entity_id, metadata, created_at)
    VALUES
      ('ae000000-0000-0000-0000-000000000001', 'platform_launch', '00000000-0000-0000-0000-000000000001', 'system', 'azeebo', jsonb_build_object('version', '1.0.0', 'env', 'development'), NOW())
    ON CONFLICT (id) DO NOTHING;
  "
  ok "Analytics database seeded"
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
      ;;
    *)
      err "Unknown database: $target_db"
      echo "Available: auth, user, content, wallet, media, creator, reward, search, notification, analytics, all"
      exit 1
      ;;
  esac

  echo ""
  ok "Seeding complete!"
}

main "$@"
