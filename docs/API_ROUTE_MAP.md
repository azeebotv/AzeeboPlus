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
| DELETE | /auth/logout | Logout (invalidate tokens) |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password with token |
| POST | /auth/verify-email | Verify email address |
| POST | /auth/resend-verification | Resend verification email |
| GET | /auth/me | Get authenticated user |
| POST | /auth/mfa/setup | Get MFA setup details |
| POST | /auth/mfa/verify | Verify MFA code |
| POST | /auth/mfa/enable | Enable MFA |
| POST | /auth/mfa/disable | Disable MFA |
| POST | /auth/social/google | Google OAuth login |
| POST | /auth/social/apple | Apple OAuth login |
| POST | /auth/social/unlink | Unlink social account |
| POST | /auth/otp/send | Send OTP |
| POST | /auth/otp/verify | Verify OTP |

## Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/me | Get current user profile |
| PATCH | /users/me | Update current user profile |
| GET | /users/me/preferences | Get user preferences |
| PATCH | /users/me/preferences | Update user preferences |
| GET | /users/me/history | Get viewing history |
| GET | /users/me/saved | Get saved content |
| POST | /users/me/saved | Save content |
| DELETE | /users/me/saved/:contentId | Remove saved content |
| GET | /users/me/universe-affinity | Get universe affinity |
| PATCH | /users/me/universe-affinity | Update universe affinity |
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
| GET | /wallet/transactions | Get transaction history |
| GET | /wallet/summary | Get wallet summary |
| POST | /wallet/fund | Fund wallet |
| POST | /wallet/redeem-reward | Redeem reward points |
| POST | /wallet/bonus-credit | Add bonus credit |
| POST | /wallet/promo-credit | Add promo credit |
| GET | /wallet/audit-trail | Get audit trail |
| POST | /wallet/debit | Debit wallet |
| POST | /wallet/credit | Credit wallet |
| POST | /wallet/withdraw | Withdraw funds |
| POST | /wallet/transfer | Transfer to another user |
| GET | /wallet/transactions/:id | Get transaction details |

## Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments/initialize | Initialize payment |
| POST | /payments/verify | Verify payment |
| GET | /payments/history | Get payment history |
| POST | /payments/webhook | Payment provider webhook |
| POST | /payments/refund-request | Request refund |
| POST | /payments/webhooks/paystack | Paystack webhook |
| POST | /payments/webhooks/flutterwave | Flutterwave webhook |
| GET | /payments/:id | Get payment details |

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

## Caching

Frequently accessed GET endpoints are cached using Redis to improve response times:

| Service | Cached Endpoints | TTL |
|---------|-----------------|-----|
| Content | GET /content, GET /content/home, GET /content/watch, GET /content/trending, GET /content/recommended | 5-10 min |
| Content | GET /content/:id, GET /content/:id/comments, GET /content/search | 2-5 min |
| Reality | GET /reality/shows, GET /reality/shows/:id | 5 min |
| Sports | GET /sports/home, GET /sports/highlights, GET /sports/fixtures, GET /sports/leaderboard | 5 min |

Cache keys include query parameters and are automatically invalidated on related POST/PATCH/DELETE operations.

## Response Sanitization

All API responses are automatically sanitized to remove sensitive fields:
- Passwords, tokens, and secrets are never exposed
- Nested objects are recursively sanitized
- Applied globally via response interceptor

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

## Request/Response Examples

### Authentication

**POST /auth/login**

Request:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "verified": true
    }
  },
  "meta": {}
}
```

**POST /auth/signup**

Request:
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Doe"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_456",
      "email": "newuser@example.com",
      "name": "Jane Doe",
      "role": "user",
      "verified": false
    }
  },
  "meta": {}
}
```

### Wallet

**GET /wallet**

Response:
```json
{
  "success": true,
  "data": {
    "id": "wallet_123",
    "userId": "user_123",
    "balance": 5000.00,
    "currency": "NGN",
    "pendingBalance": 0,
    "bonusBalance": 1000.00,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-05-18T14:45:00Z"
  },
  "meta": {}
}
```

**POST /wallet/fund**

