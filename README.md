# Azeebo+ Platform

A modular digital entertainment platform that functions as a shared operating system for multiple content universes.

## Architecture

```
azeebo-plus/
├── apps/                    # Client applications
│   ├── web/                # Next.js web app (port 4000)
│   ├── admin/              # NestJS admin panel (port 4016)
│   └── creator/          # Standalone creator dashboard (port 4014)
│
├── services/               # Backend microservices
│   ├── core/              # Essential platform services
│   ├── universes/         # Universe-specific business logic
│   ├── engagement/        # User interaction services
│   ├── operations/        # Platform operations
│   ├── intelligence/      # Data & analytics
│   └── gateway/           # API gateway & routing
│
├── packages/              # Shared code libraries
├── infra/                 # Infrastructure configurations
├── scripts/               # Development & deployment scripts
└── ci/                    # CI/CD scripts
```

## Service Inventory (27 services + 3 frontends)

### Core Services (ports 3000-3005, 3019)
| Service | Port | DB | Description |
|---------|------|----|-------------|
| auth-service | 3000 | azeebo_auth | Authentication & authorization |
| user-service | 3001 | azeebo_user | User management |
| wallet-service | 3002 | azeebo_wallet | Wallet & balance management |
| payment-service | 3003 | azeebo_payment | Payment processing |
| content-service | 3004 | azeebo_content | Content management |
| search-service | 3005 | azeebo_search | Search functionality |
| media-service | 3019 | azeebo_media | Media upload & processing |

### Universe Services (ports 3010-3012, 3014, 3016-3018, 3021)
| Service | Port | DB | Description |
|---------|------|----|-------------|
| reality-service | 3010 | azeebo_reality | Reality TV shows & voting |
| movie-service | 3011 | azeebo_movie | Movie rentals & premieres |
| comedy-service | 3012 | azeebo_comedy | Comedy content |
| games-service | 3014 | azeebo_games | Games & tournaments |
| lifestyle-service | 3016 | azeebo_lifestyle | Lifestyle content & events |
| vertical-service | 3017 | azeebo_vertical | Vertical video & storyworlds |
| creator-service | 3018 | azeebo_creator | Creator onboarding, verification, earnings |
| sports-service | 3021 | azeebo_sports | Sports content & predictions |

### Engagement Services (ports 3006, 3007, 3023-3026)
| Service | Port | DB | Description |
|---------|------|----|-------------|
| notification-service | 3006 | azeebo_notification | Push, email, SMS notifications |
| reward-service | 3007 | azeebo_reward | Rewards & gamification |
| engagement-service | 3023 | azeebo_engagement | Engagement tracking |
| messaging-service | 3024 | azeebo_messaging | In-app messaging |
| referral-service | 3025 | azeebo_referral | Referral program |
| subscription-service | 3026 | azeebo_subscription | Subscription management |

### Intelligence Services (ports 3008, 3009)
| Service | Port | DB | Description |
|---------|------|----|-------------|
| analytics-service | 3008 | azeebo_analytics | Analytics & reporting |
| recommendation-service | 3009 | azeebo_recommendation | Personalization & recommendations |

### Operations Services (ports 3015, 3020, 3022)
| Service | Port | DB | Description |
|---------|------|----|-------------|
| queue-service | 3015 | azeebo_queue | Background job processing |
| support-service | 3020 | azeebo_support | Customer support & tickets |
| moderation-service | 3022 | azeebo_moderation | Content moderation |

### Gateway (port 3013)
| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 3013 | Central API gateway, authentication, rate limiting |

### Frontend Apps
| App | Port | Framework | Description |
|-----|------|-----------|-------------|
| web | 4000 | Next.js | Main web application |
| admin | 4016 | NestJS + SSR | Admin dashboard |
| creator | 4014 | Vite+React + NestJS | Standalone creator dashboard |

## Running Locally

Two modes available:

### Mode 1: local-dev.sh (Recommended for development)

Uses direct Node.js processes on your host machine with per-service databases.
Best for hot-reload, debugging, and fast iteration.

Prerequisites:
- Node.js 22+
- pnpm 10.33+
- PostgreSQL 15+
- Redis 7+

Quick start:
```bash
# Setup (one-time): create databases, install deps, run migrations
./scripts/local-dev.sh setup

# Seed demo data
./scripts/local-dev.sh db seed

# Start core + gateway + web
./scripts/local-dev.sh start --quick
```

