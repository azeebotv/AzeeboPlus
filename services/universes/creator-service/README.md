# Creator Service

Azeebo+ Creator Service - Manages creator profiles, content creation, and creator workflows.

## Features

- **Creator Profiles**: Manage creator profiles and settings
- **Content Creation**: Tools for creators to manage their content
- **Creator Analytics**: Insights for creators to track their performance
- **Rate Limiting**: Protection against abuse

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3006 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |

## Getting Started

```bash
# Install dependencies
ppnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
ppnpm start:dev
```

## API Routes

- `GET /v1/creators/profile` - Get creator profile
- `PUT /v1/creators/profile` - Update creator profile
- `GET /v1/creators/analytics` - Get creator analytics
- `POST /v1/creators/content` - Create new content

## Ownership & Database Co-Tenancy Boundaries (AD-01 / R-08)

> [!WARNING]
> `azeebo_creator` is a **co-tenanted database** shared between `services/universes/creator-service` (backend microservice) and `apps/creator` (creator dashboard portal).
>
> **Strict Migration Lock Rules:**
> 1. Any migration targeting `azeebo_creator` requires **explicit dual-approval** from both the Creator Backend Lead and Creator Portal Lead.
> 2. `scripts/drift-live-baseline.json` enforces an immutable drift statement ceiling. Zero unapproved drift statements are permitted.
> 3. Schema changes must be backward-compatible with existing client models.
> 4. Post-launch architectural separation plan is detailed in `docs/architecture/CREATOR-DB-SPLIT-PLAN.md`.

## Ownership

- **Team**: Creator Platform
- **Backend Maintainer**: creator-platform@azeeboplus.com
- **Portal Maintainer**: creator-portal@azeeboplus.com
- **Last Updated**: 2026-11-19
