# Azeebo+ Platform

A modular digital entertainment platform that functions as a shared operating system for multiple content universes.

## Architecture

```
azeebo-plus/
├── apps/                    # Client applications (5 apps)
│   ├── mobile/              # Mobile app (Expo React Native, port 8081)
│   ├── web/                 # Next.js web app (port 4000)
│   ├── tv/                  # Living room app (Expo React Native, port 8082)
│   ├── admin/              # Standalone admin dashboard (Vite+React + NestJS, port 4016)
│   └── creator/           # Standalone creator dashboard (Vite+React + NestJS, port 4014)
│
├── services/               # Backend microservices (29 services)
│   ├── core/              # Essential platform services (8 services)
│   ├── universes/         # Universe-specific business logic (9 services)
│   ├── engagement/        # User interaction services (6 services)
│   ├── operations/        # Platform operations (3 services)
│   ├── intelligence/      # Data & analytics (2 services)
│   └── gateway/           # API gateway & routing (1 service)
│
├── packages/              # Shared code libraries (26 packages)
├── infra/                 # Infrastructure configurations
├── scripts/               # Development & deployment scripts
└── ci/                    # CI/CD scripts
```

## Service Inventory (29 services + 5 frontends)

### Core Services (ports 3000-3005, 3019, 3020)

| Service           | Port | DB               | Description                                         |
| ----------------- | ---- | ---------------- | --------------------------------------------------- |
| auth-service      | 3000 | azeebo_auth      | Authentication & authorization                      |
| user-service      | 3001 | azeebo_user      | User management                                     |
| wallet-service    | 3002 | azeebo_wallet    | Wallet & balance management                         |
| payment-service   | 3003 | azeebo_payment   | Payment processing                                  |
| content-service   | 3004 | azeebo_content   | Content management                                  |
| search-service    | 3005 | azeebo_search    | Search functionality                                |
| media-service     | 3019 | azeebo_media     | Media upload & processing                           |
| knowledge-service | 3020 | azeebo_knowledge | Knowledge graph, canonical events & spoiler control |

### Universe Services (ports 3010-3012, 3014, 3016-3018, 3021, 3027)

| Service            | Port | DB                | Description                                |
| ------------------ | ---- | ----------------- | ------------------------------------------ |
| reality-service    | 3010 | azeebo_reality    | Reality TV shows & voting                  |
| movie-service      | 3011 | azeebo_movie      | Movie rentals & premieres                  |
| comedy-service     | 3012 | azeebo_comedy     | Comedy content                             |
| games-service      | 3014 | azeebo_games      | Games & tournaments                        |
| lifestyle-service  | 3016 | azeebo_lifestyle  | Lifestyle content & events                 |
| vertical-service   | 3017 | azeebo_vertical   | Vertical video & storyworlds               |
| creator-service    | 3018 | azeebo_creator    | Creator onboarding, verification, earnings |
| sports-service     | 3021 | azeebo_sports     | Sports content & predictions               |
| live-event-service | 3027 | azeebo_live_event | Pay-per-view live events & streaming       |

### Engagement Services (ports 3006, 3007, 3023-3026)

| Service              | Port | DB                  | Description                    |
| -------------------- | ---- | ------------------- | ------------------------------ |
| notification-service | 3006 | azeebo_notification | Push, email, SMS notifications |
| reward-service       | 3007 | azeebo_reward       | Rewards & gamification         |
| referral-service     | 3025 | azeebo_referral     | Referral program               |
| subscription-service | 3026 | azeebo_subscription | Subscription management        |
| engagement-service   | 3023 | azeebo_engagement   | Engagement tracking            |
| messaging-service    | 3024 | azeebo_messaging    | In-app messaging               |

### Intelligence Services (ports 3008, 3009)

| Service                | Port | DB                    | Description                       |
| ---------------------- | ---- | --------------------- | --------------------------------- |
| analytics-service      | 3008 | azeebo_analytics      | Analytics & reporting             |
| recommendation-service | 3009 | azeebo_recommendation | Personalization & recommendations |

### Operations Services (ports 3015, 3022, 3028)

| Service            | Port | DB                | Description                |
| ------------------ | ---- | ----------------- | -------------------------- |
| queue-service      | 3015 | azeebo_queue      | Background job processing  |
| moderation-service | 3022 | azeebo_moderation | Content moderation         |
| support-service    | 3028 | azeebo_support    | Customer support & tickets |

### Gateway (port 3013)

| Service     | Port | Description                                        |
| ----------- | ---- | -------------------------------------------------- |
| api-gateway | 3013 | Central API gateway, authentication, rate limiting |

### Frontend Apps

| App     | Port | Framework           | Description                             |
| ------- | ---- | ------------------- | --------------------------------------- |
| mobile  | 8081 | Expo (React Native) | Mobile app (iOS/Android)                |
| web     | 4000 | Next.js             | Main web application                    |
| tv      | 8082 | Expo (React Native) | Android TV / Fire TV / tvOS application |
| admin   | 4016 | Vite+React + NestJS | Standalone admin dashboard              || creator | 4014 | Vite+React + NestJS | Standalone creator dashboard              |

