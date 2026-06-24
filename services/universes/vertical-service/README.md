# Vertical Service

Azeebo+ Vertical Service - Universe for vertical storytelling content with universes, characters, timelines, lore, and crossovers.

## Features

- **Universes**: Manage fictional universes
- **Characters**: Character profiles and relationships
- **Timelines**: Chronological story timelines
- **Lore**: World building and background lore
- **Titles**: Content titles within the universe
- **Crossovers**: Cross-universe story crossovers

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3017 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| MEDIA_SERVICE_URL | http://localhost:3019 | Media service URL |

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

- `GET /v1/vertical/universes` - Get universes
- `GET /v1/vertical/universes/:id` - Get universe details
- `GET /v1/vertical/characters` - Get characters
- `GET /v1/vertical/timelines` - Get timelines
- `GET /v1/vertical/lore` - Get lore
- `GET /v1/vertical/crossovers` - Get crossovers

## Ownership

- **Team**: Vertical Universe
- **Maintainer**: vertical-engineering@azeeboplus.com
- **Last Updated**: 2026-05-11
