# Azeebo+ Monorepo

A comprehensive streaming and content platform built with a microservices architecture.

## 📦 Packages Overview

| Type | Package | Description |
|------|---------|-------------|
| Shared | `@azeebo/shared-types` | TypeScript types shared across services |
| Service | auth-service | Authentication & authorization |
| Service | user-service | User profile management |
| Service | wallet-service | Wallet transactions & balances |
| Service | payment-service | Payment processing |
| Service | content-service | Video content management |
| Service | media-service | Media upload & CDN |
| Service | search-service | Content search |
| Service | notification-service | Email/SMS notifications |
| Service | reward-service | Loyalty rewards |
| Service | analytics-service | Analytics & reporting |
| Service | recommendation-service | Personalized recommendations |
| Service | support-service | Support tickets & workflows |
| Universe | reality-service | Reality TV content |
| Universe | creator-service | Creator platform |
| Universe | lifestyle-service | Culture & events |
| Universe | games-service | Interactive games |
| Universe | comedy-service | Comedy content |
| Universe | sports-service | Sports content |
| Universe | vertical-service | Universe management |
| Universe | movie-service | Movie content |

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **Docker**: Latest stable version

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
cp .env.example .env
```

### Database Setup

```bash
pnpm -r prisma generate
pnpm -r exec prisma migrate deploy
```

### Build & Run

```bash
pnpm build
pnpm dev
```

## 🔧 Development Commands

```bash
pnpm test                 # Run all tests
pnpm run test:unit        # Unit tests only
pnpm run test:integration # Integration tests with DB
pnpm lint                 # Linting
pnpm typecheck            # Type checking
pnpm build                # Build all packages
```

## 🌐 Service Ports & API Gateway

**Gateway Base URL**: `http://localhost:3000`

| Service | Port | Route Prefix |
|---------|------|--------------|
| auth-service | 3000 | /auth |
| user-service | 3001 | /users |
| wallet-service | 3002 | /wallet |
| payment-service | 3003 | /payment |
| content-service | 3004 | /content |
| media-service | 3019 | /media |
| search-service | 3005 | /search |
| notification-service | 3006 | /notifications |
| reward-service | 3007 | /rewards |
| analytics-service | 3008 | /analytics |
| recommendation-service | 3009 | /recommendation |
| reality-service | 3010 | /reality |
| movie-service | 3011 | /movies |
| games-service | 3012 | /games |
| comedy-service | 3013 | /comedy |
| sports-service | 3014 | /sports |
| lifestyle-service | 3016 | /lifestyle |
| vertical-service | 3017 | /vertical |
| creator-service | 3018 | /creators |
| support-service | 3020 | /support |

## 📱 Mobile Setup

```bash
cd apps/mobile
pnpm install
pnpm start
```

## 📚 Documentation

- **[Active Backlog](todo.md)** - Current tasks and priorities
- [API Route Map](docs/API_ROUTE_MAP.md) - Complete API documentation
- [Payment Webhooks](docs/PAYMENT_WEBHOOKS.md) - Payment provider webhook integration
- [CLAUDE.md](CLAUDE.md) - Build standards and coding conventions
- [Review Checklist](docs/REVIEW_CHECKLIST.md) - PR review guidelines
- [Workflow Commands](docs/WORKFLOW_COMMANDS.md) - Development workflow prompts
- [Support Workflows](docs/SUPPORT_WORKFLOWS.md) - Support ticket workflows
- [Analytics Governance](docs/ANALYTICS_GOVERNANCE.md) - Analytics tracking standards

## 🔄 Rollout Order & MVP Scope

**Phase 1 - Foundation**: auth, user, wallet, payment, content, media  
**Phase 2 - Universe 1**: Reality, Creator  
**Phase 3 - Universe 2**: Lifestyle, Games  
**Phase 4 - Universe 3**: Comedy, Sports  
**Phase 5 - Universe 4**: Vertical, Movie  

## ⚠️ Known Blockers

- Support service integration tests pending
- Typed API client package needs to be created
- Backup/restore verification in CI is new (monitor for failures)

## 🏗️ CI/CD Status

| Gate | Status | Notes |
|------|--------|-------|
| Install | ✅ Passing | |
| Prisma Generate | ✅ Passing | |
| Build | ⚠️ Partial | All services pass; mobile app has config issue |
| Lint | ⚠️ Partial | Services pass; web app has prettier formatting issues |
| Typecheck | ✅ Passing | |
| Unit Tests | ⚠️ Partial | analytics-service fails due to test DB connection |
| Integration Tests | ⚠️ Partial | Dependent on test database availability |
| Docker Smoke | ⏳ Pending | |
| Backup/Restore | ⏳ Pending | |

## 📁 Generated Artifact Policy

- **Never commit**: `dist/`, `node_modules/.prisma/`, `.next/`, `.expo/`
- **Commit**: Prisma schema files (`prisma/schema.prisma`)
- **Generated on CI**: All build artifacts are generated during CI pipeline

## CI/CD

The project uses GitHub Actions for CI/CD. See:
- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/cd.yml` - CD deployment
- `.github/workflows/pr-checks.yml` - PR validation