Each row maps to a workspace under `apps/`: `apps/mobile`, `apps/web`, `apps/tv`,
`apps/admin`, and `apps/creator`.

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
| `start --frontend` | Frontend apps on host (Next dev, Nest backends, vite SPAs) |
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

| Aspect          | local-dev.sh                                     | Docker all-in-one                         |
| --------------- | ------------------------------------------------ | ----------------------------------------- |
| Database        | Per-service PostgreSQL (separate DB per service) | Per-service PostgreSQL (inside container) |
| Process manager | Direct Node.js (nohup)                           | supervisord + PM2                         |
| Networking      | localhost:PORT                                   | Exposed ports + internal routing          |
| Memory limits   | OS default                                       | 12GB container limit                      |
| Hot-reload      | Yes (pnpm dev/start:dev)                         | No (production build)                     |
| Secrets         | .env.local auto-generation                       | Docker secrets / env vars                 |
| Frontend        | Host dev servers (Next + vite)                   | Built into single container               |
| Startup time    | ~30s (quick) / ~3min (all)                       | ~2min                                     |
| Best for        | Development, debugging                           | Staging, production                       |

## Shared Dev & Build Runners

Every service, schema-owning app, and package routes its `start:dev` and/or
`build` script through a single shared runner — no per-workspace copies, no
inline command chains. This replaced 28 drifted copies of the same start-dev
script (each with its own bugs) and 4 textual variants of the same package
build line.

| Workspace class              | Script           | Runner                         | What the runner does                                                                                |
| ---------------------------- | ---------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `services/<group>/<svc>`     | `pnpm start:dev` | `scripts/start-dev-service.sh` | First-run `prisma generate` → mirror client into `dist/prisma/client` → `nest start --watch`        |
| `services/<group>/<svc>`     | `pnpm run build` | `scripts/build-service.sh`     | `prisma generate` (always) → `tsc -p tsconfig.build.json` → mirror client into `dist/prisma/client` |
| `apps/admin`, `apps/creator` | `pnpm start:dev` | `scripts/start-dev-app.sh`     | First-run `prisma generate` (client at `src/generated/prisma`) → `tsx watch src/main.ts`            |
| `packages/<name>`            | `pnpm run build` | `scripts/build-package.sh`     | `tsc -p tsconfig.json` (compile-only)                                                               |

The runners' shared contract:

- **Run from the workspace directory** (`pnpm run` guarantees this); direct
  invocation from elsewhere exits 2 with guidance.
- **Fail loud, fail early.** A failed `prisma generate` or `tsc` aborts before
  anything boots or continues, echoes the full error output with a `|` prefix,
  and prints a fix hint. A build never completes against a stale or missing
  client, and a dev server never starts into a cryptic runtime crash.
- **Arg passthrough** (dev runners): extra CLI args reach the underlying
  process, e.g. `pnpm start:dev --entryFile main2`.
