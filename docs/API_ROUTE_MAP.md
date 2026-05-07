# Azeebo+ Public API Route Map

## API Gateway

Base URL: `https://api.azeebo.com`

All endpoints return JSON with the standard envelope:
```json
{
  "success": true,
  "data": {...},
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

Error responses:
```json
{
  "success": false,
  "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": {...} }
}
```

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/signup | Register new user |
| POST | /auth/login | Login with email/password |
| POST | /auth/logout | Logout (invalidate tokens) |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password with token |
| POST | /auth/verify-email | Verify email address |
| POST | /auth/resend-verification | Resend verification email |
| POST | /auth/mfa/enable | Enable MFA |
| POST | /auth/mfa/verify | Verify MFA code |
| POST | /auth/mfa/disable | Disable MFA |

## Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Get current user profile |
| PATCH | /users/me | Update current user profile |
| GET | /users/:id | Get user by ID |
| GET | /users/:id/content | Get user's content |
| POST | /users/:id/follow | Follow a user |
| DELETE | /users/:id/follow | Unfollow a user |
| GET | /users/:id/followers | Get user's followers |
| GET | /users/:id/following | Get users being followed |

## Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /wallet | Get current user's wallet |
| POST | /wallet/fund | Fund wallet |
| POST | /wallet/withdraw | Withdraw funds |
| POST | /wallet/transfer | Transfer to another user |
| GET | /wallet/transactions | Get transaction history |
| GET | /wallet/transactions/:id | Get transaction details |

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/intent | Create payment intent |
| POST | /payments/verify | Verify payment |
| POST | /payments/webhook | Payment provider webhook |
| GET | /payments/:id | Get payment details |
| POST | /payments/refund | Refund payment |

## Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /content | List content (with filters) |
| GET | /content/:id | Get content details |
| POST | /content | Create content (creators) |
| PATCH | /content/:id | Update content |
| DELETE | /content/:id | Delete content |
| GET | /content/:id/comments | Get content comments |
| POST | /content/:id/comments | Add comment |
| GET | /content/:id/analytics | Get content analytics |

## Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /media/upload | Upload media file |
| GET | /media/:id | Get media details |
| DELETE | /media/:id | Delete media |
| POST | /media/:id/process | Trigger processing |

## Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search | Search content |
| GET | /search/suggestions | Get search suggestions |
| GET | /search/trending | Get trending searches |

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | List notifications |
| PATCH | /notifications/:id/read | Mark as read |
| PATCH | /notifications/read-all | Mark all as read |
| GET | /notifications/settings | Get notification settings |
| PATCH | /notifications/settings | Update settings |

## Rewards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /rewards/account | Get reward account |
| POST | /rewards/earn | Record reward activity |
| GET | /rewards/balance | Get points balance |
| GET | /rewards/history | Get reward history |
| POST | /rewards/redeem | Redeem rewards |

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /analytics/events | Track events |
| GET | /analytics/funnels | Get funnel analytics |
| GET | /analytics/cohorts | Get cohort analytics |
| GET | /analytics/kpis | Get universe KPIs |
| GET | /analytics/realtime | Get realtime stats |

## Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /recommendation/content | Get content recommendations |
| GET | /recommendation/creators | Get creator recommendations |
| GET | /recommendation/cross-universe | Get cross-universe recommendations |
| GET | /recommendation/trending | Get trending content |

## Creator Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /creators/onboard | Start creator onboarding |
| GET | /creators/me | Get current creator profile |
| PATCH | /creators/me | Update creator profile |
| GET | /creators/dashboard | Get creator dashboard |
| GET | /creators/stats | Get creator stats |
| GET | /creators/earnings | Get earnings |
| GET | /creators/content | Get creator content |
| POST | /creators/content | Create creator content |
| POST | /creators/payout-request | Request payout |

## Universe-Specific Routes

### Reality

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /reality/shows | List reality shows |
| GET | /reality/shows/:id | Get show details |
| GET | /reality/shows/:id/contestants | Get contestants |
| POST | /reality/shows/:id/vote | Vote for contestant |
| GET | /reality/shows/:id/leaderboard | Get leaderboard |

### Lifestyle

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /lifestyle/feed | Get lifestyle feed |
| GET | /lifestyle/categories | Get categories |
| GET | /lifestyle/trending | Get trending content |

### Movie

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /movies | List movies |
| GET | /movies/:id | Get movie details |
| GET | /movies/cinema-passes | Get cinema passes |
| POST | /movies/rent | Rent a movie |
| GET | /movies/filmmakers | List filmmakers |
| POST | /movies/filmmakers/project | Create project |

### Games

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /games | List games |
| GET | /games/:id | Get game details |
| POST | /games/:id/play | Start game session |
| GET | /games/:id/leaderboard | Get game leaderboard |
| GET | /games/tournaments | List tournaments |
| POST | /games/tournaments/:id/join | Join tournament |

### Comedy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /comedy/specials | List comedy specials |
| GET | /comedy/specials/:id | Get special details |
| GET | /comedy/feed | Get comedy feed |
| POST | /comedy/specials/:id/rate | Rate a special |

### Sports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /sports/fixtures | List fixtures |
| GET | /sports/fixtures/:id | Get fixture details |
| GET | /sports/predictions | Get prediction markets |
| POST | /sports/predictions | Place prediction |
| GET | /sports/fan-contests | Get fan contests |
| POST | /sports/fan-contests/:id/enter | Enter contest |

### Vertical

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /vertical/feed | Get vertical feed |
| GET | /vertical/categories | Get categories |

## Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/users | List all users |
| PATCH | /admin/users/:id | Update user |
| POST | /admin/users/:id/suspend | Suspend user |
| GET | /admin/content | List content (all) |
| PATCH | /admin/content/:id/moderate | Moderate content |
| GET | /admin/moderation/reports | Get reports |
| PATCH | /admin/moderation/reports/:id | Resolve report |
| GET | /admin/analytics | Get admin analytics |
| GET | /admin/audit-logs | Get audit logs |
| GET | /admin/creators/verification | Get verification requests |
| PATCH | /admin/creators/:id/verify | Verify creator |

## Support

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /support/tickets | Create support ticket |
| GET | /support/tickets | List all tickets (admin) |
| GET | /support/tickets/my | Get my tickets |
| GET | /support/tickets/:id | Get ticket by ID |
| PATCH | /support/tickets/:id/status | Update ticket status |
| POST | /support/tickets/:id/messages | Add message to ticket |
| POST | /support/tickets/:id/assign | Assign ticket |
| POST | /support/tickets/:id/escalate | Escalate ticket |
| POST | /support/tickets/:id/close | Close ticket |
| GET | /support/refunds/pending | Get pending refunds (admin) |
| GET | /support/refunds/my | Get my refunds |
| GET | /support/refunds/:id | Get refund by ID |
| PATCH | /support/refunds/:id/process | Process refund (admin) |
| PATCH | /support/refunds/:id/reject | Reject refund (admin) |
| GET | /support/chargebacks/pending | Get pending chargebacks (admin) |
| GET | /support/chargebacks/my | Get my chargebacks |
| POST | /support/chargebacks/:id/evidence | Submit evidence |
| PATCH | /support/chargebacks/:id/resolve | Resolve chargeback (admin) |
| GET | /support/appeals/pending | Get pending appeals (admin) |
| GET | /support/appeals/my | Get my appeals |
| PATCH | /support/appeals/:id/decide | Decide appeal (admin) |
| GET | /support/takedowns/pending | Get pending takedowns (admin) |
| PATCH | /support/takedowns/:id/decide | Decide takedown (admin) |
| GET | /support/disputes/pending | Get pending disputes (admin) |
| GET | /support/disputes/my | Get my disputes (creator) |
| PATCH | /support/disputes/:id/resolve | Resolve dispute (admin) |
| GET | /support/suspensions/active | Get active suspensions (admin) |
| GET | /support/suspensions/my | Get my suspensions |
| POST | /support/suspensions/:id/reinstate | Reinstate user (admin) |
| POST | /support/suspensions/:id/lift | Lift suspension early (admin) |
| GET | /support/dashboard/stats | Get support stats (admin) |
| GET | /support/dashboard/recent | Get recent activity (admin) |

## Query Parameters

Common query parameters across endpoints:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| sort | string | Sort field |
| order | string | Sort order (asc/desc) |
| universe | string | Filter by universe |
| type | string | Filter by content type |
| search | string | Search query |
| startDate | string | Filter start date (ISO 8601) |
| endDate | string | Filter end date (ISO 8601) |

## Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Authentication | 5 requests/minute |
| Search | 30 requests/minute |
| Content API | 100 requests/minute |
| Admin API | 1000 requests/minute |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |