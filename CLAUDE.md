# Azeebo+ Engineering Rules

> **Document Purpose**: This file provides AI-assisted development guidelines for Claude Code and other AI tools working on the Azeebo+ codebase. All engineers and AI assistants must follow these rules.

---

## Project Overview
Azeebo+ is a multi-service entertainment platform with 27 microservices, 2 frontend apps, 2 backend API apps, and 18 shared packages.

### Tech Stack
- **Monorepo:** pnpm 10.33.2 workspaces
- **Backend:** NestJS 11.x with Prisma 6.x (PostgreSQL)
- **Frontend:** Next.js 15 (web), Expo 56 (mobile)
- **Database:** Per-service PostgreSQL (28 databases with `azeebo_` prefix)
- **Cache/Queue:** Redis 7+ / BullMQ
- **Node.js:** 22+ (see `.nvmrc`)

### Package Manager
**ALWAYS use `pnpm`**, never `npm`.

---

## Architecture

### Repository Structure
Azeebo+ uses a **modular monorepo** with categorized service organization:

```
azeebo-plus/
├── apps/                          # Client applications & backend APIs
│   ├── mobile/                    # React Native mobile app (Expo)
│   ├── web/                       # Next.js web application
│   ├── admin/                     # Admin backend API (NestJS, port 4016)
│   └── creator-portal/            # Creator backend API (NestJS, port 4014)
│
├── services/                      # Backend microservices (categorized)
│   ├── core/                      # Essential platform services
│   │   ├── auth-service/          # Authentication & authorization
│   │   ├── user-service/          # User management
│   │   ├── wallet-service/        # Wallet & balance management
│   │   ├── payment-service/       # Payment processing
│   │   ├── content-service/       # Content management
│   │   ├── search-service/        # Search functionality
│   │   └── media-service/         # Media upload & processing (S3/Redis-based)
│   │
│   ├── universes/                 # Universe-specific business logic
│   │   ├── reality-service/       # Reality TV shows & voting
│   │   ├── lifestyle-service/     # Lifestyle content & events
│   │   ├── vertical-service/      # Vertical video & storyworlds
│   │   ├── movie-service/         # Movie rentals & premieres
│   │   ├── games-service/         # Games & tournaments
│   │   ├── comedy-service/        # Comedy content
│   │   ├── sports-service/        # Sports content & predictions
│   │   └── creator-service/       # Creator onboarding, verification, earnings
│   │
│   ├── engagement/                # User interaction services
│   │   ├── notification-service/  # Push, email, SMS notifications
│   │   ├── reward-service/        # Rewards & gamification
│   │   ├── referral-service/      # Referral program
│   │   ├── messaging-service/     # In-app messaging
│   │   ├── engagement-service/    # Engagement tracking
│   │   └── subscription-service/  # Subscription management
│   │
│   ├── operations/                # Platform operations
│   │   ├── moderation-service/    # Content moderation
│   │   ├── queue-service/         # Background job processing
│   │   └── support-service/       # Customer support & tickets
│   │
│   ├── intelligence/              # Data & analytics
│   │   ├── analytics-service/     # Analytics & reporting
│   │   └── recommendation-service/# Personalization & recommendations
│   │
│   └── gateway/                   # API gateway & routing
│       └── api-gateway/           # Central API gateway
│
├── packages/                      # Shared code libraries (21 packages)
│   ├── ui/                        # Reusable UI components (web + mobile)
│   ├── design-tokens/             # Design system tokens
│   ├── shared-types/              # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   ├── api-client/                # API client libraries
│   ├── analytics-sdk/             # Analytics tracking SDK
│   ├── auth/                      # Authentication utilities
│   ├── security/                  # Security utilities (CORS, rate limiting, guards)
│   ├── validation/                # Validation utilities
│   ├── error-handling/            # Error handling utilities
│   ├── logger/                    # Logging utilities
│   ├── observability/             # Observability utilities (metrics, tracing, health)
│   ├── feature-flags/             # Feature flag utilities
│   ├── test-utils/                # Testing utilities
│   ├── internal-clients/          # Internal service clients
│   ├── shared-services/           # Shared NestJS service modules (prisma, redis, cache, rate-limit, queue, audit, analytics, validation, pagination, api-versioning, sanitize, middleware)
│   ├── contract-tests/            # Pact contract tests for service boundaries
│   ├── opentelemetry/             # OpenTelemetry initialization and tracing
│   ├── event-bus/                 # Event-driven communication between services
│   ├── http-client/               # HTTP client utilities for inter-service calls
│   └── shared-queue/              # Shared queue configuration and utilities
│
├── infra/                         # Infrastructure configurations
│   ├── k8s/                       # Kubernetes manifests
│   ├── config/                    # Configuration files (PgBouncer, Redis)
│   └── scripts/                   # Infrastructure scripts (DB init, PgBouncer)
│
├── ci/                            # CI/CD scripts
│   └── scripts/                   # Automation scripts (secret verification, analytics validation)
│
├── scripts/                       # Development & utility scripts
│   ├── local-dev.sh               # Local development runner (setup, start, stop, status)
│   ├── build-all.sh               # Build all packages, services, and apps
│   ├── test-all.sh                # HTTP smoke tests
│   ├── database/                  # Database management (migrate, seed)
│   ├── demo-content/              # Demo data deployment system
│   └── sql/                       # SQL migration files
│
└── prisma/                        # Root-level seed data
    └── seed/                      # SQL seed files (universes, admin)
```

