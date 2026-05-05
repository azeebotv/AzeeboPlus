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
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# (Optional) Seed the database with initial data
pnpm prisma db seed
```

## Build

Build all packages in the workspace:

```bash
pnpm build
```

## Development

Start all services in development mode:

```bash
# Start all services
pnpm dev

# Start a specific app
pnpm --filter @azeebo/web dev
pnpm --filter @azeebo/admin dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @azeebo/auth-service test

# Run linting
pnpm lint

# Run format checking
pnpm format
```

## Services

### Deployable Services (`services/`)

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 3013 | Main API gateway/proxy |
| auth-service | 3000 | Authentication & authorization |
| user-service | 3001 | User management |
| wallet-service | 3002 | Wallet & payments |
| payment-service | 3003 | Payment processing |
| content-service | 3004 | Content management |
| notification-service | 3005 | Notifications |
| reward-service | 3006 | Rewards & loyalty |
| search-service | 3007 | Search functionality |
| analytics-service | 3008 | Analytics |
| moderation-service | 3009 | Content moderation |
| recommendation-service | 3010 | Recommendations |
| lifestyle-service | 3016 | Lifestyle content |
| vertical-service | 3017 | Universe & characters |
| media-service | 3019 | Media upload & processing |
| queue-service | 3015 | Background job processing |

### Applications (`apps/`)

| App | Description |
|-----|-------------|
| web | Main web application (Next.js) |
| admin | Admin dashboard (NestJS) |
| mobile | Mobile application (Expo/React Native) |
| creator-portal | Creator dashboard (NestJS) |

### Shared Packages (`packages/`)

- `analytics-sdk` - Analytics tracking SDK
- `api-client` - Shared API client
- `design-tokens` - Design tokens
- `error-handling` - Error handling utilities
- `logger` - Structured logging
- `security` - Security utilities

## API Documentation

### Gateway Routes

All API requests should be routed through the gateway at `/api/v1/:service/:resource`.

Examples:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/content/items`

### Base URL

- **Local Development**: `http://localhost:3013`
- **Production**: Configure via `API_GATEWAY_URL` environment variable

## Docker

### Start All Services

```bash
docker-compose up -d
```

### View Service Status

```bash
docker-compose ps
```

### View Logs

```bash
docker-compose logs -f [service-name]
```

## Project Structure

```
azeebo+/
├── apps/                 # Frontend applications
│   ├── admin/            # Admin dashboard
│   ├── creator-portal/   # Creator portal
│   ├── mobile/           # Mobile app
│   └── web/              # Main web app
├── packages/             # Shared packages
│   ├── analytics-sdk/
│   ├── api-client/
│   ├── design-tokens/
│   ├── error-handling/
│   ├── logger/
│   └── security/
├── services/             # Backend microservices
│   ├── analytics-service/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── content-service/
│   ├── lifestyle-service/
│   ├── media-service/
│   ├── moderation-service/
│   ├── notification-service/
│   ├── payment-service/
│   ├── queue-service/
│   ├── recommendation-service/
│   ├── reward-service/
│   ├── search-service/
│   ├── user-service/
│   ├── vertical-service/
│   └── wallet-service/
├── modules/              # Content modules (verticals)
│   ├── comedy-service/
│   ├── creator-service/
│   ├── games-service/
│   ├── lifestyle-service/
│   ├── movie-service/
│   ├── reality-service/
│   ├── sports-service/
│   └── vertical-service/
├── infra/                # Infrastructure
│   ├── docker/
│   ├── k8s/
│   └── load-testing/
└── prisma/               # Database schema
```

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running and `DATABASE_URL` is correctly set in `.env`.

### Build Failures

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Port Conflicts

If a port is already in use, check `docker-compose.yml` for service port mappings.
