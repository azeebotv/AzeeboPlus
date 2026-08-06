# Azeebo+ Demo Content System

Production-like demo dataset for end-to-end testing of the Azeebo+ application interface.

## Quick Start

```bash
# Deploy demo content to local database
./scripts/demo-content/deploy.sh local

# Check status
./scripts/demo-content/status.sh local

# Rollback (remove all demo data)
./scripts/demo-content/rollback.sh local
```

## Directory Structure

```
scripts/demo-content/
├── VERSION                    # Current demo content version
├── deploy.sh                  # Deploy script (migrations + seed)
├── rollback.sh                # Rollback script (truncate + optional restore)
├── status.sh                  # Status/health check script
├── README.md                  # This file
├── backups/                   # Auto-created backup directory
└── migrations/
    ├── 001_create_all_tables.sql   # Schema migration (all services)
    ├── 002_seed_demo_data.sql      # Comprehensive seed data (core platform)
    └── 003_seed_additions.sql      # Additional seed data (lifestyle, comedy, movies, vertical, sports, payments)
```

## Demo Data Overview (v2.0.0)

### Users (12)
| Email | Role | Status |
|-------|------|--------|
| admin@azeeboplus.com | Admin | Active |
| mod@azeeboplus.com | Admin (Moderator) | Active |
| banned@azeeboplus.com | User | Banned |
| unverified@azeeboplus.com | User | Pending |
| creator@choplife.com | Creator | Active |
| creator@naijavibes.com | Creator | Active |
| creator@lagosvibes.com | Creator | Active |
| creator@naijagaming.com | Creator (Gaming) | Active |
| creator@naijasports.com | Creator (Sports) | Active |
| viewer1@demo.com | Viewer | Active |
| viewer2@demo.com | Viewer | Active |
| viewer3@demo.com | Viewer | Active |

**All users**: Password `Demo123!`

### Universes (8)
Reality TV, Creator Hub, Lifestyle, Movies, Comedy, Sports, Music, Gaming

### Content Items (68)
68 realistic Nigerian entertainment content items across all universes:
- **Reality** (12): Big Brother Naija, Lagos Love Island, Cook Off Naija, etc.
- **Creator** (10): Creator Academy, Unbox Therapy Naija, Tech Talk Naija, etc.
- **Lifestyle** (8): Lagos Food Tour, Fashion Week Lagos, etc.
- **Movies** (10): Lagos King: The Return, Love at First Jollof, etc.
- **Comedy** (8): AY Live: Uncensored, Basketmouth: Africa Laughs, etc.
- **Sports** (5): Naija Football League, Lagos Marathon 2025, etc.
- **Music** (7): Burna Boy: Live in Lagos, Wizkid: Made in Lagos Tour, etc.
- **Gaming** (8): Naija Gaming League, FIFA Tournament Lagos, etc.

### Creator Ecosystem
- **3 Creator Profiles** (Chinedu Creator, Chioma Vibes, Tunde Gaming)
- **3 Creator Channels** (ChopLife TV, Naija Vibes, Tunde Gaming)
- **6 Creator Earnings** (views, tips, subscriptions)
- **2 Creator Challenges** (Comedy Skit Challenge, Gaming Tournament)
- **3 Challenge Entries** with submission details
- **2 Payout Requests** (pending + completed)

### Reality TV & Voting
- **3 Reality Shows** (Big Brother Naija, Lagos Love Island, Cook Off Naija)
- **3 Reality Seasons** (current seasons)
- **6 Reality Episodes** with air dates
- **8 Reality Contestants** across shows
- **15 Reality Votes** with viewer preferences
- **3 Reality Supervotes** (premium voting)
- **5 Reality Predictions** (who will win)

### Sports & Predictions
- **4 Sports Events** (NPL matches, Lagos Marathon)
- **6 Event Teams** (clubs + marathon participants)
- **2 Prediction Markets** (match winners, marathon top 3)
- **4 Prediction Entries** with stake amounts

### Games & Tournaments
- **5 Games** (Naija Trivia, Lagos History, Music Quiz, etc.)
- **15 Game Questions** with options and explanations
- **2 Tournaments** (Weekly Trivia, Monthly Championship)
- **4 Tournament Entries** with scores

### Comedy
- **2 Comedian Profiles** (AY Makun, Basketmouth)
- **4 Comedy Clips** with metadata

### Engagement & Gamification
- **12 Notifications** (system, payment, content, social, reward)
- **8 Leaderboard Entries** (trivia, comedy, predictions)
- **3 Referrals** with reward tracking

### Operations
- **3 Moderation Queue** items (pending, reviewed, dismissed)
- **2 Support Tickets** (wallet + subscription issues)

### Financial Data
- **5 Wallets** with balances (NGN 8,500 - 25,000)
- **20 Wallet Transactions** (credits, debits, tips, earnings, refunds)
- **5 Passes** (daily, weekly, monthly with different statuses)
- **2 Rentals** (Lagos King, Love at First Jollof)
- **5 Subscriptions** (basic, premium, yearly, active, cancelled)