### Service Ports
| Port | Service |
|------|---------|
| 3000 | auth-service |
| 3001 | user-service |
| 3002 | wallet-service |
| 3003 | payment-service |
| 3004 | content-service |
| 3005 | search-service |
| 3006 | notification-service |
| 3007 | reward-service |
| 3008 | analytics-service |
| 3009 | recommendation-service |
| 3010 | reality-service |
| 3011 | movie-service |
| 3012 | comedy-service |
| 3013 | api-gateway |
| 3014 | games-service |
| 3015 | queue-service |
| 3016 | lifestyle-service |
| 3017 | vertical-service |
| 3018 | creator-service |
| 3019 | media-service |
| 3020 | support-service |
| 3021 | sports-service |
| 3022 | moderation-service |
| 3023 | engagement-service |
| 3024 | messaging-service |
| 3025 | referral-service |
| 3026 | subscription-service |
| 4000 | web app |
| 4014 | creator-portal |
| 4016 | admin app |

### Database Naming
All databases use `azeebo_` prefix: `azeebo_auth`, `azeebo_user`, `azeebo_vertical`, etc.

### Service Organization Principles

**Core Services** (`/services/core/`):
- Essential platform functionality used by all universes
- Authentication, user management, payments, content, search, media
- Must be highly available and performant
- Changes require careful review and testing

**Universe Services** (`/services/universes/`):
- Universe-specific business logic and features
- Each universe operates independently but uses core services
- Can be developed and deployed separately
- Must not duplicate core service functionality
- Includes: Reality, Creator, Lifestyle, Vertical, Movie, Games, Comedy, Sports

**Engagement Services** (`/services/engagement/`):
- User interaction and retention features
- Notifications, rewards, referrals, messaging
- Support gamification and community features
- Integrate with analytics for tracking

**Operations Services** (`/services/operations/`):
- Platform maintenance and support
- Moderation, queue processing, customer support
- Background processing and async operations
- Admin and operational tools

**Intelligence Services** (`/services/intelligence/`):
- Data analysis and personalization
- Analytics, reporting, recommendations
- Machine learning and AI features
- Business intelligence and insights

**Gateway Services** (`/services/gateway/`):
- API routing and orchestration
- Request aggregation and transformation
- Rate limiting and authentication
- API versioning and documentation

### No Duplication Policy
- **Never** duplicate core service logic in universe modules
- **Never** create independent auth, wallet, payment, or analytics systems
- **Always** reuse shared services and packages
- **Always** check if functionality exists before creating new code

---

## Frontend

### Technology Standards
- **TypeScript only** - No JavaScript files allowed
- **React/React Native** for all client applications
- **Next.js** for web application
- **Expo** for mobile application
- **NestJS** for all backend services

### State Management
- **Zustand** is the primary state management library for client applications (mobile and web)
- **React Context API** is used for cross-cutting concerns and provider composition (Auth, Theme, Wallet, etc.)
- Shared contexts live in `/apps/mobile/src/contexts/` (Auth) and `/apps/web/src/context/` (Auth, Theme, Wallet)
- **When to use Zustand**: Feature-specific state, complex state logic, frequently updated state, state outside React tree
- **When to use Context**: Cross-cutting concerns, dependency injection, infrequently updated state, provider composition
- **Always** use existing stores/contexts before creating new ones
- **Always** keep context providers wrapped at the app root level
- **Never** duplicate state that already exists in a store or context

### Component Reuse
- **Always** use shared UI components from `/packages/ui` before creating new ones
- **Always** use design tokens from `/packages/design-tokens`
- **Always** check existing components before building new ones
- **Never** create standalone UI components outside the shared package

