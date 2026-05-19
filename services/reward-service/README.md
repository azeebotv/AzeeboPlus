# Reward Service

Azeebo+ Reward Service - Manages rewards, points, and loyalty programs.

## Features

- **Points System**: Award and track user points
- **Rewards Catalog**: Manage available rewards
- **Redemption**: Process reward redemptions
- **Reward History**: Full audit trail of reward transactions

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3012 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm start:dev
```

## API Routes

- `GET /v1/rewards` - List available rewards
- `GET /v1/rewards/:id` - Get reward details
- `POST /v1/rewards/redeem` - Redeem a reward
- `GET /v1/rewards/history` - Get user's reward history
- `GET /v1/points/balance` - Get user's points balance

## Ownership

- **Team**: Rewards Team
- **Maintainer**: rewards@azeebo.com
- **Last Updated**: 2026-05-14
