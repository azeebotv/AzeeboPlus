# PRD: Creator Tipping Tiers

> Priority: P0 | Est. Effort: 3 days | Dependencies: wallet-service, creator-service

---

## Problem Statement

Current tipping is a flat amount with no recognition for top tippers. Users want to show bigger appreciation, and creators want to recognize their biggest supporters. A tiered tipping system with leaderboards increases engagement and revenue.

## User Stories

1. **As a viewer**, I want to choose from preset tip amounts or enter a custom amount so I can tip what I want
2. **As a viewer**, I want to see my ranking on the creator's tip leaderboard so I feel recognized
3. **As a creator**, I want to see my top tippers and their total contributions
4. **As a creator**, I want to send exclusive content to top tippers as rewards

## Requirements

### Functional
- [ ] Preset tip amounts (₦100, ₦500, ₦1000, ₦5000, ₦10000)
- [ ] Custom tip amount (min ₦50, max ₦100,000)
- [ ] Tip leaderboard per creator (all-time, monthly, weekly)
- [ ] Tip tiers: Bronze (₦1K+), Silver (₦10K+), Gold (₦50K+), Platinum (₦100K+)
- [ ] Badge display on user profile for each tier
- [ ] Creator can post exclusive content visible only to Gold+ tippers

### Non-Functional
- [ ] Instant tip delivery (< 2 seconds)
- [ ] Idempotent transactions (no double-charging)
- [ ] Real-time leaderboard updates

## Technical Design

### Database Changes
```prisma
model Tip {
  id            String   @id @default(uuid())
  fromUserId    String
  toUserId      String
  creatorId     String
  amount        Decimal  @db.Decimal(10, 2)
  currency      String   @default("NGN")
  message       String?
  createdAt     DateTime @default(now())
}

model TipLeaderboard {
  id            String   @id @default(uuid())
  creatorId     String
  userId        String
  totalAmount   Decimal  @db.Decimal(12, 2) @default(0)
  tier          String   // bronze, silver, gold, platinum
  lastTipAt     DateTime @default(now())
  @@unique([creatorId, userId])
}
```

### Tiers
| Tier | Min Total | Badge Color | Perks |
|------|-----------|-------------|-------|
| Bronze | ₦1,000 | Brown | Badge on profile |
| Silver | ₦10,000 | Silver | Badge + priority comments |
| Gold | ₦50,000 | Gold | Badge + exclusive content |
| Platinum | ₦100,000 | Diamond | Badge + exclusive + DM access |

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/creators/:id/tips` | Send tip |
| GET | `/creators/:id/tips/leaderboard` | Get leaderboard |
| GET | `/creators/:id/tips/stats` | Get tip stats |
| GET | `/users/me/tips` | Get my tipping history |

## Success Metrics
- 50% increase in creator tip revenue
- Average tip amount increases by 30%
- 20% of tippers reach Bronze tier within 3 months
