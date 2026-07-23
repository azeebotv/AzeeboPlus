# Reality Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex B

## Purpose
Launch the first major engagement and monetization engine.

## Core Features
- Reality hub (live shows, voting, predictions)
- Show hubs (episodes, contestants, clips)
- Voting system (single vote, multi-vote, supervotes)
- Prediction games
- Leaderboards
- Rewards integration
- Premium extras

## User Types
- Casual viewer
- Superfan
- Voter
- Prediction player
- Admin

## UX Logic
**Watch → React → Vote → Pay → Reward → Return**

## Key Screens
- Reality hub
- Show page
- Player
- Vote screen
- Prediction page
- Leaderboard
- Reward confirmation

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reality/shows | List shows |
| GET | /reality/shows/:showId | Get show details |
| POST | /reality/votes | Cast vote |
| POST | /reality/votes/quantity | Cast multiple votes |
| POST | /reality/supervotes | Cast supervote |
| POST | /reality/predictions | Submit prediction |
| GET | /reality/shows/:showId/leaderboard | Get leaderboard |
| GET | /reality/pricing | Get vote pricing |

## Analytics Events
| Event | Trigger |
|-------|---------|
| reality_show_viewed | User views show page |
| reality_vote_created | User casts vote |
| reality_supervote_created | User casts supervote |
| reality_prediction_submitted | User submits prediction |
| reality_leaderboard_viewed | User views leaderboard |

## Success Metrics
- High repeat usage
- Meaningful vote conversion
- Visible session lift
- Strong early ARPU

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Analytics events — Wired in mobile (6 screens) + web (1 page)
