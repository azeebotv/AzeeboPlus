# Search Service

Azeebo+ Search Service - Provides fast, full-text search across all content universes.

## Features

- **Full-Text Search**: Search across movies, games, comedy, sports, reality, etc.
- **Filtered Search**: Filter results by category, genre, rating, etc.
- **Typeahead Suggestions**: Provides real-time search suggestions
- **Highlighting**: Highlights matching terms in search results
- **Pagination**: Supports paginated search results

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3005 | Service port |
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

- `GET /v1/search` - Search across all content
- `GET /v1/search/suggestions` - Get typeahead suggestions
- `GET /v1/search/filters` - Get available search filters

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: platform-engineering@azeebo.com
- **Last Updated**: 2026-05-11