### Required UI States
Every screen and component **must** include these states:
1. **Loading** - Data is being fetched
2. **Empty** - No data to display
3. **Error** - Something went wrong
4. **Success** - Action completed successfully
5. **Unauthenticated** - User not logged in (where applicable)
6. **Locked** - Content requires payment/subscription (where applicable)

### Mobile-First Design
- **Always** design for mobile screens first
- **Always** ensure touch targets are at least 44x44px
- **Always** support low-data mode for media-heavy screens
- **Always** optimize for slow network connections
- **Always** test on actual mobile devices

### Accessibility Requirements
- **Must** support screen readers (VoiceOver, TalkBack)
- **Must** support keyboard navigation
- **Must** have proper ARIA labels
- **Must** maintain WCAG AA color contrast
- **Must** support reduced motion preferences
- **Must** provide alt text for images

---

## Analytics

### Event Naming Convention
All analytics events **must** use:
- **snake_case** format
- **Universe prefix** (e.g., `reality_`, `creator_`, `lifestyle_`)
- **Descriptive action** (e.g., `viewed`, `clicked`, `submitted`)

**Examples:**
```typescript
// Good
reality_vote_submitted
creator_content_uploaded
lifestyle_event_rsvp_completed
agbala_quiz_started
agbala_character_viewed

// Bad
RealityVoteSubmitted (wrong case)
vote (missing prefix)
userDidVote (wrong format)
```

### Required Tracking
Every conversion screen **must** fire these events:
1. **view** - Screen was displayed
2. **submit** - User initiated action
3. **success** - Action completed successfully
4. **failure** - Action failed

### Analytics Implementation
- **Always** use the analytics SDK from `/packages/analytics-sdk`
- **Always** include user context (user ID, session ID)
- **Always** include metadata (timestamp, device, platform)
- **Never** track sensitive data (passwords, payment details)
- **Always** validate events before sending

---

## Monetization

### Payment Safety Rules
- **Never** hardcode prices in frontend or backend code
- **Always** fetch prices from the payment service or content metadata
- **Always** use the shared wallet service for all transactions
- **Always** validate payments server-side
- **Never** trust client-side payment validation

### Wallet Integration
- **Always** use `/services/core/wallet-service` for wallet operations
- **Never** implement custom wallet logic in universe modules
- **Always** check wallet balance before initiating payments
- **Always** handle insufficient funds gracefully
- **Always** provide clear transaction history

### Premium Content
- **Always** check access permissions server-side
- **Never** rely on client-side access checks
- **Always** provide clear upgrade prompts for locked content
- **Never** block free users from understanding the platform
- **Always** offer preview or trial where appropriate

---

## Code Quality

### TypeScript Standards
- **Always** use strict mode
- **Always** define explicit types (no `any`)
- **Always** use interfaces for object shapes
- **Always** use enums for fixed value sets
- **Always** provide JSDoc comments for public APIs

### Code Style
- TypeScript strict mode
- ESLint flat config
- Prettier for formatting
- Import order: external → internal → relative

### Testing Requirements
- **Must** have unit tests for all service methods
- **Must** have integration tests for all API endpoints
- **Must** have E2E tests for critical user journeys
- **Must** maintain >80% code coverage
- **Must** test all error paths and edge cases
- Backend: Jest with 70% coverage threshold
- Frontend: Vitest (web), Jest (mobile)
- E2E: Playwright (web), Detox (mobile)

### Error Handling
- **Always** use structured error responses
- **Always** log errors with context
- **Always** provide user-friendly error messages
- **Never** expose internal error details to clients
- **Always** handle network failures gracefully

### Code Review Checklist
Before submitting any PR, verify:
- [ ] TypeScript strict mode enabled
- [ ] All required UI states implemented
- [ ] Analytics events added
- [ ] Shared components reused
- [ ] No duplicate wallet/payment logic
- [ ] Tests included and passing
- [ ] Accessibility compliant
- [ ] Mobile responsive
- [ ] Error handling complete
- [ ] Documentation updated

---

## Security

### Authentication & Authorization
- **Always** use the auth service for authentication
- **Never** implement custom auth logic
- **Always** validate JWT tokens server-side
- **Always** check permissions before operations
- **Never** expose sensitive data in logs

### JWT Configuration
- Access token: 30 minutes
- Refresh token: 7 days
- Secrets: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (auto-generated by `local-dev.sh setup`)
- **Never** use `JWT_SECRET` — always use the access/refresh pair

### Data Protection
- **Never** log sensitive data (passwords, tokens, payment info)
- **Always** encrypt data at rest and in transit
- **Always** use environment variables for secrets
- **Never** commit secrets to version control
- **Never** commit `.env` files
- **Always** validate and sanitize user input

