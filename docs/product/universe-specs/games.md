# Games Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex G

## Purpose
Launch a repeat-play engagement and rewards layer.

## Core Features
- Daily challenges
- Trivia formats
- Game categories
- Leaderboards
- Score tracking
- Rewards integration
- Premium entry formats
- Tournament hooks

## User Types
- Casual player
- Competitive player
- Admin

## UX Logic
**Enter → Play → Score → Reward → Re-enter**

## Key Screens
- Games home
- Challenge page
- Gameplay page
- Leaderboard
- Reward state
- Tournament page

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /games | List games |
| GET | /games/home | Get games home |
| GET | /games/categories | List categories |
| GET | /games/:slug | Get game details |
| POST | /games/:gameId/start | Start game |
| POST | /games/answer | Submit answer |
| POST | /games/:sessionId/complete | Complete game |
| GET | /games/daily-challenge | Get daily challenge |
| POST | /games/daily-challenge/submit | Submit challenge |
| GET | /games/tournaments | List tournaments |
| GET | /games/leaderboard | Get leaderboard |

## Analytics Events
| Event | Trigger |
|-------|---------|
| game_started | User starts game |
| game_completed | User completes game |
| game_answer_submitted | User submits answer |
| game_daily_challenge_completed | User completes daily challenge |
| game_tournament_joined | User joins tournament |

## Success Metrics
- High repeat-entry behavior
- Strong session frequency
- Measurable gamified revenue
- Visible reward-led return loops

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Analytics events — Wired in mobile (3 screens) + web (1 page)