local-dev.sh commands:
| Command | Description |
|---------|-------------|
| `setup` | Create per-service databases, install deps, run migrations |
| `start --quick` | Core + gateway + web (recommended) |
| `start --all` | Start everything (~6GB+ RAM) |
| `start --frontend` | Frontend apps in Docker (uses `docker compose`) |
| `start --frontend --local-frontend` | Frontend on host (pnpm dev) |
| `start --core` | Core services only |
| `start --no-build` | Skip prisma generate (fast start) |
| `start --skip-migrate` | Skip migration checks |
| `stop` | Stop all services |
| `status` | Show running services |
| `logs [pattern]` | Tail service logs |
| `db migrate` | Run migrations |
| `db seed` | Seed demo data |
| `db reset` | Drop, recreate, migrate, seed (DESTRUCTIVE) |
| `db studio [service]` | Open Prisma Studio |

### Mode 2: Docker all-in-one (For production/staging)

Single container running everything via supervisord + PM2.
Uses Coolify/Docker Compose deployment.

```bash
docker compose -f docker-compose.all-in-one.yml up -d
```

### Mode Comparison

| Aspect | local-dev.sh | Docker all-in-one |
|--------|-------------|-------------------|
| Database | Per-service PostgreSQL (separate DB per service) | Per-service PostgreSQL (inside container) |
| Process manager | Direct Node.js (nohup) | supervisord + PM2 |
| Networking | localhost:PORT | Exposed ports + internal routing |
| Memory limits | OS default | 12GB container limit |
| Hot-reload | Yes (pnpm dev/start:dev) | No (production build) |
| Secrets | .env.local auto-generation | Docker secrets / env vars |
| Frontend | Docker compose dev mode | Built into single container |
| Startup time | ~30s (quick) / ~3min (all) | ~2min |
| Best for | Development, debugging | Staging, production |

## Per-Service Database Architecture

Each service gets its own PostgreSQL database, avoiding cross-service coupling:

```
azeebo_auth     azeebo_user     azeebo_wallet    azeebo_payment
azeebo_content  azeebo_search   azeebo_media
azeebo_reality  azeebo_movie    azeebo_comedy     azeebo_games
azeebo_sports   azeebo_lifestyle azeebo_vertical  azeebo_creator
azeebo_notification  azeebo_reward  azeebo_engagement
azeebo_messaging     azeebo_referral azeebo_subscription
azeebo_analytics     azeebo_recommendation
azeebo_queue    azeebo_support  azeebo_moderation
azeebo_admin    azeebo_creator
```

Each service's `.env` contains its own `DATABASE_URL` pointing to its database.
`local-dev.sh` sources the per-service `.env` automatically during startup.

## Secret Management

`./scripts/local-dev.sh setup` auto-generates local secrets:

```bash
# Generated in .env.local (never committed):
JWT_ACCESS_SECRET=<random-64-char-hex>
JWT_REFRESH_SECRET=<random-64-char-hex>
```

These override the placeholder values in service `.env` files at runtime.
For production, set secrets via Coolify UI or Docker environment variables.

## Shared Packages

| Package | Description |
|---------|-------------|
| `shared-types` | TypeScript type definitions |
| `utils` | Utility functions |
| `api-client` | API client libraries |
| `analytics-sdk` | Analytics tracking SDK |
| `auth` | Authentication utilities |
| `security` | Security utilities |
| `validation` | Validation utilities |
| `error-handling` | Error handling utilities |
| `logger` | Logging utilities |
| `observability` | Observability utilities |
| `feature-flags` | Feature flag utilities |
| `test-utils` | Testing utilities |
| `internal-clients` | Internal service clients |
| `shared-services` | Shared NestJS modules (prisma, redis, cache, rate-limit, queue, audit, analytics, validation, pagination, api-versioning, sanitize, middleware) |

## Running Tests

```bash
# Run all tests
pnpm -r test

# Run specific service tests
cd services/core/wallet-service && pnpm test
```

## Engineering Guidelines

- [CLAUDE.md](./CLAUDE.md) - AI-assisted development guidelines and engineering rules

## Key Principles

- **No Duplication**: Never duplicate core service logic in universe modules
- **Shared First**: Always use shared packages before creating new code
- **TypeScript Only**: No JavaScript files allowed
- **Mobile First**: Design for mobile screens first
- **Analytics Everywhere**: Track all user interactions
- **Security by Default**: Validate all inputs, encrypt sensitive data

## License

Proprietary - VMNL Entertainment