### Rate Limiting
- **Always** implement rate limiting on public endpoints
- **Always** use the shared rate limiter from `/packages/security`
- **Never** allow unlimited requests to any endpoint
- **Always** return proper 429 responses with retry info
- CORS configured per service

---

## Performance

### Backend Performance
- **Always** use database indexing for frequent queries
- **Always** implement pagination for list endpoints
- **Always** cache frequently accessed data
- **Never** load unnecessary data from database
- **Always** use connection pooling

### Frontend Performance
- **Always** lazy load routes and components
- **Always** optimize images and media
- **Always** implement virtualization for long lists
- **Never** block the main thread
- **Always** use memoization for expensive computations

### Monitoring
- **Always** include health check endpoints
- **Always** emit performance metrics
- **Always** track error rates
- **Always** monitor API response times
- **Always** set up alerts for critical issues

---

## Never Do List

### Architecture Violations
- Create standalone UI components outside `/packages/ui`
- Implement custom authentication logic
- Build independent wallet or payment systems
- Create duplicate analytics tracking
- Build separate moderation systems
- Hardcode prices or payment amounts
- Bypass shared services for core functionality

### Code Quality Violations
- Use `any` type in TypeScript
- Skip error handling
- Ignore accessibility requirements
- Create components without all required states
- Write code without tests
- Commit code with linting errors
- Ignore mobile responsiveness

### Security Violations
- Log sensitive data
- Commit secrets to version control
- Trust client-side validation only
- Expose internal errors to clients
- Skip authentication checks
- Ignore rate limiting
- Store passwords in plain text

### Performance Violations
- Load unnecessary data from database
- Skip pagination on list endpoints
- Block the main thread in frontend
- Ignore caching opportunities
- Skip database indexing
- Create memory leaks
- Ignore bundle size

---

## Development Workflow

### Key Commands
```bash
# Development
./scripts/local-dev.sh setup    # First-time setup
./scripts/local-dev.sh start    # Start all services
./scripts/local-dev.sh stop     # Stop all services

# Per-service
pnpm install                    # Install dependencies
pnpm run prisma:generate        # Generate Prisma client
pnpm run prisma:migrate         # Run migrations
pnpm run start:dev              # Start in dev mode
pnpm run test                   # Run tests
pnpm run build                  # Build for production
```

### Feature Development
1. **Create branch** from `main` with descriptive name
2. **Implement feature** following all rules above
3. **Write tests** for all new code
4. **Update documentation** if applicable
5. **Run linting** and fix all issues
6. **Submit PR** with completed checklist
7. **Request review** from at least 2 engineers
8. **Address feedback** and get approval
9. **Merge** after all checks pass

### Bug Fixing
1. **Reproduce bug** and understand root cause
2. **Write failing test** that demonstrates the bug
3. **Fix the bug** with minimal changes
4. **Verify test passes** and no regressions
5. **Update documentation** if behavior changed
6. **Submit PR** following standard workflow

### Code Review Process
- **Check** all items in the code review checklist
- **Verify** tests are comprehensive
- **Ensure** no security vulnerabilities
- **Validate** performance implications
- **Confirm** documentation is updated
- **Test** the changes locally if needed

---

## API Design

### RESTful Standards
- **Always** use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **Always** use plural nouns for resources (e.g., `/users`, `/shows`)
- **Always** use proper status codes (200, 201, 400, 401, 403, 404, 500)
- **Always** include pagination for list endpoints
- **Always** version APIs (e.g., `/v1/users`)

### Request/Response Format
- **Always** use JSON for request and response bodies
- **Always** validate request data with DTOs
- **Always** return consistent response structure
- **Always** include error details in error responses
- **Never** return sensitive data in responses

### API Documentation
- **Always** document all endpoints with OpenAPI/Swagger
- **Always** include request/response examples
- **Always** document authentication requirements
- **Always** document error codes and messages
- **Always** keep documentation in sync with code

---

## Database

### Technology Choices
- **PostgreSQL** - Primary relational database for all transactional data
- **Redis** - Caching, session storage, rate limiting, and queue backends
- **Prisma ORM** - Database access layer for all services

### Connection Conventions
- **Always** use the `DATABASE_URL` environment variable for PostgreSQL connections
- **Always** use the `REDIS_URL` environment variable for Redis connections
- **Never** hardcode connection strings in source code
- **Always** use connection pooling in production

### Schema Design
- **Always** use Prisma ORM for database operations
- **Always** define proper relations and constraints
- **Always** use migrations for schema changes
- **Always** index frequently queried fields
- **Never** store sensitive data unencrypted

