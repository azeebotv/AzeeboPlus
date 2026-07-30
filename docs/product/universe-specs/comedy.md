# Comedy Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex H

## Purpose
Launch a high-frequency viral entertainment layer.

## Core Features
- Comedy feed
- Trending skits
- Stand-up clips
- Creator comedy hubs
- Featured comedians
- Share-first rails
- Premium comedy specials
- Challenge prompts

## User Types
- Casual viewer
- Comedy fan
- Creator
- Admin

## UX Logic
**Watch → Laugh → Share → Follow → Return**

## Key Screens
- Comedy home
- Clip player
- Comedian profile
- Trending rail
- Comedy challenge page
- Special release page

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /comedy | Get comedy feed |
| GET | /comedy/trending | Get trending comedy |
| GET | /comedy/clips | List clips |
| GET | /comedy/clips/:id | Get clip details |
| POST | /comedy/clips/:id/like | Like clip |
| POST | /comedy/clips/:id/comment | Comment on clip |
| POST | /comedy/clips/:clipId/share | Share clip |
| GET | /comedy/comedians | List comedians |
| GET | /comedy/specials | List specials |
| GET | /comedy/challenges | List challenges |

## Analytics Events
| Event | Trigger |
|-------|---------|
| comedy_clip_viewed | User views comedy clip |
| comedy_clip_liked | User likes clip |
| comedy_clip_shared | User shares clip |
| comedy_challenge_joined | User joins comedy challenge |

## Success Metrics
- High shareability
- Strong casual return behavior
- Viral reach
- Advertiser-friendly mass inventory

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Analytics events — Wired in mobile (2 screens) + web (1 page)
