# Engineering Documentation

> Technical guides, API docs, deployment guides, and engineering standards for Azeebo+.

---

## Structure

```
docs/engineering/
├── README.md              # This file
├── api/                   # API documentation
│   ├── gateway.md         # Gateway routing
│   ├── auth.md            # Auth endpoints
│   ├── wallet.md          # Wallet endpoints
│   └── [service].md       # Per-service API docs
├── deployment/            # Deployment guides
│   ├── local-dev.md       # Local development setup
│   ├── staging.md         # Staging deployment
│   └── production.md      # Production deployment
├── database/              # Database docs
│   ├── schema-overview.md # All 28 databases
│   └── migrations.md      # Migration guidelines
├── security/              # Security docs
│   ├── auth-flow.md       # Authentication flow
│   └── secrets.md         # Secrets management
└── runbooks/              # Operational runbooks
    ├── incident-response.md
    └── service-restart.md
```

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture | `ARCHITECTURE.md` | System design and patterns |
| Services | `SERVICES.md` | Service catalog and contracts |
| Deployment | `DEPLOYMENT.md` | CI/CD and deployment guide |
| Contributing | `CONTRIBUTING.md` | Development standards |

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
| auth-service | 3001 |
| wallet-service | 3003 |
| payment-service | 3004 |
| reality-service | 3010 |
| [Full list](/SERVICES.md) | — |
