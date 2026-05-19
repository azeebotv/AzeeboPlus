# Movie Service

Azeebo+ Movie Service - Manages movies, cinema passes, and filmmaker content.

## Features

- **Movie Catalog**: Browse and manage movie content
- **Cinema Passes**: Virtual cinema pass management
- **Filmmaker Tools**: Tools for filmmakers to manage their content
- **Viewing Windows**: Time-limited viewing windows for movies

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3011 | Service port |
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

- `GET /v1/movies` - List movies
- `GET /v1/movies/:id` - Get movie details
- `POST /v1/movies` - Create movie (filmmaker only)
- `PUT /v1/movies/:id` - Update movie
- `POST /v1/movies/:id/viewing-window` - Set viewing window
- `GET /v1/cinema-passes` - List cinema passes
- `POST /v1/cinema-passes/purchase` - Purchase cinema pass

## Ownership

- **Team**: Entertainment
- **Maintainer**: entertainment@azeebo.com
- **Last Updated**: 2026-05-14
