# Sports Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex I

## Purpose
Launch a passion-driven fan participation and prediction layer.

## Core Features
- Sports highlights
- Prediction mechanics
- Fan boards
- Fixtures / event rails
- Contests
- Leaderboards
- Premium fan access
- Sponsor-backed sports challenges

## User Types
- Sports fan
- Predictor
- Admin

## UX Logic
**Follow → Predict → Engage → Compete → Return**

## Key Screens
- Sports home
- Highlight page
- Prediction screen
- Leaderboard
- Contest page
- Fan board

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /sports/home | Get sports home |
| GET | /sports/highlights | Get highlights |
| GET | /sports/fixtures | List fixtures |
| GET | /sports/fixtures/:id | Get fixture details |
| GET | /sports/predictions | List predictions |
| POST | /sports/predictions | Submit prediction |
| GET | /sports/predictions/leaderboard | Get prediction leaderboard |
| POST | /sports/predictions/:id/predict | Make prediction |
| GET | /sports/fan-contests | List fan contests |
| POST | /sports/fan-contests/:id/enter | Enter contest |
| GET | /sports/leaderboard | Get leaderboard |

## Analytics Events
| Event | Trigger |
|-------|---------|
| sports_prediction_submitted | User submits prediction |
| sports_contest_entered | User enters contest |
| sports_highlight_viewed | User views highlight |
| sports_fixture_viewed | User views fixture |

## Success Metrics
- Strong recurring engagement
- Repeat prediction participation
- High passion-led retention
- Strong sponsor and brand integration potential

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Analytics events — Wired in mobile (1 screen) + web (1 page)