Request:
```json
{
  "amount": 1000.00,
  "currency": "NGN",
  "paymentMethod": "card",
  "metadata": {
    "cardLast4": "4242"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_789",
    "status": "pending",
    "amount": 1000.00,
    "currency": "NGN",
    "authorizationUrl": "https://payment-provider.com/pay/ref123"
  },
  "meta": {}
}
```

**POST /wallet/withdraw**

Request:
```json
{
  "amount": 500.00,
  "bankCode": "001",
  "accountNumber": "1234567890",
  "accountName": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_abc",
    "status": "processing",
    "amount": 500.00,
    "currency": "NGN",
    "estimatedCompletion": "2026-05-19T10:00:00Z"
  },
  "meta": {}
}
```

**POST /wallet/transfer**

Request:
```json
{
  "amount": 200.00,
  "recipientId": "user_456",
  "note": "Payment for services"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_xyz",
    "status": "completed",
    "amount": 200.00,
    "currency": "NGN",
    "recipientId": "user_456",
    "note": "Payment for services"
  },
  "meta": {}
}
```

### Payments

**POST /payments/initialize**

Request:
```json
{
  "amount": 5000.00,
  "currency": "NGN",
  "email": "user@example.com",
  "reference": "unique_ref_123",
  "callbackUrl": "https://client.example.com/callback",
  "metadata": {
    "orderId": "order_789",
    "items": ["item_1", "item_2"]
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "reference": "unique_ref_123",
    "authorizationUrl": "https://paystack.com/pay/unique_ref_123",
    "accessCode": "ACC_abc123",
    "expiresAt": "2026-05-19T18:00:00Z"
  },
  "meta": {}
}
```

**GET /payments/verify?reference=unique_ref_123**

Response:
```json
{
  "success": true,
  "data": {
    "reference": "unique_ref_123",
    "status": "success",
    "amount": 5000.00,
    "currency": "NGN",
    "paidAt": "2026-05-18T15:30:00Z",
    "channel": "card",
    "card": {
      "last4": "4242",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "brand": "Visa"
    }
  },
  "meta": {}
}
```

### Users

**GET /users/me**

Response:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "username": "johndoe",
    "avatar": "https://api.azeebo.com/media/avatar.jpg",
    "bio": "Content creator",
    "verified": true,
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "meta": {}
}
```

**GET /users/me/history?page=1&limit=20**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "contentId": "content_1",
        "contentType": "video",
        "title": "How to Create Content",
        "viewedAt": "2026-05-18T10:30:00Z",
        "duration": 180
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20,
    "hasMore": true
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Content

**GET /content?page=1&limit=20&type=video**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "content_1",
        "title": "How to Create Content",
        "description": "Learn content creation tips",
        "type": "video",
        "thumbnail": "https://api.azeebo.com/media/thumb.jpg",
        "duration": 180,
        "creatorId": "user_456",
        "creatorName": "Jane Doe",
        "views": 15000,
        "likes": 2300,
        "createdAt": "2026-05-15T08:00:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**POST /content/:id/comments**

Request:
```json
{
  "content": "Great video! Very informative.",
  "parentId": null
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "comment_123",
    "content": "Great video! Very informative.",
    "userId": "user_123",
    "userName": "John Doe",
    "userAvatar": "https://api.azeebo.com/media/avatar.jpg",
    "parentId": null,
    "likes": 0,
    "createdAt": "2026-05-18T15:00:00Z"
  },
  "meta": {}
}
```

### Search

**GET /search?q=content+creation&page=1&limit=10**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "content_1",
        "title": "How to Create Content",
        "type": "video",
        "score": 0.95
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "hasMore": true
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Notifications

**GET /notifications?page=1&limit=20**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif_123",
        "type": "like",
        "title": "Someone liked your content",
        "message": "Jane Doe liked your video",
        "contentId": "content_1",
        "read": false,
        "createdAt": "2026-05-18T14:30:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "hasMore": false
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

### Admin

**GET /admin/users?page=1&limit=20**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user_123",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "user",
        "verified": true,
        "status": "active",
        "createdAt": "2026-01-15T10:30:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "meta": {}
}
```

