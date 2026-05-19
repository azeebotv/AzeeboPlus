# Azeebo+ API Design Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## API Architecture

### Pattern

- REST APIs for external clients
- Optional internal aggregation in API gateway
- Webhook support for payments and partner events

### Versioning

- All APIs MUST be versioned (`/v1`, `/v2`)
- Version in URL path
- Support backward compatibility

---

## Core API Endpoints

### Auth API

```
POST   /v1/auth/signup           Create account
POST   /v1/auth/login            User login
POST   /v1/auth/logout           End session
POST   /v1/auth/refresh          Refresh token
POST   /v1/auth/verify-otp       Verify OTP
POST   /v1/auth/request-otp      Request OTP
GET    /v1/auth/me               Current user
```

### User API

```
GET    /v1/users/me              Get profile
PATCH  /v1/users/me              Update profile
GET    /v1/users/me/preferences  Get preferences
PUT    /v1/users/me/preferences  Update preferences
GET    /v1/users/me/history      Get watch history
GET    /v1/users/me/saved        Get saved items
POST   /v1/users/me/saved        Save item
DELETE /v1/users/me/saved/{id}   Unsave item
```

### Wallet API

```
GET  /v1/wallet                  Get wallet balance
GET  /v1/wallet/transactions     Get wallet ledger
POST /v1/wallet/fund             Initialize wallet funding
POST /v1/wallet/redeem-reward    Convert reward to wallet
GET  /v1/wallet/summary          Get wallet summary widget
```

### Payments API

```
POST /v1/payments/initialize     Create payment intent
POST /v1/payments/verify         Verify completed payment
POST /v1/payments/webhook        Provider callback endpoint
GET  /v1/payments/history        List payment history
POST /v1/payments/refund-request Create refund request
```

### Rewards API

```
GET  /v1/rewards                 Reward account overview
GET  /v1/rewards/missions        List active missions
GET  /v1/rewards/badges          List badges
GET  /v1/rewards/streak          Current streak
POST /v1/rewards/redeem          Redeem reward
```

### Content API

```
GET /v1/content/home             Home feed content
GET /v1/content/watch            Watch hub feed
GET /v1/content/{id}             Content detail
GET /v1/content/search           Universal search
GET /v1/content/trending         Trending content
GET /v1/content/recommended      Recommended content
```

### Notifications API

```
GET    /v1/notifications         List notifications
PATCH  /v1/notifications/{id}/read    Mark as read
PATCH  /v1/notifications/read-all     Mark all as read
PUT    /v1/notifications/preferences  Update preferences
```

### Analytics API

```
POST /v1/analytics/events        Batch ingest product events
GET  /v1/analytics/me/summary    User analytics summary
```

### Moderation API

```
POST /v1/moderation/report       Report content/user
GET  /v1/moderation/report-types List report types
POST /v1/moderation/appeal       Submit appeal
```

---

## Universe API Endpoints

### Reality Universe

```
GET /v1/reality/shows                    List shows
GET /v1/reality/shows/{showId}           Show detail
GET /v1/reality/shows/{showId}/episodes  Episodes list
GET /v1/reality/shows/{showId}/contestants  Contestants
GET /v1/reality/shows/{showId}/leaderboard Leaderboard
POST /v1/reality/votes                   Submit vote
POST /v1/reality/supervotes              Submit supervote
POST /v1/reality/predictions             Submit prediction
GET /v1/reality/predictions/{showId}     Prediction dashboard
GET /v1/reality/clips                    Reality clips feed
```

### Creator Universe

```
POST /v1/creators/onboard                Creator onboarding
GET  /v1/creators/me                     Creator profile
PATCH /v1/creators/me                    Update profile
POST /v1/creators/uploads                Create upload
GET  /v1/creators/uploads                List own uploads
GET  /v1/creators/discover               Creator discovery
POST /v1/creators/{creatorId}/tips       Send tip
POST /v1/creators/{creatorId}/subscribe  Subscribe
GET  /v1/creators/me/earnings            Earnings dashboard
GET  /v1/creators/me/analytics           Creator analytics
```

### Movie Universe

```
GET  /v1/movies                          Movie catalog
GET  /v1/movies/{movieId}                Movie detail
POST /v1/movies/{movieId}/rent            Rent/unlock movie
GET  /v1/movies/premieres                Premieres list
GET  /v1/movies/watchlist                User watchlist
POST /v1/movies/watchlist                Add to watchlist
DELETE /v1/movies/watchlist/{movieId}    Remove from watchlist
GET  /v1/movies/me/library               Purchased library
```

### Games Universe

```
GET  /v1/games                           Games home
GET  /v1/games/daily-challenge           Daily challenge
POST /v1/games/sessions                  Start game session
POST /v1/games/sessions/{id}/submit      Submit answer
GET  /v1/games/leaderboard               Games leaderboard
GET  /v1/games/tournaments               Tournament list
POST /v1/games/tournaments/{id}/enter    Enter tournament
```

### Sports Universe

```
GET  /v1/sports/home                     Sports home
GET  /v1/sports/highlights               Sports highlights
GET  /v1/sports/events                   Fixtures/events
GET  /v1/sports/predictions              Prediction opportunities
POST /v1/sports/predictions              Submit prediction
GET  /v1/sports/leaderboard              Sports leaderboard
GET  /v1/sports/fan-boards               Fan boards
```

---

## Admin API Endpoints

### Admin Content

```
GET    /v1/admin/content                 List content
POST   /v1/admin/content                 Create content
PATCH  /v1/admin/content/{id}            Update content
POST   /v1/admin/content/{id}/publish    Publish content
POST   /v1/admin/content/{id}/unpublish  Unpublish content
```

### Admin Moderation

```
GET  /v1/admin/moderation/reports        Moderation queue
POST /v1/admin/moderation/reports/{id}/resolve  Resolve report
POST /v1/admin/moderation/actions        Take action
```

### Admin Analytics

```
GET /v1/admin/analytics/dashboard        Executive metrics
GET /v1/admin/analytics/funnels          Funnel metrics
GET /v1/admin/analytics/cohorts          Cohort metrics
GET /v1/admin/analytics/universes/{name} Universe KPIs
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "reason": "must be a valid email"
    }
  }
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Error |

---

## Pagination

### Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Response Headers

- `X-Total-Count` - Total items
- `X-Total-Pages` - Total pages
- `X-Current-Page` - Current page

---

## Rate Limiting

- Default: 100 requests/minute
- Auth endpoints: 10 requests/minute
- Payment endpoints: 20 requests/minute

---

## Prohibited Actions

- No returning sensitive data in responses
- No bypassing authentication
- No hardcoded pricing in responses
- No exposing internal error details