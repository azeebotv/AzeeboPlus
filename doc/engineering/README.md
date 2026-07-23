# Engineering Documentation

> Technical guides, API docs, deployment guides, and engineering standards for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture | `doc/ARCHITECTURE.md` | System design and patterns |
| Services | `doc/SERVICES.md` | Service catalog and contracts |
| Deployment | `doc/DEPLOYMENT.md` | CI/CD and deployment guide |
| Deployment Checklist | `doc/DEPLOYMENT-CHECKLIST.md` | Pre-deployment steps |
| Contributing | `doc/CONTRIBUTING.md` | Development standards |
| Secret Rotation | `doc/secret-rotation.md` | Secret rotation procedures |
| Security Audit | `doc/AUDITNOTES.md` | Security findings and fixes |

## Quick Reference

### Running Locally

```bash
pnpm install
docker compose up -d postgres redis
pnpm run db:migrate
pnpm run seed
pnpm run dev
```

### Running Tests

```bash
pnpm run test              # All tests
pnpm run test:watch        # Watch mode
pnpm run test:cov          # Coverage report
```

### Type Checking

```bash
pnpm run typecheck         # All packages
```

### Linting

```bash
pnpm run lint              # All packages
pnpm run lint:fix          # Auto-fix
```

## Service Ports

| Service | Port |
|---------|------|
| API Gateway | 3013 |
| Web | 4000 |
| Creator Portal | 4014 |
| Admin | 4016 |
| auth-service | 3000 |
| user-service | 3001 |
| wallet-service | 3002 |
| payment-service | 3003 |
| content-service | 3004 |
| search-service | 3005 |
| media-service | 3019 |
| reality-service | 3010 |
| movie-service | 3011 |
| comedy-service | 3012 |
| games-service | 3014 |
| queue-service | 3015 |
| lifestyle-service | 3016 |
| vertical-service | 3017 |
| creator-service | 3018 |
| support-service | 3020 |
| sports-service | 3021 |
| moderation-service | 3022 |
| engagement-service | 3023 |
| messaging-service | 3024 |
| referral-service | 3025 |
| subscription-service | 3026 |
| notification-service | 3006 |
| reward-service | 3007 |
| analytics-service | 3008 |
| recommendation-service | 3009 |
| [Full details](SERVICES.md) | — |
