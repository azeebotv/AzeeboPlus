# Local Development Setup

## Prerequisites
- Node.js >= 22.0.0
- pnpm >= 10.33.2
- Docker & Docker Compose
- PostgreSQL 15+ & Redis 7+ (via Docker or local services)

## Quick Start

```bash
# Clone and install
git clone https://github.com/azeebotv/AzeeboPlus.git
cd AzeeboPlus
pnpm install

# Set up environment and local databases
./scripts/local-dev.sh setup
./scripts/local-dev.sh db setup
./scripts/local-dev.sh db seed

# Start services
./scripts/local-dev.sh start --quick
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
| analytics-service | 3008 |

## Environment Variables
The canonical environment bootstrap is handled by `./scripts/local-dev.sh setup`, creating root and workspace `.env` files from templates:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_ACCESS_SECRET` — JWT signing secret (min 64 chars)
- `JWT_REFRESH_SECRET` — Refresh token secret (min 64 chars)
- `GATEWAY_SECRET` — Inter-service authentication key

## Database Management
```bash
# Create migration for a specific service
cd services/core/wallet-service
pnpm exec prisma migrate dev --name add_wallet_feature

# Apply all migrations across active services
./scripts/local-dev.sh db migrate

# Reset database (dev only)
./scripts/local-dev.sh db reset

# Seed all services
./scripts/local-dev.sh db seed
```

## Verification & Testing
```bash
pnpm run typecheck         # Type checking
pnpm run lint              # Linting
pnpm run check:route-contracts # Verify client-gateway API contracts
pnpm run test:sweep        # Controlled test sweep across workspaces
```
