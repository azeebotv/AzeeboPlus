# Games Service

Azeebo+ Games Service - Manages games, tournaments, and game catalog.

## Features

- **Game Catalog**: Browse and manage available games
- **Game Sessions**: Track active game sessions
- **Tournaments**: Create and manage gaming tournaments
- **Tournament brackets**: Automated bracket generation

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3018 | Service port |
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

- `GET /v1/games` - List all games
- `GET /v1/games/:id` - Get game details
- `POST /v1/tournaments` - Create tournament
- `GET /v1/tournaments/:id` - Get tournament details
- `POST /v1/tournaments/:id/join` - Join tournament
- `POST /v1/tournaments/:id/end` - End tournament (admin)

## Ownership

- **Team**: Gaming Platform
- **Maintainer**: gaming-platform@azeeboplus.com
- **Last Updated**: 2026-05-14
