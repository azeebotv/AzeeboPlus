# Azeebo+ Creator Dashboard

Next.js creator portal for content management and analytics.

## Features

- Upload and manage content (drafts, scheduled, published)
- Analytics dashboard (views, earnings, engagement)
- Subscription and monetization management
- Audience insights
- Profile and brand management

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | Backend API URL |
| NEXT_PUBLIC_CREATOR_KEY | Creator authentication key |

## Database Co-Tenancy & Migration Governance (AD-01 / R-08)

> [!WARNING]
> `azeebo_creator` is a **co-tenanted database** shared between `apps/creator` and `services/universes/creator-service`.
>
> **Migration Guardrails:**
> 1. Any migration modifying tables or relations in `azeebo_creator` requires **dual sign-off** (Creator Portal Lead & Creator Backend Lead).
> 2. No direct table drops, column renames, or disruptive index modifications are permitted prior to post-launch split.
> 3. Refer to `docs/architecture/CREATOR-DB-SPLIT-PLAN.md` for post-launch schema separation roadmap.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- Recharts (charts)