- **Packages are compile-only by design** — they never run `prisma generate`.
  Package clients are generated repo-wide by `scripts/generate-prisma-clients.sh`
  (CI and the Docker build's T-1 step).
- **The app runner is deliberately its own contract** (not a services variant):
  apps/admin and apps/creator generate on first run only, into their own
  `src/generated/prisma` layout, then `exec tsx watch src/main.ts` — no dist
  mirror, because tsx imports the client by relative path and nothing compiles
  before boot. Schema-less apps like `apps/web` keep their own dev model and
  must not wire through it.

This wiring is not convention-on-paper; CI enforces it (full catalog of every
check and its invariants: [CHECKS.md](CHECKS.md)). `check-dev-wiring`
(the `pnpm run check:dev-wiring` step in the Flag & Swagger Conventions job)
fails the PR when any workspace's `start:dev`/`build` script drifts from the
exact runner invocation, when a legacy per-service `start-dev.sh` reappears,
or when a shared runner file itself is missing. Docker's all-in-one build runs
the same runners inside the image, and the Docker build chain's topological
ordering against real package dependencies is separately guarded by
`check:build-chain`.

## Per-Service Database Architecture

Each service gets its own PostgreSQL database, avoiding cross-service coupling:

```
azeebo_auth          azeebo_user          azeebo_wallet        azeebo_payment
azeebo_content       azeebo_search        azeebo_media         azeebo_knowledge
azeebo_reality       azeebo_movie         azeebo_comedy        azeebo_games
azeebo_sports        azeebo_lifestyle     azeebo_vertical      azeebo_creator
azeebo_live_event    azeebo_notification  azeebo_reward        azeebo_engagement
azeebo_messaging     azeebo_referral      azeebo_subscription  azeebo_queue
azeebo_support       azeebo_moderation    azeebo_analytics     azeebo_recommendation
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

## Shared Packages (26 total)

The monorepo contains 26 shared packages (24 compile-only TypeScript workspaces + 2 specialized packages):

| Package              | Workspace Name               | Description                                                         |
| -------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `shared-types`       | `@azeebo/shared-types`       | Canonical TypeScript type definitions, DTOs, and enums              |
| `utils`              | `@azeebo/utils`              | Common utility functions and helpers                                |
| `validation`         | `@azeebo/validation`         | Validation utilities, decorators, and schemas                       |
| `error-handling`     | `@azeebo/error-handling`     | Standardized error handling, exception filters, and problem details |
| `logger`             | `@azeebo/logger`             | Structured JSON logging utilities                                   |
| `api-client`         | `@azeebo/api-client`         | Client SDK for frontend applications                                |
| `http-client`        | `@azeebo/http-client`        | Resilient HTTP client for inter-service communication               |
| `internal-clients`   | `@azeebo/internal-clients`   | Type-safe internal service RPC client wrappers                      |
| `event-bus`          | `@azeebo/event-bus`          | Redis-backed event bus for asynchronous communication               |
| `auth`               | `@azeebo/auth`               | Authentication utilities, Passport strategies, and guards           |
| `security`           | `@azeebo/security`           | Security utilities, rate limiting, and encryption helpers           |
| `feature-flags`      | `@azeebo/feature-flags`      | Redis-backed feature flag evaluation client                         |
| `flag-metrics`       | `@azeebo/flag-metrics`       | Telemetry and metrics for feature flags                             |
| `design-tokens`      | `@azeebo/design-tokens`      | Design tokens (colors, spacing, typography scales)                  |
| `ui`                 | `@azeebo/ui`                 | Cross-platform shared UI components                                 |
| `react-data`         | `@azeebo/react-data`         | React Query hooks and data-fetching helpers                         |
| `analytics-sdk`      | `@azeebo/analytics-sdk`      | Multi-platform analytics tracking SDK                               |
| `observability`      | `@azeebo/observability`      | Metrics collection and Prometheus scrapers                          |
| `opentelemetry`      | `@azeebo/opentelemetry`      | OpenTelemetry tracing and distributed context propagation           |
| `model-cost-tracker` | `@azeebo/model-cost-tracker` | AI/LLM model token and cost tracking utilities                      |
| `queue-policy`       | `@azeebo/queue-policy`       | BullMQ queue policy and backoff retry configurations                |
| `shared-services`    | `@azeebo/shared-services`    | Common NestJS modules (Prisma, Redis, Cache, Health)                |
| `test-utils`         | `@azeebo/test-utils`         | Shared test fixtures, mock factories, and testing utilities         |
| `contract-tests`     | `@azeebo/contract-tests`     | API contract testing suites and utilities                           |
| `eslint-rules`       | `packages/eslint-rules`      | Custom repo-wide ESLint AST rules (hex colors, logger enforcement)  |
| `monitoring`         | `packages/monitoring`        | Performance tracking interceptors and metrics controllers           |

## Running Tests

```bash
# Run all tests
pnpm -r test

# Run specific service tests
cd services/core/wallet-service && pnpm test
```

## Git Hooks

The repo ships a pre-commit hook that blocks commits when a generated
Prisma client is stale relative to its `prisma/schema.prisma` — a failure mode
CI structurally cannot catch, because CI regenerates clients fresh and would
silently trust the stale one sitting in your working tree.

**Installed automatically:** the root `prepare` script runs
`scripts/install-git-hooks.sh` on every `pnpm install`, pointing
`core.hooksPath` at `scripts/hooks`. Verify with:

```bash
# Should print: scripts/hooks
git config --get core.hooksPath
```

The installer is a no-op outside a git checkout (Docker builds, tarballs) and
never touches a `core.hooksPath` you have already set yourself.

To uninstall (opt out):

```bash
git config --unset core.hooksPath
```

What it does:

- Runs `scripts/check-prisma-client-stale.mjs` before every commit (~100ms)
- Blocks the commit when any workspace's generated client is stale
- Fix when blocked: `pnpm run prisma:generate`, then re-stage and commit

Skip once (not recommended): `git commit --no-verify`.

The hook itself is guarded by CI: `scripts/check-git-hooks.mjs` (wired as
`pnpm run check:git-hooks` in the Flag & Swagger Conventions job) fails the PR
when the hook file is missing, not executable, untracked by git or committed
without mode 100755 (so fresh clones would materialize a dead hook), or
rewritten without the stale-client check.

## Engineering Guidelines

- [CLAUDE.md](./CLAUDE.md) - AI-assisted development guidelines and engineering rules
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture, service catalog, and data models
- [docs/SERVICES.md](./docs/SERVICES.md) - Detailed microservices API endpoint catalog
- [docs/DEVELOPER-GUIDE.md](./docs/DEVELOPER-GUIDE.md) - Developer onboarding and environment guide

## Key Principles

- **No Duplication**: Never duplicate core service logic in universe modules
- **Shared First**: Always use shared packages before creating new code
- **TypeScript Only**: No JavaScript files allowed
- **Mobile First**: Design for mobile screens first
- **Analytics Everywhere**: Track all user interactions
- **Security by Default**: Validate all inputs, encrypt sensitive data

## License

Proprietary - VMNL Entertainment
