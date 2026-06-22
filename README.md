# Azeebo+ Platform

A modular digital entertainment platform that functions as a shared operating system for multiple content universes.

## Overview

Azeebo+ is a multi-universe entertainment platform built with a modular architecture. It supports Reality TV, Creator Economy, Lifestyle, Gaming, Comedy, Sports, Premium Content, and Digital Cinema - all sharing a common infrastructure layer.

## Architecture

```
azeebo-plus/
├── apps/                    # Client applications
│   ├── mobile/             # React Native mobile app
│   ├── web/                # Next.js web application
│   ├── admin/              # Admin dashboard
│   └── creator-portal/     # Creator management portal
│
├── services/               # Backend microservices (categorized)
│   ├── core/              # Essential platform services
│   ├── universes/         # Universe-specific business logic
│   ├── engagement/        # User interaction services
│   ├── operations/        # Platform operations
│   ├── intelligence/      # Data & analytics
│   └── gateway/           # API gateway & routing
│
├── packages/              # Shared code libraries
├── infra/                 # Infrastructure configurations
└── ci/                    # CI/CD scripts
```

## Service Categories

### Core Services (`/services/core/`)
Essential platform functionality used by all universes:
- **auth-service** - Authentication & authorization
- **user-service** - User management
- **wallet-service** - Wallet & balance management
- **payment-service** - Payment processing
- **content-service** - Content management
- **search-service** - Search functionality
- **media-service** - Media upload & processing

### Universe Services (`/services/universes/`)
Universe-specific business logic:
- **reality-service** - Reality TV shows & voting
- **creator-service** - Creator onboarding, verification, earnings
- **lifestyle-service** - Lifestyle content & events
- **vertical-service** - Vertical video & storyworlds
- **movie-service** - Movie rentals & premieres
- **games-service** - Games & tournaments
- **comedy-service** - Comedy content
- **sports-service** - Sports content & predictions

### Engagement Services (`/services/engagement/`)
User interaction and retention:
- **notification-service** - Push, email, SMS notifications
- **reward-service** - Rewards & gamification
- **referral-service** - Referral program
- **messaging-service** - In-app messaging
- **engagement-service** - Engagement tracking
- **subscription-service** - Subscription management

### Operations Services (`/services/operations/`)
Platform maintenance and support:
- **moderation-service** - Content moderation
- **queue-service** - Background job processing
- **support-service** - Customer support & tickets

### Intelligence Services (`/services/intelligence/`)
Data analysis and personalization:
- **analytics-service** - Analytics & reporting
- **recommendation-service** - Personalization & recommendations

### Gateway Services (`/services/gateway/`)
API routing and orchestration:
- **api-gateway** - Central API gateway

## Shared Packages

| Package | Description |
|---------|-------------|
| `ui` | Reusable UI components |
| `design-tokens` | Design system tokens |
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

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma clients for all services
pnpm -r prisma generate

# Start development servers
pnpm -r dev
```

### Running Tests

```bash
# Run all tests
pnpm -r test

# Run tests with coverage
pnpm -r test:cov

# Run specific service tests
cd services/core/wallet-service && pnpm test
```

## Documentation

### Engineering Guidelines
- [CLAUDE.md](./CLAUDE.md) - AI-assisted development guidelines and engineering rules

### Architecture & Product
- [AZEEBO-MODULAR-APP.md](./docx/AZEEBO-MODULAR-APP.md) - Master architecture: BRD, PRD, product architecture, UX logic, design brief (v2.0)
- [QUICK-REFERENCE-AZEEBO-PLATFORM.md](./docx/QUICK-REFERENCE-AZEEBO-PLATFORM.md) - Quick reference for platform architecture, revenue model, and build sequence

### AI Build System
- [AZEEBO-CLAUDE-BUILD.md](./docx/AZEEBO-CLAUDE-BUILD.md) - Claude operations manual and AI development workflow for building the platform
- [QUICK-REFERENCE-AI-BUILD-SYSTEM.md](./docx/QUICK-REFERENCE-AI-BUILD-SYSTEM.md) - Quick reference for AI-augmented build system, prompt templates, and QA checklists

## Development Workflow

1. Create feature branch from `main`
2. Implement changes following CLAUDE.md guidelines
3. Write tests for all new code
4. Run linting: `pnpm lint`
5. Submit PR with completed checklist
6. Request review from 2+ engineers

## Key Principles

- **No Duplication**: Never duplicate core service logic in universe modules
- **Shared First**: Always use shared packages before creating new code
- **TypeScript Only**: No JavaScript files allowed
- **Mobile First**: Design for mobile screens first
- **Analytics Everywhere**: Track all user interactions
- **Security by Default**: Validate all inputs, encrypt sensitive data

## Environment Variables

Each service has its own `.env.example` file. Common variables:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
WALLET_SERVICE_URL=http://localhost:3001
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

Proprietary - VMNL Entertainment
