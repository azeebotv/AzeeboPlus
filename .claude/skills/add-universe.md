# Skill: Add Universe

> Add a new entertainment universe to the Azeebo+ platform.

---

## Usage

```
/add-universe [universe-name] [description]

Example:
/add-universe anime "Anime streaming, reviews, and fan community"
/add-universe music "Music streaming, artist profiles, and concerts"
/add-universe fitness "Fitness tracking, workouts, and challenges"
```

## What It Does

1. Creates universe service directory
2. Creates database schema with `azeebo_[universe]` prefix
3. Adds API Gateway routes
4. Creates mobile app screens (tabs, home, detail)
5. Creates web pages
6. Adds admin panel sections
7. Registers in service catalog

## Files Created

```
services/universes/[universe]-service/     # Backend service
apps/mobile/src/modules/[universe]/        # Mobile screens
apps/web/src/app/[universe]/               # Web pages
apps/admin/src/modules/[universe]/         # Admin sections
prisma/seed/[universe].ts                  # Seed data
```

## Template: Service Structure

```
services/universes/[universe]-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── modules/
│       ├── [universe]/
│       │   ├── [universe].controller.ts
│       │   ├── [universe].service.ts
│       │   ├── [universe].module.ts
│       │   └── dto/
│       ├── database/
│       ├── health/
│       └── admin/
├── prisma/
│   └── schema.prisma
├── .env
├── .env.example
├── Dockerfile
└── package.json
```

## Template: Mobile Module Structure

```
apps/mobile/src/modules/[universe]/
├── screens/
│   ├── HomeScreen.tsx
│   ├── DetailScreen.tsx
│   └── ListScreen.tsx
├── components/
│   └── [Universe]Card.tsx
├── hooks/
│   └── use[Universe].ts
└── index.ts
```

## Universe Design Principles

1. **Mobile-first** — Design for thumb-friendly zones
2. **Dark mode** — Premium, cinematic aesthetic
3. **Engagement** — Notifications, rewards, streaks
4. **Monetization** — Wallet integration, subscriptions
5. **Analytics** — Track all user interactions

## Rules

- Follow existing universe patterns (check reality-service)
- Reuse shared services (wallet, auth, rewards)
- Never duplicate core logic
- Add analytics events on all conversions
- Include all 4 states (loading, empty, error, success)
- Register in README.md service catalog