### Other Data
- **8 Categories** (Trending, New Releases, Editor's Picks, etc.)
- **15 Tags** (naija, big-brother, nollywood, afrobeats, gaming, etc.)
- **60+ Media Assets** (video + thumbnail pairs for all content)
- **5 Content Relationships** (sequels, spin-offs, compilations)
- **25 Comments** with threaded replies
- **20 Watch History** records
- **2 Screenings** (upcoming events)
- **4 Locked Extras** (behind-the-scenes, deleted scenes)
- **12 Universe Feature Flags** (gaming tournaments, live streams, etc.)
- **20 System Settings** (general, SEO, payments, content, auth)
- **3 Audit Logs**

## Deployment

### Local Development

```bash
# Full deploy (migrations + seed)
./scripts/demo-content/deploy.sh local

# Skip migrations if tables already exist
./scripts/demo-content/deploy.sh local --skip-migrate

# Skip seed if you only need schema
./scripts/demo-content/deploy.sh local --skip-seed
```

### Staging

```bash
# Set required environment variables
export STAGING_DB_HOST=your-staging-db-host
export STAGING_DB_USER=your-staging-db-user
export STAGING_DB_PASSWORD=your-staging-db-password
export STAGING_DB_NAME=azeebo_plus_staging

# Deploy
./scripts/demo-content/deploy.sh staging
```

### Manual Deployment

```bash
# Run migrations directly
psql -U postgres -d azeebo_plus_dev -f scripts/demo-content/migrations/001_create_all_tables.sql

# Run seed data
psql -U postgres -d azeebo_plus_dev -f scripts/demo-content/migrations/002_seed_demo_data.sql
```

## Rollback

### Remove All Demo Data

```bash
# Rollback (keeps table schemas)
./scripts/demo-content/rollback.sh local

# Rollback and drop demo-only tables
./scripts/demo-content/rollback.sh local --keep-schema
```

### Restore from Backup

```bash
# The deploy script creates CSV backups before each deployment
# Located in: scripts/demo-content/backups/

# View available backups
ls -la scripts/demo-content/backups/

# Restore specific table (manual)
psql -U postgres -d azeebo_plus_dev -c "TRUNCATE TABLE \"content_items\" CASCADE"
psql -U postgres -d azeebo_plus_dev -c "\COPY content_items FROM 'scripts/demo-content/backups/pre_deploy_content_items.csv' WITH CSV HEADER"
```

## Version Tracking

### Check Current Version

```bash
# File version
cat scripts/demo-content/VERSION

# Database version
./scripts/demo-content/status.sh local
```

### Version Format

The `VERSION` file uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes to demo data structure
- **MINOR**: New content items, users, or features added
- **PATCH**: Bug fixes to seed data or migrations

### Version History

Version history is stored in the `demo_content_versions` table:

```sql
SELECT version, "deployedBy", status, "deployedAt"
FROM demo_content_versions
ORDER BY "deployedAt" DESC;
```

## Health Checks

The status script performs these health checks:

1. **Orphaned Content**: Content items without valid creators
2. **Wallet Integrity**: Wallets linked to valid users
3. **Featured Content**: At least one exclusive/premiere item
4. **Trending Content**: Items with view counts
5. **Admin User**: Active admin account exists

## API Endpoints Verified

After deployment, these endpoints return real data:

| Endpoint | Method | Auth | Returns |
|----------|--------|------|---------|
| `/api/v1/content/featured` | GET | Public | 6+ exclusive/premiere items |
| `/api/v1/content/trending` | GET | Public | 20+ items by view count |
| `/api/v1/content/:id` | GET | Public | Individual content item |
| `/api/v1/content` | GET | Required | Full content list |

## Database Tables Created

The migration creates tables for all services:

| Service | Tables |
|---------|--------|
| Auth | auth_users, user_roles, refresh_tokens, login_attempts, otp_codes, password_reset_tokens, verification_tokens |
| Content | universes, categories, tags, content_items, content_categories, content_tags, media_assets, content_relationships |
| User | user_profiles, user_preferences, saved_items, following, subscriptions, user_universe_affinity |
| Wallet | wallets, wallet_transactions |
| Creator | creator_profiles, creator_channels, creator_earnings, creator_challenges, challenge_entries, payout_requests |
| Reality | reality_shows, reality_seasons, reality_episodes, reality_contestants, reality_votes, reality_supervotes, reality_predictions |
| Sports | sports_events, event_teams, prediction_markets, prediction_entries |
| Games | games, game_questions, tournaments, tournament_entries |
| Comedy | comedian_profiles, comedy_clips |
| Engagement | notifications, leaderboard_entries, referrals |
| Operations | moderation_queue, support_tickets |
| Shared | comments, rentals, passes, screenings, locked_extras, user_unlocks, watch_history, universe_feature_flags, system_settings, audit_logs |
| Demo | demo_content_versions |

## Troubleshooting

### "integer out of range" error
The `media_assets.size` column is `BIGINT`. If you see this error, ensure the migration ran the latest version.

### "null value in column updatedAt" error
The `wallets` and `wallet_transactions` tables have `NOT NULL` constraints on `updatedAt`. The seed data includes explicit timestamps for these.

### Featured/trending returns empty
Ensure the content-service has the `getFeatured()` and `getTrending()` methods implemented (see Content Service Enhancement above).

### Gateway 502 errors
Ensure all microservices are running:
```bash
lsof -P -i :3000 -i :3003 -i :3004 -i :3013 2>/dev/null | grep LISTEN
```
