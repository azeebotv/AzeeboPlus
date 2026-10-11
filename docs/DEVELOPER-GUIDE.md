# Azeebo+ Developer Guide

> Concise reference for onboarding and day-to-day development.

---

## 1. Prerequisites

- **Node.js** 22+
- **pnpm** 10+
- **Docker** and Docker Compose
- **PostgreSQL** and **Redis** (via Docker)

---

## 2. Quick Start

```bash
git clone https://github.com/azeebotv/AzeeboPlus.git
cd AzeeboPlus
pnpm install
./scripts/local-dev.sh setup
./scripts/local-dev.sh db setup
./scripts/local-dev.sh db seed
./scripts/local-dev.sh start --quick
```

Access: Web (4000), API Gateway (3013), Creator Portal (4014), Admin (4016), TV App (8082).

---

## 3. Project Structure

```
azeebo-plus/
├── apps/          # Client apps: mobile, web, tv, admin, creator (5 apps)
├── services/      # 29 microservices organized by category
│   ├── core/      # auth, user, wallet, payment, content, search, media, knowledge
│   ├── universes/ # reality, creator, lifestyle, vertical, movie, games, comedy, sports, live-event
│   ├── engagement/# notification, reward, referral, messaging, engagement, subscription
│   ├── operations/# moderation, queue, support
│   ├── intelligence/# analytics, recommendation
│   └── gateway/   # api-gateway
├── packages/      # Shared libraries (26 packages: ui, tokens, types, utils, etc.)
├── infra/         # Kubernetes configs
└── docs/          # Documentation
```

**Where to put new code:** Shared UI → `/packages/ui`, shared types → `/packages/shared-types`, platform feature → `/services/core/<service>`, universe feature → `/services/universes/<universe>`, client feature → `/apps/<app>`.

---

## 4. Development Workflow

### Branches

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| `main` | Production | Production (Coolify) |
| `develop` | Integration | Staging |
| `feature/*` | New features | — |
| `fix/*` | Bug fixes | — |
| `hotfix/*` | Urgent fixes | Production |

### Commits

Format: `type(scope): description` (types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`)

### Pull Requests

- Under 400 lines, target `develop` (or `main` for hotfixes)
- Pre-check: `pnpm run typecheck`, `pnpm run lint`, `pnpm run test:sweep`, `pnpm run check:route-contracts` must pass
- Squash and merge, 1 approval required

---

## 5. Running Locally

```bash
./scripts/local-dev.sh start --quick               # Quick start core services & apps
./scripts/local-dev.sh start                       # Interactive startup
./scripts/local-dev.sh workspace <service-or-app>  # Single service or app
pnpm --filter @azeebo/reality-service run start:dev # Direct pnpm filter
```

---

## 6. Database

Each service has its own PostgreSQL database with `azeebo_` prefix (e.g., `azeebo_auth`, `azeebo_reality`). No cross-service DB queries.

### Migrations

```bash
cd services/core/wallet-service
pnpm exec prisma migrate dev --name add_wallet_feature  # Create
./scripts/local-dev.sh db migrate                      # Apply all
./scripts/local-dev.sh db reset                        # Reset (dev only)
./scripts/local-dev.sh db seed                         # Seed
```

Rules: reversible migrations, UUIDs for PKs, indexes on frequently queried columns.

---

## 7. Testing

```bash
pnpm run test            # Monorepo test sweep
pnpm run test:sweep      # Fast sweep across workspaces
pnpm --filter @azeebo/reality-service run test  # Per-service
pnpm run check:route-contracts                 # Route contract enforcement
```

**Coverage targets:** Wallet/Payment 90%+, Auth/Security 90%+, Core 80%+, Universe 70%+.

---

## 8. Environment Variables

Copy `.env.example` to `.env`.

**Required:** `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET` (min 64 chars), `JWT_REFRESH_SECRET`, `INTERNAL_API_KEY`, `PORT`, `NODE_ENV`.

**Optional:** Firebase credentials, AWS S3, SMTP config.

---

## 9. Architecture Decisions

- **Monorepo:** pnpm workspaces for atomic commits and shared types
- **Microservices:** 29 services, each with own DB and Prisma schema
- **Per-service databases:** Enforces boundaries, enables independent scaling
- **Communication:** HTTP (sync, circuit breaker) + Redis Streams (async events)
- **Auth:** JWT via gateway, 15min access + 7d refresh tokens

---

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| Port conflict | `lsof -i :PORT` then `kill <PID>`, or change port in `.env` |
| DB connection refused | `docker compose up -d postgres` |
| Migration errors | `pnpm run db:reset && pnpm run db:migrate` |
| Service won't start | `docker compose logs -f <service>` or check app logs |
| Type errors | `pnpm run typecheck` |
| Tests failing after pull | `pnpm install && pnpm run db:migrate && pnpm run test` |

---

## Reference

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Detailed architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution standards
- [SERVICES.md](./SERVICES.md) - Service catalog
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [AGENTS.md](./AGENTS.md) - Agent architecture
