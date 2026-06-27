# SQL Migrations

Numbered SQL migration scripts for the shared `azeebo_plus_dev` database.

## Run All

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d azeebo_plus_dev -f scripts/sql/000-docker-init-databases.sql

for f in scripts/sql/0{01..12}-*.sql; do
  echo "Running $f..."
  PGPASSWORD=postgres psql -h localhost -U postgres -d azeebo_plus_dev -f "$f"
done
```

## Files

| File | Description |
|------|-------------|
| `000-docker-init-databases.sql` | Docker init — creates all service databases (not used in shared DB mode) |
| `001-sync-user-service-schema.sql` | Adds `contentType`, `universe` to `watch_history`; `actorRole`, `targetType` to `audit_logs` |
| `002-sync-auth-service-schema.sql` | Adds `password`, `isVerified`, MFA columns to `users`; creates `sessions`, `otps`, `social_accounts`, `roles` |
| `003-fix-existing-data.sql` | Fixes NULL `password` values for users created before column existed |
| `004-restore-wallet-table.sql` | Restores `wallets` table (dropped by accidental `prisma db push`) |
| `005-sync-wallet-service-schema.sql` | Creates `wallet_transactions` for audit trails |
| `006-sync-payment-service-schema.sql` | Creates `payments`, `refunds`, `escrow`, `payouts`, `webhooks` |
| `007-sync-content-service-schema.sql` | Creates `content`, `content_items`, `premium_content`, `tags`, `content_tags` |
| `008-sync-engagement-service-schema.sql` | Creates `rewards`, `referrals`, `subscriptions`, `notifications`, `messages` |
| `009-sync-search-service-schema.sql` | Creates `search_analytics`, `saved_searches` |
| `010-sync-operations-service-schema.sql` | Creates `tickets`, `disputes`, `chargebacks`, `appeals`, `takedowns`, `moderation_queue`, `job_queue` |
| `011-sync-universes-service-schema.sql` | Creates `reality_seasons`, `reality_episodes`, `movies`, `comedy_shows`, `games`, `sports_events`, `lifestyle_categories`, `creators` |
| `012-sync-media-service-schema.sql` | Creates `media`, `uploads`, `premium_content_media` |
| `013-init-test-db.sql` | Initializes the test database with extensions and schema |

## Legacy

| File | Description |
|------|-------------|
| `legacy-sync-auth-schema.sql` | Original auth sync script (superseded by `002`) |
| `legacy-fix-auth-password.sql` | Original password fix (superseded by `003`) |
