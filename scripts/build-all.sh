#!/bin/bash
# ============================================================
# Azeebo+ — Build All Libraries, Services, and Apps
# ============================================================
# Called by Nixpacks during the build phase.
# Order: libs first (dependency order), then services, then apps.
# ============================================================
set -euo pipefail

echo "==> Building libraries..."

pnpm --filter @azeebo/shared-types run build
pnpm --filter @azeebo/http-client run build
pnpm --filter @azeebo/utils run build
pnpm --filter @azeebo/validation run build
pnpm --filter @azeebo/error-handling run build
pnpm --filter @azeebo/logger run build
pnpm --filter @azeebo/api-client run build
pnpm --filter @azeebo/design-tokens run build
pnpm --filter @azeebo/shared-services prisma:generate
bash scripts/patch-prisma-client.sh
pnpm --filter @azeebo/security run build
pnpm --filter @azeebo/ui run build

echo "==> Generating Prisma clients and building services..."

# Core services
pnpm --filter @azeebo/auth-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/auth-service run build
pnpm --filter @azeebo/user-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/user-service run build
pnpm --filter @azeebo/wallet-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/wallet-service run build
pnpm --filter @azeebo/payment-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/payment-service run build
pnpm --filter @azeebo/content-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/content-service run build
pnpm --filter @azeebo/search-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/search-service run build
pnpm --filter @azeebo/media-service run build

# Engagement services
pnpm --filter @azeebo/notification-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/notification-service run build
pnpm --filter @azeebo/reward-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/reward-service run build
pnpm --filter @azeebo/engagement-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/engagement-service run build
pnpm --filter @azeebo/messaging-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/messaging-service run build
pnpm --filter @azeebo/referral-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/referral-service run build
pnpm --filter @azeebo/subscription-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/subscription-service run build

# Intelligence services
pnpm --filter @azeebo/analytics-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/analytics-service run build
pnpm --filter @azeebo/recommendation-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/recommendation-service run build

# Universes services
pnpm --filter @azeebo/reality-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/reality-service run build
pnpm --filter @azeebo/movie-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/movie-service run build
pnpm --filter @azeebo/comedy-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/comedy-service run build
pnpm --filter @azeebo/games-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/games-service run build
pnpm --filter @azeebo/sports-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/sports-service run build
pnpm --filter @azeebo/lifestyle-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/lifestyle-service run build
pnpm --filter @azeebo/vertical-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/vertical-service run build
pnpm --filter @azeebo/creator-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/creator-service run build

# Operations services
pnpm --filter @azeebo/queue-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/queue-service run build
pnpm --filter @azeebo/support-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/support-service run build
pnpm --filter @azeebo/moderation-service prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/moderation-service run build

# Gateway
pnpm --filter @azeebo/api-gateway prisma:generate && bash scripts/patch-prisma-client.sh && pnpm --filter @azeebo/api-gateway run build

echo "==> Building frontend apps..."

pnpm --filter @azeebo/admin run build
pnpm --filter @azeebo/creator run build
pnpm --filter @azeebo/web run build

echo "==> Build complete."
