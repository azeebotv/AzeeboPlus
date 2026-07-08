# Comedy Service

Azeebo+ Comedy Service - Manages comedy content, shows, and feeds.

## Features

- **Comedy Shows**: Manage comedy show content
- **Comedy Feed**: Personalized comedy content feed
- **Content Moderation**: Safe content delivery with moderation workflows

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3019 | Service port |
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

- `GET /v1/comedy/shows` - List comedy shows
- `GET /v1/comedy/shows/:id` - Get comedy show by ID
- `GET /v1/comedy/feed` - Get personalized comedy feed

## Ownership

- **Team**: Content Engineering
- **Maintainer**: content-engineering@azeeboplus.com
- **Last Updated**: 2026-05-14
