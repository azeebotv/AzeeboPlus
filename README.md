# Azeebo+ Monorepo

A comprehensive streaming and content platform built with a microservices architecture.

## Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **Docker**: Latest stable version
- **PostgreSQL**: 15.x (via Docker)
- **Redis**: 7.x (via Docker)

## Installation

```bash
pnpm install
```

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual configuration values:
   - Set `DATABASE_PASSWORD` to a secure password
   - Set `JWT_SECRET` to a strong random string (at least 32 characters)
   - Configure payment provider keys (Paystack/Flutterwave) for production
   - Configure notification provider keys (SendGrid/Twilio) for production

## Database Setup

```bash
pnpm -r prisma generate
pnpm -r exec prisma migrate deploy
```

## Build

Build all packages in the workspace:

```bash
pnpm build
```

## Development

Start all services in development mode:

```bash
pnpm dev
```

## Testing

```bash
pnpm test                 # Run all tests
pnpm run test:unit        # Unit tests only
pnpm run test:integration # Integration tests with DB
pnpm lint                 # Linting
pnpm typecheck            # Type checking
```

## Service Ports

| Service | Port | Route Prefix |
|---------|------|--------------|
| auth-service | 3000 | /auth |
| user-service | 3001 | /users |
| wallet-service | 3002 | /wallet |
| payment-service | 3003 | /payment |
| content-service | 3004 | /content |
| media-service | 3019 | /media |
| search-service | 3005 | /search |
| notification-service | 3006 | /notifications |
| reward-service | 3007 | /rewards |
| analytics-service | 3008 | /analytics |
| recommendation-service | 3009 | /recommendation |
| lifestyle-service | 3016 | /lifestyle |
| vertical-service | 3017 | /vertical |
| movie-service | 3011 | /movies |
| games-service | 3012 | /games |
| comedy-service | 3013 | /comedy |
| sports-service | 3014 | /sports |
| reality-service | 3010 | /reality |
| creator-service | 3018 | /creators |

## Documentation

- [API Route Map](docs/API_ROUTE_MAP.md) - Complete API documentation
- [CLAUDE.md](CLAUDE.md) - Build standards and coding conventions
- [Review Checklist](docs/REVIEW_CHECKLIST.md) - PR review guidelines
- [Workflow Commands](docs/WORKFLOW_COMMANDS.md) - Development workflow prompts

## Known Issues

- Do NOT use `prisma db push --accept-data-loss` as a normal workflow
- For migrations, use `pnpm prisma migrate dev` or `prisma migrate deploy`
- Do NOT commit generated artifacts (dist/, node_modules/.prisma/)

## CI/CD

The project uses GitHub Actions for CI/CD. See:
- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/cd.yml` - CD deployment
- `.github/workflows/pr-checks.yml` - PR validation