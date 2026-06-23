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
    └── 002_seed_demo_data.sql      # Comprehensive seed data
```

## Demo Data Overview

### Users (10)
| Email | Role | Status |
|-------|------|--------|
| admin@azeebo.com | Admin | Active |
| mod@azeebo.com | Admin (Moderator) | Active |
| banned@azeebo.com | User | Banned |
| unverified@azeebo.com | User | Pending |
| creator@choplife.com | Creator | Active |
| creator@naijavibes.com | Creator | Active |
| creator@lagosvibes.com | Creator | Active |
| viewer1@demo.com | Viewer | Active |
| viewer2@demo.com | Viewer | Active |
| viewer3@demo.com | Viewer | Active |

**All users**: Password `Demo123!`

### Universes (8)
Reality TV, Creator Hub, Lifestyle, Movies, Comedy, Sports, Music, Gaming

### Content Items (30)
30 realistic Nigerian entertainment content items across all universes:
- Reality: Big Brother Naija, Lagos Love Island, Cook Off Naija, etc.
- Creator: Creator Academy, Unbox Therapy Naija, Tech Talk Naija, etc.
- Lifestyle: Lagos Food Tour, Fashion Week Lagos, etc.
- Movies: Lagos King: The Return, Love at First Jollof, The Guardian, etc.
- Comedy: AY Live: Uncensored, Basketmouth: Africa Laughs, etc.
- Sports: Naija Football League, Lagos Marathon 2025, etc.
- Music: Burna Boy: Live in Lagos, Wizkid: Made in Lagos Tour, etc.
- Gaming: Naija Gaming League, FIFA Tournament Lagos, etc.

### Financial Data
- **3 Wallets** with balances (NGN 8,500 - 23,000)
- **10 Wallet Transactions** (credits, debits, bonuses, refunds)
- **3 Passes** (daily, weekly, monthly with different statuses)
- **2 Rentals** (Lagos King, Love at First Jollof)
- **3 Subscriptions** (basic, premium, yearly)

### Other Data
- **8 Categories** (Trending, New Releases, Editor's Picks, etc.)
- **15 Tags** (naija, big-brother, nollywood, afrobeats, etc.)
- **5 Media Assets** (video + thumbnail pairs)
- **5 Content Relationships** (sequels, spin-offs, compilations)
- **10 Comments** with realistic Nigerian entertainment discussions
- **10 Watch History** records
- **2 Screenings** (upcoming events)
- **4 Locked Extras** (behind-the-scenes, deleted scenes)
- **6 Universe Feature Flags**
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
| `/api/v1/content/featured` | GET | Public | 6 exclusive/premiere items |
| `/api/v1/content/trending` | GET | Public | 20 items by view count |
| `/api/v1/content/:id` | GET | Public | Individual content item |
| `/api/v1/content` | GET | Required | Full content list |

## Content Service Enhancement

The `getFeatured()` endpoint was implemented to query actual data:

```typescript
// content.service.ts
async getFeatured() {
  // First tries: exclusive OR premiere content
  // Falls back to: top viewed published content
}
```

## Database Tables Created

The migration creates tables for all services:

| Service | Tables |
|---------|--------|
| Auth | auth_users, user_roles, refresh_tokens, login_attempts, otp_codes, password_reset_tokens, verification_tokens |
| Content | universes, categories, tags, content_items, content_categories, content_tags, media_assets, content_relationships |
| User | user_profiles, user_preferences, saved_items, following, subscriptions, user_universe_affinity |
| Wallet | wallets, wallet_transactions |
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
