# Vertical Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex E

## Purpose
Launch the premium interconnected scripted universe.

## Core Features
- Universe landing page
- Layered overview / world map
- Title hubs
- Character pages
- Canon / timeline pages
- Lore explorer
- Recaps
- Crossover tracker
- Theories and discussions

## User Types
- Casual viewer
- Fandom member
- Theory builder
- Admin

## UX Logic
**Watch → Theory-Build → Explore → Follow → Stay**

## Key Screens
- Universe home
- Layered map
- Title detail
- Character profile
- Lore page
- Crossover page

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /vertical/universes | List universes |
| GET | /vertical/universes/map/:slug | Get universe map |
| GET | /vertical/characters | List characters |
| GET | /vertical/characters/:slug | Get character details |
| GET | /vertical/titles | List titles |
| GET | /vertical/titles/:slug | Get title details |
| GET | /vertical/lore | List lore entries |
| GET | /vertical/crossovers | List crossovers |
| GET | /vertical/storyworlds | List storyworlds |
| GET | /vertical/storyworlds/:slug | Get storyworld details |
| POST | /vertical/storyworlds/:slug/theories | Submit theory |

## Analytics Events
| Event | Trigger |
|-------|---------|
| vertical_universe_viewed | User views universe page |
| vertical_title_viewed | User views title details |
| vertical_character_viewed | User views character page |
| vertical_theory_submitted | User submits theory |
| vertical_lore_explored | User explores lore |

## Success Metrics
- Strong completion rates
- Repeat viewing
- High lore engagement
- Fandom behavior
- Strong social discussion

## Status
- [x] Backend service implemented
- [x] Agbala storyworld fully implemented (20 Prisma models)
- [x] Mobile screens implemented (Agbala + generic vertical)
- [x] Web pages implemented
- [x] API reference (1259 lines)
- [x] Analytics events — Wired in mobile (3 screens) + web (1 page)
