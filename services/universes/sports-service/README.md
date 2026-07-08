# Sports Service

Azeebo+ Sports Service - Manages sports content, fixtures, prediction markets, and fan contests.

## Features

- **Sports Fixtures**: Manage sports matches and events
- **Prediction Markets**: Create and settle prediction markets
- **Fan Contests**: Create contests for fans to participate
- **Results Management**: Record and verify match results
- **Market Settlement**: Automatic market resolution based on results

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3017 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |

## Getting Started

```bash
# Install dependencies
ppnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
ppnpm start:dev
```

## API Routes

- `GET /v1/sports/fixtures` - List upcoming fixtures
- `GET /v1/sports/fixtures/:id` - Get fixture details
- `POST /v1/sports/fixtures` - Create fixture (admin)
- `PUT /v1/sports/fixtures/:id/result` - Update result (admin)
- `POST /v1/sports/markets` - Create prediction market
- `GET /v1/sports/markets/:id` - Get market details
- `POST /v1/sports/markets/:id/settle` - Settle market (admin)
- `POST /v1/sports/contests` - Create fan contest
- `POST /v1/sports/contests/:id/join` - Join contest
- `POST /v1/sports/contests/:id/end` - End contest (admin)

## Ownership

- **Team**: Sports Platform
- **Maintainer**: sports-platform@azeeboplus.com
- **Last Updated**: 2026-05-14
