# Azeebo+ Architecture

> Living document — update as architecture evolves.

---

## Overview

Azeebo+ is a **modular entertainment platform** built as a monorepo with:
- 4 client apps (mobile, web, admin, creator)
- 27 backend microservices (categorized into 6 groups)
- 21 shared packages
- PostgreSQL databases per service (26 total, `azeebo_` prefix)
- Redis for caching and queues
- Docker all-in-one container for deployment
- Coolify for production deployment

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   Clients                        │
│  ┌─────────┐ ┌─────┐ ┌───────┐ ┌────────────┐  │
│  │ Mobile  │ │ Web │ │ Admin │ │  Creator    │  │
│  │ (Expo)  │ │(Nxt)│ │(Next) │ │(Next) │  │
│  └────┬────┘ └──┬──┘ └───┬───┘ └─────┬──────┘  │
│       └─────────┴────────┴───────────┘          │
│                     │                            │
└─────────────────────┼────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼────────────────────────────┐
│              API Gateway (:3013)                  │
│    Rate limiting · JWT validation · Routing       │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│              Microservices Layer                   │
│                                                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │   Core   │  │Universes  │  │  Engagement  │   │
│  │  7 svcs  │  │  8 svcs   │  │    6 svcs    │   │
│  └──────────┘  └───────────┘  └──────────────┘   │
│                                                    │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │  Intel   │  │Operations │  │   Gateway    │   │
│  │  2 svcs  │  │  3 svcs   │  │    1 svc     │   │
│  └──────────┘  └───────────┘  └──────────────┘   │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│                Data Layer                         │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  PostgreSQL   │  │    Redis     │              │
│  │  (26 DBs)    │  │  Cache/Queue │              │
│  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────┘
```

---

## Service Categories

### Core Services
Essential platform services shared by all universes.

| Service | Responsibility | Database |
|---------|---------------|----------|
| auth-service | Authentication, JWT, OAuth, email verification | azeebo_auth |
| user-service | Profiles, preferences, account management | azeebo_user |
| wallet-service | Virtual wallet, balances, ledger, atomic transactions | azeebo_wallet |
| payment-service | Payment processing, deposits, KYC, fraud detection | azeebo_payment |
| content-service | Content CRUD, media metadata, moderation | azeebo_content |
| search-service | Full-text search, indexing, suggestions | azeebo_search |
| media-service | Upload, transcoding, CDN, thumbnails | azeebo_media |

### Universe Services
Business logic for each entertainment universe.

| Service | Responsibility | Database |
|---------|---------------|----------|
| reality-service | Shows, episodes, contestants, voting, predictions | azeebo_reality |
| creator-service | Creator profiles, uploads, analytics, monetization | azeebo_creator |
| lifestyle-service | Events, venues, nightlife, influencer content | azeebo_lifestyle |
| vertical-service | Storyworlds, episodes, characters, crossovers | azeebo_vertical |
| movie-service | Films, screenings, premieres, watchlist, passes | azeebo_movie |
| games-service | Games, challenges, trivia, tournaments | azeebo_games |
| comedy-service | Skits, comedians, specials, comedy challenges | azeebo_comedy |
| sports-service | Sports, predictions, fan boards, contests | azeebo_sports |

### Engagement Services
User interaction and retention.

| Service | Responsibility | Database |
|---------|---------------|----------|
| notification-service | Push, in-app, email, SMS | azeebo_notification |
| reward-service | Points, badges, missions, streaks | azeebo_reward |
| referral-service | Referral codes, tracking, rewards | azeebo_referral |
| messaging-service | Direct messaging, comments | azeebo_messaging |
| engagement-service | Engagement events, tracking | azeebo_engagement |
| subscription-service | Subscriptions, plan management | azeebo_subscription |

### Operations Services

| Service | Responsibility | Database |
|---------|---------------|----------|
| moderation-service | Content moderation, reports, flags | azeebo_moderation |
| queue-service | Job queues, async processing | azeebo_queue |
| support-service | Tickets, FAQ, help center | azeebo_support |

### Intelligence Services

| Service | Responsibility | Database |
|---------|---------------|----------|
| analytics-service | Events, metrics, dashboards | azeebo_analytics |
| recommendation-service | Content recommendations, personalization | azeebo_recommendation |

---

## Data Layer

### PostgreSQL
- 26 databases, each prefixed with `azeebo_`
- Each service owns its database — no cross-service DB queries
- Use Prisma ORM with per-service schema and migrations
- PgBouncer for connection pooling

### Redis
- Cache layer (TTL-based)
- Rate limiting (1000 req/min default)
- Distributed locks (5s TTL for wallet operations)
- Job queue backend for BullMQ

---

## Inter-Service Communication

### Synchronous (HTTP)
- All internal calls use `INTERNAL_API_KEY` header
- Use the `http-client` package for service-to-service calls
- Circuit breaker pattern with 5s timeout

### Asynchronous (Events)
- Redis Streams for event bus
- Services publish domain events
- Consumers process events independently

### Event Catalog

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `user.registered` | auth-service | user-service, reward-service, notification-service |
| `user.profile.updated` | user-service | search-service, recommendation-service |
| `content.created` | content-service | search-service, notification-service |
| `content.moderation.approved` | moderation-service | content-service, notification-service |
| `wallet.deposit.completed` | wallet-service | payment-service, notification-service, analytics-service |
| `wallet.payment.processed` | wallet-service | notification-service, analytics-service |
| `vote.created` | reality-service | wallet-service, reward-service, analytics-service |
| `creator.content.uploaded` | creator-service | content-service, moderation-service, notification-service |
| `prediction.submitted` | reality-service, sports-service | wallet-service, reward-service |
| `game.challenge.completed` | games-service | reward-service, analytics-service |

---

## Authentication & Authorization

### Auth Flow
1. User registers/logs in via `auth-service`
2. `auth-service` issues JWT access token (15min) + refresh token (7d)
3. API Gateway validates JWT on every request
4. Services receive decoded user context from gateway
5. Refresh token rotation on each use

### Roles
| Role | Permissions |
|------|------------|
| `user` | Standard platform access |
| `creator` | + Content upload, creator dashboard |
| `admin` | + Admin panel access |
| `moderator` | + Moderation tools |
| `super_admin` | Full system access |

---

## Payment Architecture

### Wallet System
- Virtual wallet per user with `NGN` balance
- Atomic transactions with row-level locking
- Redis distributed lock (5s TTL) + Prisma `SELECT ... FOR UPDATE`
- Immutable ledger with `pending` → `completed`/`failed` state machine
- All operations idempotent via `idempotencyKey`

### Payment Flow
1. User initiates action (vote, purchase, etc.)
2. Frontend calls API Gateway with idempotency key
3. API Gateway routes to relevant universe service
4. Universe service calls `wallet-service` for balance check
5. `wallet-service` calls `payment-service` for processing
6. Atomic debit + ledger entry + event emission
7. Success/failure response propagated back

---

## Deployment

### Docker (Dev/Staging)
- All-in-one container: `ghcr.io/azeebotv/azeebo-all-in-one:dev`
- Ports: 3013 (API), 4000 (Web), 4014 (Creator Portal), 4016 (Admin)
- PostgreSQL, Redis, PgBouncer, nginx, supervisor inside container

### Kubernetes (Production)
- Namespace: `azeebo`
- `Deployment` + `ClusterIP` + `Service` per service
- HorizontalPodAutoscaler (2-10 replicas, 70% CPU target)
- Resource limits: 128Mi-512Mi memory, 100m-500m CPU

### CI/CD
- `ci.yml`: Lint → Type Check → Test (on push to main/develop)
- `cd.yml`: Build → Push → Deploy (on push to main or manual)
- GitHub Container Registry for image storage

---

## Monitoring & Observability

### Health Checks
- `GET /health` on every service
- API Gateway aggregates health from all services
- Kubernetes liveness/readiness probes

### Logging
- Structured JSON via shared `logger` package
- Levels: error, warn, info, debug
- Correlation IDs for request tracing

### Metrics
- Request count, response time, error rate
- Database connection pool usage
- Redis memory and hit rate
- Custom business metrics (votes/min, revenue/hour)

---

## Security

### Secrets Management
- Environment variables via `.env` (local) / Coolify secrets (production)
- `INTERNAL_API_KEY` for all inter-service calls
- JWT secret for token signing (minimum 64 characters enforced)
- Rate limiting at gateway level

### Rate Limiting
| Scope | Limit | Window |
|-------|-------|--------|
| General API | 1000 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute |
| Payment endpoints | 20 requests | 1 minute |
| Search API | 100 requests | 1 minute |
| File upload | 10 requests | 1 minute |

### CORS
- Production: `azeeboplus.com`, `www.azeeboplus.com`, `admin.azeeboplus.com`, `creator.azeeboplus.com`
- Staging: `app.azeeboplus.com`
- Localhost for development

---

## Feature Management

### Feature Flags
- **Package:** `packages/feature-flags/` — Redis-backed FeatureFlagService
- **Capabilities:** Enable/disable features, percentage rollouts, user targeting
- **Admin UI:** `apps/admin/client/src/routes/feature-flags.tsx`
- **API:** `GET/POST/PUT/DELETE /admin/feature-flags` (content-service admin controller)
- **Guard:** `FeatureFlagGuard` — NestJS route-level flag checks via `x-feature-flag` header
- **Usage:** Services import `FeatureFlagModule` and call `featureFlagService.isEnabled(key, userId)`

### Content Geo Restriction
- **Schema:** `ContentItem` has `allowedCountries`, `blockedCountries`, `contentRating`, `minAge` fields
- **Table:** `GeoRestriction` for country-level content blocking
- **Enforcement:** Service-level in `AccessControlService.checkGeoAccess()` — gateway passes `X-User-Country` header
- **Admin:** CRUD endpoints for geo restrictions and per-content geo settings
- **Detection:** `CF-IPCountry` header (Cloudflare), `X-Forwarded-For` + GeoLite2 fallback

### Device Limits (Subscription-Based)
- **Schema:** `SubscriptionPlan` has `maxDevices` and `maxStreams` fields
- **Table:** `RegisteredDevice` in auth-service tracks active devices per user
- **Service:** `DeviceLimitService` checks active devices against subscription tier
- **Behavior:** Login always allowed; streaming blocked when limit reached
- **Limits by tier:** Free=1, Basic=2, Premium=5, Enterprise=10
- **Endpoints:** `GET /auth/devices`, `POST /auth/devices/register`, `DELETE /auth/devices/:id`

### User Feature Preferences
- **Schema:** `UserPreferences.featurePreferences` JSON field
- **Structure:** `{ enabledUniverses: string[], disabledFeatures: string[], lowDataMode: boolean }`
- **API:** `PUT /users/me/preferences` with `featurePreferences` in body

### Content Rating System
- **Fields:** `contentRating` (G/PG/PG-13/R/NC-17/18+) and `minAge` on ContentItem
- **Enforcement:** `AccessControlService.checkContentAccess()` rejects if user age < minAge
- **Admin:** `PUT /admin/content/:contentId/geo` to set ratings

### Low-Data Mode
- **Utility:** `apps/web/src/lib/low-data.ts`
- **Detection:** `navigator.connection.saveData` + localStorage preference
- **Effects:** Reduced image quality (40%), disabled auto-play, halved image dimensions
