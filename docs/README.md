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
| Service | engagement-service | User engagement & leaderboards |
| Service | messaging-service | Direct messaging & chat |
| Service | referral-service | Referral codes & rewards |
| Service | subscription-service | Subscription plans & billing |

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
| engagement-service | 3023 | /engagement |
| messaging-service | 3024 | /messaging |
| referral-service | 3025 | /referrals |
| subscription-service | 3026 | /subscription |

## 📱 Mobile Setup

```bash
cd apps/mobile
pnpm install
pnpm start
```

## 📚 Documentation

All documentation lives under `docs/`. Use the table of contents below to find what you need.

### Core

- [CLAUDE.md](CLAUDE.md) — Build standards, coding conventions, and review checklist

### Product

- [Pages.md](product/Pages.md) — Full product page specifications (80 pages)
- [miss-pages.md](product/miss-pages.md) — Pages still missing in mobile/web vs. spec

### Architecture

- [Architectural Improvements](architecture/ARCHITECTURAL_IMPROVEMENTS.md) — System architecture decisions and refactors
- [Frontend Hook Integration](architecture/FRONTEND_HOOK_INTEGRATION.md) — Shared React hooks for web & mobile
- [Offline Support Architecture](architecture/OFFLINE_SUPPORT_ARCHITECTURE.md) — Offline-first mobile design
- [Modules Migration](architecture/modules-migration.md) — Legacy `modules/*` → `services/*` migration log

### API

- [API Route Map](api/API_ROUTE_MAP.md) — Complete API endpoint reference
- [API Versioning](api/API_VERSIONING.md) — Versioning policy (`/v1`, `/v2`, …)
- [Error Codes](api/ERROR_CODES.md) — Canonical error code list
- [Event Schemas](api/EVENT_SCHEMAS.md) — Domain event payloads
- [Payment Webhooks](api/PAYMENT_WEBHOOKS.md) — Payment provider webhook integration

### Database

- [Database Schema](database/DATABASE_SCHEMA.md) — Per-service Prisma schemas
- [Database Query Optimization](database/DATABASE_QUERY_OPTIMIZATION.md) — Indexing, N+1 prevention, PIT tuning
- [Prisma Schema Ownership](database/PRISMA_SCHEMA_OWNERSHIP.md) — Who owns which schema

### Deployment

- [Deployment Guide](deployment/DEPLOYMENT_GUIDE.md) — End-to-end deployment process
- [Deployment Runbooks](deployment/DEPLOYMENT_RUNBOOKS.md) — Step-by-step deploy runbooks
- [Environment Parity](deployment/ENVIRONMENT_PARITY.md) — Dev ↔ staging ↔ prod parity rules
- [Runbooks](deployment/RUNBOOKS.md) — Operational runbooks
- [Port Allocation](deployment/port-allocation.md) — Service port assignments
- [Secrets Management](deployment/secrets-management.md) — Secret handling policy
- [Coolify Deployment](deployment/coolify.md) — Self-hosted Coolify deploy guide

### Media

- [Asset Optimization Pipeline](media/ASSET_OPTIMIZATION_PIPELINE.md) — Image/video processing pipeline

### Development

- [Developer Onboarding](development/DEVELOPER_ONBOARDING.md) — Local setup, workflow, debugging
- [Local Testing Guide](development/guide.md) — End-to-end project testing walkthrough
- [Review Checklist](development/REVIEW_CHECKLIST.md) — PR review guidelines
- [Workflow Commands](development/WORKFLOW_COMMANDS.md) — Claude / AI workflow prompts
- [Upgrade](development/UPGRADE.md) — Dependency & runtime upgrade playbook

### Operations

- [Disaster Recovery Runbook](operations/disaster-recovery-runbook.md) — DR procedures
- [Support Workflows](operations/SUPPORT_WORKFLOWS.md) — Support ticket workflows
- [Troubleshooting Guide](operations/TROUBLESHOOTING_GUIDE.md) — Common issues & fixes

### Analytics

- [Analytics Governance](analytics/ANALYTICS_GOVERNANCE.md) — Event taxonomy & governance

### QA

- [E2E Test Specifications](qa/e2e-test-specifications.md)
- [Load Test Specifications](qa/load-test-specifications.md)
- [Chaos Test Specifications](qa/chaos-test-specifications.md)

### Engineering Standards (`.trae/rules/`)

Workspace-level engineering rules live outside `docs/` and are auto-loaded by the IDE:

- [Engineering Rules & Security Standard](../.trae/rules/CLAUDE.md)
- [Database Backup Strategy](../.trae/rules/DATABASE_BACKUP_STRATEGY.md)
- [Data Retention Policy](../.trae/rules/DATA_RETENTION_POLICY.md)
- [DNS & SSL Setup](../.trae/rules/DNS_SSL_SETUP.md)
- [Final Security Audit](../.trae/rules/FINAL_SECURITY_AUDIT.md)
- [Implementation Summary](../.trae/rules/IMPLEMENTATION_SUMMARY.md)
- [Onboarding](../.trae/rules/ONBOARDING.md)

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
