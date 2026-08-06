# Movie Universe — Product Spec

> Source of truth: `doc/AZEEBO MODULAR APP (1).md` Annex F

## Purpose
Launch a premium digital cinema and film access layer.

## Core Features
- Movie storefront
- Premiere access
- Timed viewing
- Rentals / passes
- Watch party hooks
- Loyalty rewards
- Filmmaker dashboard
- Release calendar

## User Types
- Moviegoer
- Filmmaker
- Admin

## UX Logic
**Discover → Reserve → Watch → Rate → Share → Watch Next**

## Key Screens
- Movie home
- Film detail
- Premiere page
- Purchase page
- Library
- Filmmaker dashboard

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /movies | List movies |
| GET | /movies/premieres | List premieres |
| GET | /movies/watchlist | Get watchlist |
| POST | /movies/watchlist | Add to watchlist |
| DELETE | /movies/watchlist/:movieId | Remove from watchlist |
| GET | /movies/:movieId | Get movie details |
| POST | /movies/:movieId/rent | Rent movie |
| GET | /movies/me/library | Get user library |
| GET | /movies/passes | List passes |
| POST | /movies/passes/subscribe | Subscribe to pass |

## Analytics Events
| Event | Trigger |
|-------|---------|
| movie_viewed | User views movie details |
| movie_rented | User rents movie |
| movie_added_watchlist | User adds to watchlist |
| movie_rated | User rates movie |
| movie_shared | User shares movie |

## Success Metrics
- Premium pass purchases
- Repeat film transactions
- Successful digital premieres
- Filmmaker partner interest

## Status
- [x] Backend service implemented
- [x] Mobile screens implemented
- [x] Web pages implemented
- [x] Analytics events — Wired in mobile (2 screens) + web (1 page)
