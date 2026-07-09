# Creator Service

Azeebo+ Creator Service - Manages creator profiles, content creation, and creator workflows.

## Features

- **Creator Profiles**: Manage creator profiles and settings
- **Content Creation**: Tools for creators to manage their content
- **Creator Analytics**: Insights for creators to track their performance
- **Rate Limiting**: Protection against abuse

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3006 | Service port |
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

- `GET /v1/creators/profile` - Get creator profile
- `PUT /v1/creators/profile` - Update creator profile
- `GET /v1/creators/analytics` - Get creator analytics
- `POST /v1/creators/content` - Create new content

## Ownership

- **Team**: Creator Platform
- **Maintainer**: creator-platform@azeeboplus.com
- **Last Updated**: 2026-05-14