**PATCH /admin/users/:id**

Request:
```json
{
  "name": "John Updated",
  "role": "creator"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Updated",
    "role": "creator",
    "verified": true,
    "status": "active",
    "updatedAt": "2026-05-19T10:00:00Z"
  },
  "meta": {}
}
```

**POST /admin/users/:id/suspend**

Request:
```json
{
  "reason": "Violation of terms of service",
  "duration": "7 days"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "status": "suspended",
    "reason": "Violation of terms of service",
    "suspendedUntil": "2026-05-26T10:00:00Z",
    "suspendedAt": "2026-05-19T10:00:00Z"
  },
  "meta": {}
}
```

**PATCH /admin/content/:id/moderate**

Request:
```json
{
  "action": "reject",
  "reason": "Contains prohibited content"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "contentId": "content_123",
    "status": "rejected",
    "reason": "Contains prohibited content",
    "moderatedBy": "admin_456",
    "moderatedAt": "2026-05-19T10:00:00Z"
  },
  "meta": {}
}
```

**GET /admin/audit-logs?page=1&limit=50**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "audit_789",
        "action": "user.suspend",
        "actorId": "admin_456",
        "targetId": "user_123",
        "targetType": "user",
        "details": {
          "reason": "Violation of terms of service"
        },
        "ipAddress": "192.168.1.1",
        "timestamp": "2026-05-19T10:00:00Z"
      }
    ],
    "total": 500,
    "page": 1,
    "limit": 50,
    "totalPages": 10
  },
  "meta": {}
}
```

### Support

**POST /support/tickets**

Request:
```json
{
  "subject": "Payment not received",
  "category": "payment",
  "priority": "high",
  "description": "I made a payment 2 hours ago but my wallet was not funded",
  "metadata": {
    "transactionId": "txn_123"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "ticket_456",
    "subject": "Payment not received",
    "category": "payment",
    "priority": "high",
    "status": "open",
    "createdBy": "user_123",
    "assignedTo": null,
    "createdAt": "2026-05-19T10:00:00Z",
    "updatedAt": "2026-05-19T10:00:00Z"
  },
  "meta": {}
}
```

**GET /support/tickets/my?page=1&limit=20**

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ticket_456",
        "subject": "Payment not received",
        "category": "payment",
        "priority": "high",
        "status": "open",
        "assignedTo": "agent_789",
        "createdAt": "2026-05-19T10:00:00Z",
        "updatedAt": "2026-05-19T10:30:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "meta": {}
}
```

**POST /support/tickets/:id/messages**

Request:
```json
{
  "message": "Here is the transaction reference: txn_123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "msg_789",
    "ticketId": "ticket_456",
    "senderId": "user_123",
    "senderType": "user",
    "message": "Here is the transaction reference: txn_123",
    "createdAt": "2026-05-19T10:30:00Z"
  },
  "meta": {}
}
```

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "expected": "Valid email address",
      "received": "invalid-email"
    }
  },
  "meta": {}
}
```

## Schema Definitions

### User
```json
{
  "id": "string",
  "email": "string (email)",
  "name": "string",
  "username": "string",
  "role": "user | creator | admin | super_admin",
  "avatar": "string (URL)",
  "bio": "string (optional)",
  "verified": "boolean",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Wallet
```json
{
  "id": "string",
  "userId": "string",
  "balance": "number (decimal)",
  "currency": "string (3-letter code)",
  "pendingBalance": "number (decimal)",
  "bonusBalance": "number (decimal)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Transaction
```json
{
  "id": "string",
  "walletId": "string",
  "type": "fund | withdraw | transfer | debit | credit",
  "amount": "number (decimal)",
  "currency": "string (3-letter code)",
  "status": "pending | processing | completed | failed | cancelled",
  "reference": "string",
  "metadata": "object (optional)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### Content
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "type": "video | audio | article | image",
  "thumbnail": "string (URL)",
  "duration": "number (seconds, optional)",
  "creatorId": "string",
  "creatorName": "string",
  "views": "number",
  "likes": "number",
  "status": "draft | published | archived",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```
