# Azeebo+ Seed System

## Overview

The seed system populates all service databases with realistic test data across 8 services and 655+ records.

## Quick Start

```bash
# Dry run (preview without writing)
pnpm tsx scripts/seed-all.ts --dry-run

# Seed all services
pnpm tsx scripts/seed-all.ts

# Seed a specific service
pnpm tsx scripts/seed-all.ts --service=user
pnpm tsx scripts/seed-all.ts --service=content
pnpm tsx scripts/seed-all.ts --service=creator
pnpm tsx scripts/seed-all.ts --service=wallet
pnpm tsx scripts/seed-all.ts --service=payment
pnpm tsx scripts/seed-all.ts --service=messaging
pnpm tsx scripts/seed-all.ts --service=notification
pnpm tsx scripts/seed-all.ts --service=engagement
pnpm tsx scripts/seed-all.ts --service=lifestyle-guides
```

## Environment Variables

Each service requires its own database URL:

```env
# User Service
USER_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_users

# Content Service
CONTENT_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_content

# Creator Service
CREATOR_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_creators

# Wallet Service
WALLET_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_wallets

# Payment Service
PAYMENT_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_payments

# Messaging Service
MESSAGING_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_messaging

# Notification Service
NOTIFICATION_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_notifications

# Referral Service
REFERRAL_DATABASE_URL=postgresql://user:pass@localhost:5432/azeebo_referrals
```

If not set, falls back to `DATABASE_URL`.

## Seed Order

Services are seeded in dependency order:

1. **user-service** — Users, profiles, preferences, watch history, saved items, following
2. **content-service** — Universes, categories, tags, content items, comments
3. **creator-service** — Creator profiles, channels, earnings, challenges, tips
4. **wallet-service** — Wallets, transactions, balance snapshots, ledger entries
5. **payment-service** — Payments, payment intents, payment methods
6. **messaging-service** — Conversations, messages, reactions
7. **notification-service** — User notifications
8. **engagement-service** — Referrals

## Record Counts

| Service | Records | Description |
|---------|---------|-------------|
| user | 150 | 50 users + profiles + preferences + 200 watch history + 100 saved + 80 following + 30 subscriptions |
| content | 75 | 9 universes + 25 categories + 16 tags + 25 movies + 20 music + 8 comedy + 9 reality + 150 comments |
| creator | 30+ | 30 creators + 40 channels + 100 earnings + 10 challenges + 60 tips |
| wallet | 50+ | 50 wallets + 200 transactions + 50 snapshots + 100 ledger entries |
| payment | 150 | 80 payments + 40 intents + 30 methods |
| messaging | 120+ | 20 conversations + 100 messages + reactions |
| notification | 50 | 50 user notifications |
| engagement | 30 | 30 referrals |
| **Total** | **655+** | |

## Architecture

```
scripts/
├── seed-all.ts              # Master runner
├── SEED-README.md           # This file
└── seeders/
    ├── utils.ts             # Shared helpers (random, generators, names)
    ├── user-seeder.ts       # user-service
    ├── content-seeder.ts    # content-service
    ├── creator-seeder.ts    # creator-service
    ├── wallet-seeder.ts     # wallet-service
    ├── payment-seeder.ts    # payment-service
    ├── messaging-seeder.ts  # messaging-service
    ├── notification-seeder.ts # notification-service
    └── engagement-seeder.ts # referral-service
```

## Data Sources

- **Users**: 40 Nigerian first/last names, realistic roles
- **Content**: Real Nollywood movies, Afrobeats songs, comedy specials, reality shows
- **Universes**: 9 universes (movie, music, comedy, reality, sports, lifestyle, games, creator, vertical)
- **Categories**: 25 categories across all content types
- **Tags**: 16 trending/exclusive tags

## Idempotent

All seeders use `upsert` where possible, so running them multiple times won't create duplicates.
