# Local Development Setup

## Prerequisites
- Node.js 18+
- pnpm
- Docker & Docker Compose
- PostgreSQL (via Docker)

## Quick Start

```bash
# Clone and install
git clone https://github.com/azeebotv/azeebo-plus.git
cd azeebo-plus
cp .env.example .env
pnpm install

# Start databases
docker compose up -d postgres redis

# Run migrations
pnpm run db:migrate

# Seed data
pnpm run seed

# Start all services
pnpm run dev
```

## Service Ports
| Service | Port |
|---------|------|
| API Gateway | 3013 |
| Web App | 4000 |
| Creator Portal | 4014 |
| Admin Panel | 4016 |
| auth-service | 3000 |
| user-service | 3001 |
| wallet-service | 3002 |
| payment-service | 3003 |

## Environment Variables
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_ACCESS_SECRET` — JWT signing secret (min 64 chars)
- `JWT_REFRESH_SECRET` — Refresh token secret (min 64 chars)
- `GATEWAY_SECRET` — Inter-service authentication key

## Database Management
```bash
# Create migration
cd services/core/wallet-service
pnpm exec prisma migrate dev --name add_vote_table

# Apply all migrations
pnpm run db:migrate

# Reset (dev only)
pnpm run db:reset
```

## Testing
```bash
pnpm run test              # All tests
pnpm run test:watch        # Watch mode
pnpm run test:cov          # Coverage report
pnpm run typecheck         # Type checking
pnpm run lint              # Linting
```
