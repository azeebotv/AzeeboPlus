# Lifestyle Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex D

## Purpose
Build the always-on youth relevance layer.

## Brand Inputs
- TEN
- Nigezie
- Candy TV
- 9tLife

## Core Features
- Lifestyle feed
- Music rails
- Event discovery
- Celebrity content
- Nightlife / city guide
- Influencer pages
- Challenges, polls, quizzes

## User Types
- Casual browser
- Event-goer
- Music fan
- Admin

## UX Logic
**Scroll → Discover → Save → Share → Attend → Return**

## Key Screens
- Lifestyle home
- Music rail
- Celebrity rail
- City guide
- Event page
- Influencer profile

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /lifestyle/feed | Get lifestyle feed |
| GET | /lifestyle/events | List events |
| POST | /lifestyle/events/:id/rsvp | RSVP to event |
| GET | /lifestyle/city-guide | Get city guide |
| GET | /lifestyle/music | Get music content |
| GET | /lifestyle/celebrities | List celebrities |
| GET | /lifestyle/nightlife | Get nightlife content |
| GET | /lifestyle/influencers | List influencers |
| GET | /challenges | List challenges |
| GET | /polls | List polls |
| GET | /quizzes | List quizzes |

## Analytics Events
| Event | Trigger |
|-------|---------|
| lifestyle_feed_viewed | User views lifestyle feed |
| lifestyle_event_rsvpd | User RSVPs to event |
| lifestyle_content_shared | User shares lifestyle content |
| lifestyle_challenge_joined | User joins challenge |

## Success Metrics
- Broader MAU growth
- More casual visits
- Stronger advertiser relevance
- Broader demographic spread

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Analytics events — Wired in mobile (1 screen) + web (1 page)
