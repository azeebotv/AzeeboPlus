# Referral Service

User referral system with referral code generation, tracking, and reward distribution.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness probe |
| GET | `/live` | Liveness probe |
| GET | `/referrals/code` | Get user referral code |
| POST | `/referrals/generate` | Generate referral code |
| POST | `/referrals/apply` | Apply referral code |
| GET | `/referrals` | Get user referrals |
| GET | `/referrals/stats` | Get referral statistics |
| POST | `/referrals/complete/:referralId` | Complete a referral |

## Database Schema

- `ReferralCode` - User's unique referral code
- `Referral` - Individual referral records
- `ReferralReward` - Reward tracking for completed referrals
- `ReferralConfig` - Configurable reward amounts

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```
