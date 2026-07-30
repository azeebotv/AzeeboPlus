# Live Event Service

Azeebo+ Live Event Service - Manages live events, streaming, health checks, and real-time engagement.

## Features

- **Live Events**: Create and manage live streaming events
- **Real-time Chat**: Live chat during events
- **Health Checks**: Service health monitoring
- **Viewer Tracking**: Real-time viewer counts and engagement

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3020 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | - | Redis connection string |

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

- `GET /v1/live-events` - List live events
- `GET /v1/live-events/:id` - Get event details
- `POST /v1/live-events` - Create event (admin)
- `PUT /v1/live-events/:id` - Update event (admin)
- `GET /v1/live-events/:id/health` - Health check

## Ownership

- **Team**: Live Events Platform
- **Maintainer**: live-events@azeeboplus.com
- **Last Updated**: 2026-07-30
