# Creator Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex C

## Purpose
Create the creator onboarding and monetization engine.

## Core Features
- Onboarding and verification
- Content upload and management
- Creator profiles and dashboards
- Analytics and earnings
- Subscriptions and tips
- Payout readiness
- Challenge participation

## User Types
- Aspiring creator
- Verified creator
- Admin

## UX Logic
**Create → Publish → Get Discovered → Earn → Grow**

## Key Screens
- Creator signup
- Upload flow
- Dashboard
- Earnings page
- Analytics page
- Creator profile

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /creators/onboard | Creator onboarding |
| POST | /creators/verification/submit | Submit verification |
| GET | /creators/me | Get creator profile |
| GET | /creators/analytics | Get analytics |
| GET | /creators/earnings | Get earnings |
| POST | /creators/payouts | Request payout |
| GET | /creators/uploads | List uploads |
| POST | /creators/uploads | Upload content |

## Analytics Events
| Event | Trigger |
|-------|---------|
| creator_onboarded | Creator completes onboarding |
| creator_content_uploaded | Creator uploads content |
| creator_tip_received | Creator receives tip |
| creator_payout_requested | Creator requests payout |
| creator_earnings_viewed | Creator views earnings |

## Success Metrics
- Creators onboard at scale
- Sustained upload behavior
- Creator-led audience growth
- Measurable creator earnings

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Standalone creator portal implemented
- [x] Settings GET/PUT endpoint — Implemented
- [x] Subscriber count — Uses try/catch fallback (table may not exist)
- [ ] Analytics events — NOT implemented (client-side SDK not wired in creator portal)
