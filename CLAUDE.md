# Azeebo+ Engineering Rules

> **Platform:** Azeebo+ by VMNL
> **Stack:** React Native (Expo), Next.js, NestJS, PostgreSQL, Redis, Firebase, Docker/K8s

---

## Architecture

```
azeebo-plus/
├── apps/                  # Standalone full-stack dashboards + mobile/web clients
│   ├── mobile/            # Expo React Native (port 8081)
│   ├── web/               # Next.js frontend (port 3000)
│   ├── admin/             # Standalone admin dashboard — Vite+React frontend + NestJS backend (port 4016)
│   └── creator/           # Standalone creator dashboard — Vite+React frontend + NestJS backend (port 4014)
├── services/              # Microservices (categorized)
│   ├── core/              # auth, user, wallet, payment, content, search, media
│   ├── universes/         # reality, creator, lifestyle, vertical, movie, games, comedy, sports
│   ├── engagement/        # notification, reward, referral, messaging, engagement, subscription
│   ├── operations/        # moderation, queue, support
│   ├── intelligence/      # analytics, recommendation
│   └── gateway/           # api-gateway
├── packages/              # Shared libraries (ui, tokens, types, utils, etc.)
├── infra/                 # Kubernetes, config, scripts
├── prisma/                # Root-level seed data
└── doc/                   # Documentation
```

### Key Principles

- Shared services live in `/services/core` — never duplicate
- Universe logic lives in `/services/universes` — one per universe
- UI primitives live in `/packages/ui` — reuse before creating
- No duplicate payment or wallet logic inside modules
- Each service has its own `prisma/schema.prisma` and database
- All databases use `azeebo_` prefix (e.g., `azeebo_auth`, `azeebo_reality`)

---

## Frontend (Mobile / Web)

- TypeScript only — no `any`
- Reuse shared UI components from `/packages/ui` before creating new ones
- Every screen must include: loading, empty, error, and success states
- Design tokens from `/packages/design-tokens` — no hardcoded colors/spacing
- React Navigation (mobile) with bottom tabs + universe switcher in Watch
- React Query for server state — no manual caching
- Zustand for client state only when needed
- Firebase for auth, analytics, and notifications

---

## Backend (Services)

- NestJS with TypeScript
- Each service owns its own database — no cross-service DB queries
- Use `INTERNAL_API_KEY` for inter-service HTTP calls
- JWT auth from `auth-service` — validate via `AuthGuard`
- Idempotency keys on all payment and wallet endpoints
- Prisma for ORM — migrations per service
- Redis for caching and rate limiting (1000 req/min default)
- Structured JSON logging via shared `logger` package
- Health check endpoint at `GET /health` on every service

---

## Analytics

- Event names use `snake_case` (e.g., `reality_vote_created`)
- Every conversion screen must fire: `view`, `submit`, `success`, `failure`
- Use the shared `@azeebo/analytics-sdk` package
- Events go to Firebase Analytics -> BigQuery -> Looker dashboards

---

## Payments & Wallet

- **NEVER** hardcode prices — all pricing from database/config
- All paid actions must use shared `wallet-service` and `payment-service`
- Idempotency keys required on all financial endpoints
- Wallet operations use atomic transactions with row-level locking
- Two-layer concurrency control: Redis lock (5s TTL) + Prisma `SELECT ... FOR UPDATE`
- Every transaction has an audit trail (ledger)
- Fraud detection on suspicious patterns (rapid votes, high amounts)

---

## Services Catalog

| Category | Service | Port | DB |
|----------|---------|------|-----|
| Core | auth-service | 3000 | azeebo_auth |
| Core | user-service | 3001 | azeebo_user |
| Core | wallet-service | 3002 | azeebo_wallet |
| Core | payment-service | 3003 | azeebo_payment |
| Core | content-service | 3004 | azeebo_content |
| Core | search-service | 3005 | azeebo_search |
| Core | media-service | 3019 | azeebo_media |
| Universe | reality-service | 3010 | azeebo_reality |
| Universe | creator-service | 3018 | azeebo_creator |
| Universe | lifestyle-service | 3016 | azeebo_lifestyle |
| Universe | vertical-service | 3017 | azeebo_vertical |
| Universe | movie-service | 3011 | azeebo_movie |
| Universe | games-service | 3014 | azeebo_games |
| Universe | comedy-service | 3012 | azeebo_comedy |
| Universe | sports-service | 3021 | azeebo_sports |
| Engagement | notification-service | 3006 | azeebo_notification |
| Engagement | reward-service | 3007 | azeebo_reward |
| Engagement | referral-service | 3025 | azeebo_referral |
| Engagement | messaging-service | 3024 | azeebo_messaging |
| Engagement | engagement-service | 3023 | azeebo_engagement |
| Engagement | subscription-service | 3026 | azeebo_subscription |
| Operations | moderation-service | 3022 | azeebo_moderation |
| Operations | queue-service | 3015 | azeebo_queue |
| Operations | support-service | 3020 | azeebo_support |
| Intelligence | analytics-service | 3008 | azeebo_analytics |
| Intelligence | recommendation-service | 3009 | azeebo_recommendation |
| Gateway | api-gateway | 3013 | — |

---

## Reviews

Before merging any PR, check:

- [ ] TypeScript strict mode — no `any`
- [ ] Loading / empty / error / success states present
- [ ] Analytics events added (`view`, `action`, `success`, `failure`)
- [ ] Shared components reused — no duplication
- [ ] No hardcoded prices or secrets
- [ ] Wallet/payment flows use shared services
- [ ] Unit tests included
- [ ] Mobile responsive (if UI change)
- [ ] Error handling with proper HTTP status codes
- [ ] PR size < 400 lines (split if larger)

---

## Never Do

- Do NOT use `any` type
- Do NOT duplicate wallet or payment logic
- Do NOT hardcode prices or secrets
- Do NOT skip loading/error states
- Do NOT use `console.log` — use the `logger` package
- Do NOT skip tests for payment/wallet features
- Do NOT build entire universes in one prompt — break into bounded tasks
- Do NOT use different patterns across universes
- Do NOT skip analytics events on conversion screens
