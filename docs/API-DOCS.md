# Azeebo+ API Documentation

> Reference for developers integrating with the Azeebo+ platform API.

---

## Base URL and Versioning

All requests go through the API Gateway with URL-based versioning (`/api/v1/`):

| Environment | Base URL |
|-------------|----------|
| Production | `https://azeeboplus.com/api/v1/` |
| Staging | `https://app.azeeboplus.com/api/v1/` |
| Development | `http://localhost:3013/api/v1/` |

---

## Authentication

All authenticated endpoints require a JWT Bearer token:

```
Authorization: Bearer <access_token>
```

- **Login**: `POST /api/v1/auth/login` returns `accessToken` (15 min) and `refreshToken` (7 day)
- **Refresh**: `POST /api/v1/auth/refresh` with `refreshToken` body -- single-use, new pair issued
- **Service-to-service**: Use `X-Internal-Api-Key` header instead of JWT

---

## Rate Limiting

Every response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

| Scope | Limit | Window |
|-------|-------|--------|
| General | 1000 | 1 min |
| Auth | 10 | 1 min |
| Payment | 20 | 1 min |
| Search | 100 | 1 min |
| Upload | 10 | 1 min |

Returns `429 Too Many Requests` when exceeded.

---

## Error Responses

Errors follow **RFC 7807 Problem Details**:

```json
{
  "type": "https://azeeboplus.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email is required",
  "instance": "/api/v1/auth/signup",
  "errors": { "email": "Email is required" }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Malformed request |
| 401 | Missing or invalid token |
| 403 | Not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Service Endpoints Summary

### Core (7 services)

| Service | Prefix | Purpose |
|---------|--------|---------|
| auth-service | `/auth/*`, `/mfa/*`, `/otp/*` | Authentication, JWT, OAuth, MFA, devices |
| user-service | `/users/*`, `/interactions/*`, `/privacy/*` | Profiles, preferences, watchlist, GDPR |
| wallet-service | `/wallet/*` | Balance, fund, withdraw, transfer, ledger |
| payment-service | `/payments/*`, `/webhooks/*`, `/pricing/*` | Paystack/Flutterwave, refunds |
| content-service | `/content/*`, `/categories/*`, `/tags/*` | CRUD, feeds, trending, moderation |
| search-service | `/search/*` | Full-text search, facets, suggestions |
| media-service | `/media/*` | Upload, transcoding, CDN, premium URLs |

### Universe (8 services)

| Service | Prefix | Purpose |
|---------|--------|---------|
| reality-service | `/reality/*` | Shows, episodes, voting, predictions |
| creator-service | `/creators/*` | Onboarding, uploads, analytics, earnings |
| lifestyle-service | `/lifestyle/*`, `/challenges/*`, `/polls/*`, `/quizzes/*` | Events, nightlife, music |
| vertical-service | `/vertical/*` | Storyworlds, characters, lore |
| movie-service | `/movies/*` | Films, premieres, watchlist, rentals |
| games-service | `/games/*` | Games, trivia, tournaments |
| comedy-service | `/comedy/*` | Clips, specials, challenges |
| sports-service | `/sports/*` | Highlights, fixtures, predictions |

### Engagement (6 services)

| Service | Prefix | Purpose |
|---------|--------|---------|
| notification-service | `/notifications/*` | Push, email, SMS, campaigns |
| reward-service | `/rewards/*` | Points, badges, missions, streaks |
| referral-service | `/referrals/*` | Referral codes, tracking |
| messaging-service | `/messaging/*` | Direct messages, conversations |
| engagement-service | `/engagement/*` | Leaderboards, rankings |
| subscription-service | `/subscription/*` | Plans, billing, renewals |

### Operations & Intelligence (5 services)

| Service | Prefix | Purpose |
|---------|--------|---------|
| moderation-service | `/moderation/*` | Reports, appeals, safety scans |
| queue-service | `/queue/*` | Job stats, retry, pause |
| support-service | `/support/*` | Tickets, refunds, disputes |
| analytics-service | `/analytics/*`, `/instrumentation/*`, `/intelligence/*` | Events, funnels, dashboards |
| recommendation-service | `/recommendation/*` | Content recs, personalization |

---

## Generating OpenAPI Specs

Each NestJS service uses `@nestjs/swagger` decorators. The spec is available at runtime.

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Service Name')
  .setVersion('1.0')
  .addBearerAuth()
  .addApiKey({ type: 'apiKey', name: 'X-Internal-Api-Key', in: 'header' }, 'internal')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

Decorate controllers and DTOs with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiProperty` to document endpoints and data shapes.

- JSON spec: `http://localhost:<port>/docs-json`
- Swagger UI: `http://localhost:<port>/docs`
- Aggregated spec: `pnpm run docs:generate` outputs `openapi.json` at project root