### Query Optimization
- **Always** use `select` to fetch only needed fields
- **Always** use `include` for relations instead of separate queries
- **Always** paginate large result sets
- **Never** use `SELECT *` in production
- **Always** monitor slow queries

### Cross-Service Model Duplication

Azeebo+ is a modular monorepo of microservices. Each service owns its Prisma schema and database. Cross-service **data ownership** duplication (e.g. `User` owned by auth-service, referenced as `userId` String elsewhere) is a deliberate microservice pattern — not a violation of the No Duplication Policy. The No Duplication Policy prohibits duplicating **business logic** (auth, wallet, payment, analytics), not the structural referencing of foreign-owned entities.

#### When Model Duplication Is Appropriate
- **Reference-only fields**: A service may store a foreign-owned entity's `id` (and denormalized snapshot fields like `displayName`, `avatar`) as a String, without re-defining the full `User`/`Wallet` model. Example: `engagement-service.LeaderboardEntry.userId` + `displayName` + `avatar`.
- **Bounded-context ownership**: When two services legitimately own different aspects of a concept, each may have its own model. Example: `payment-service.Refund` (the financial ledger row) vs `support-service.Refund` (the support-case workflow row) — different bounded contexts, different lifecycles, linked by `refundReference`.
- **Specialized case types**: A general concept may have service-specific specializations. Example: `reality-service.Prediction` (show-scoped) vs `engagement-service.Prediction` (cross-universe) — same noun, different scope.
- **Read-model projections**: Materialized views/tables refreshed from upstream events (e.g. `LeaderboardEntry` refreshed from reward signals) are appropriate duplication for query performance.

#### When Model Duplication Is NOT Appropriate
- **Re-implementing core logic**: A universe service must not re-implement auth, wallet, payment, or analytics — it must call the owning service.
- **Owning another service's data**: A service must not own the canonical `User`, `Wallet`, `PaymentIntent`, or `Universe` table — these belong to auth-service, wallet-service, payment-service, and content-service respectively.
- **Carrying full reference models for local relations**: A service must not copy the entire `User` model into its schema just to satisfy Prisma relation syntax. Use `userId` String references instead.
- **Divergent definitions of the same concept**: If two services define the same concept (e.g. `Subscription`) with incompatible fields, the canonical owner must be identified and the other must align or rename.

#### Maintaining Consistency Across Duplicated Models
- **Always** reference foreign-owned entities by `id` (String UUID), never by re-defining the model.
- **Always** prefix denormalized snapshot fields clearly and refresh them via events or scheduled jobs (e.g. `displayName` on `LeaderboardEntry` is a snapshot, not the source of truth).
- **Always** use the same field name for the same concept across services (e.g. `userId` everywhere, never `user_id` in one service and `userId` in another).
- **Always** use the same enum value strings across services for shared concepts (e.g. `status: "active" | "cancelled" | "expired"`).
- **Never** rely on a denormalized snapshot for authorization or billing decisions — always call the owning service.

#### Managing Updates to Duplicated Models
- **Source-of-truth rule**: The owning service is the only writer of the canonical record. Other services consume via API or event.
- **Event-driven sync**: When the canonical record changes, the owning service emits an event (via queue-service); consumers update their snapshots asynchronously.
- **Schema-change coordination**: Changes to a shared concept's shape require a coordinated update across all referencing services. Use a deprecation window: add the new field, migrate consumers, then remove the old field.
- **Reconciliation reviews**: During code review, verify that any new model touching a foreign-owned concept follows the reference-only pattern. Flag full-model copies for remediation.

---

## Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Rollback plan documented

### Post-Deployment Verification
- [ ] Health checks passing
- [ ] Critical user journeys working
- [ ] No error spike in monitoring
- [ ] Performance metrics normal
- [ ] Logs show no critical issues

---

## Questions & Support

If you're unsure about any rule or need clarification:
1. Check existing code for examples
2. Ask in the engineering Slack channel
3. Consult the technical lead
4. Review the architecture documentation
5. Check the PR review comments for similar issues

---

## Document Maintenance

This document should be updated when:
- New architectural decisions are made
- New services or packages are added
- Coding standards change
- New security requirements emerge
- Performance best practices evolve

**Last Updated**: 2026-06-17  
**Version**: 1.1  
**Maintainer**: Engineering Lead

### Changelog
- **v1.1** (2026-06-17) — Added `Cross-Service Model Duplication` subsection under Database: defines when cross-service model duplication is appropriate, when it is not, how to maintain consistency, and how to manage updates.
- **v1.0** — Initial release.
