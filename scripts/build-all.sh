#!/bin/bash
# ============================================================
# Azeebo+ — Build All Libraries, Services, and Apps
# ============================================================
# Called by Nixpacks during the build phase.
# Order: libs first (dependency order), then services, then apps.
# ============================================================
set -e

echo "==> Building libraries..."

pnpm --filter @azeebo/utils run build
pnpm --filter @azeebo/shared-types run build
pnpm --filter @azeebo/validation run build
pnpm --filter @azeebo/error-handling run build
pnpm --filter @azeebo/logger run build
pnpm --filter @azeebo/api-client run build
pnpm --filter @azeebo/design-tokens run build
pnpm --filter @azeebo/ui run build

echo "==> Generating Prisma clients and building services..."

# Core services
pnpm --filter @azeebo/auth-service prisma:generate && pnpm --filter @azeebo/auth-service run build
pnpm --filter @azeebo/user-service prisma:generate && pnpm --filter @azeebo/user-service run build
pnpm --filter @azeebo/wallet-service prisma:generate && pnpm --filter @azeebo/wallet-service run build
pnpm --filter @azeebo/payment-service prisma:generate && pnpm --filter @azeebo/payment-service run build
pnpm --filter @azeebo/content-service prisma:generate && pnpm --filter @azeebo/content-service run build
pnpm --filter @azeebo/search-service prisma:generate && pnpm --filter @azeebo/search-service run build
pnpm --filter @azeebo/media-service run build

# Engagement services
pnpm --filter @azeebo/notification-service prisma:generate && pnpm --filter @azeebo/notification-service run build
pnpm --filter @azeebo/reward-service prisma:generate && pnpm --filter @azeebo/reward-service run build
pnpm --filter @azeebo/engagement-service prisma:generate && pnpm --filter @azeebo/engagement-service run build
pnpm --filter @azeebo/messaging-service prisma:generate && pnpm --filter @azeebo/messaging-service run build
pnpm --filter @azeebo/referral-service prisma:generate && pnpm --filter @azeebo/referral-service run build
pnpm --filter @azeebo/subscription-service prisma:generate && pnpm --filter @azeebo/subscription-service run build

# Intelligence services
pnpm --filter @azeebo/analytics-service prisma:generate && pnpm --filter @azeebo/analytics-service run build
pnpm --filter @azeebo/recommendation-service prisma:generate && pnpm --filter @azeebo/recommendation-service run build

# Universes services
pnpm --filter @azeebo/reality-service prisma:generate && pnpm --filter @azeebo/reality-service run build
pnpm --filter @azeebo/movie-service prisma:generate && pnpm --filter @azeebo/movie-service run build
pnpm --filter @azeebo/comedy-service prisma:generate && pnpm --filter @azeebo/comedy-service run build
pnpm --filter @azeebo/games-service prisma:generate && pnpm --filter @azeebo/games-service run build
pnpm --filter @azeebo/sports-service prisma:generate && pnpm --filter @azeebo/sports-service run build
pnpm --filter @azeebo/lifestyle-service prisma:generate && pnpm --filter @azeebo/lifestyle-service run build
pnpm --filter @azeebo/vertical-service prisma:generate && pnpm --filter @azeebo/vertical-service run build
pnpm --filter @azeebo/creator-service prisma:generate && pnpm --filter @azeebo/creator-service run build

# Operations services
pnpm --filter @azeebo/queue-service prisma:generate && pnpm --filter @azeebo/queue-service run build
pnpm --filter @azeebo/support-service prisma:generate && pnpm --filter @azeebo/support-service run build
pnpm --filter @azeebo/moderation-service prisma:generate && pnpm --filter @azeebo/moderation-service run build

# Gateway
pnpm --filter @azeebo/api-gateway prisma:generate && pnpm --filter @azeebo/api-gateway run build

echo "==> Building frontend apps..."

pnpm --filter @azeebo/admin run build
pnpm --filter @azeebo/creator-portal run build
pnpm --filter @azeebo/web run build

echo "==> Build complete."
