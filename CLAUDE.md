# Azeebo+ Build Standards

## Overview

Azeebo+ is a multi-universe content platform built with NestJS microservices, Prisma ORM, Next.js, and React Native.

## Architecture Rules

### Service Structure
- Each universe has a dedicated microservice in `services/`
- Shared types are centralized in `packages/shared-types/`
- Services communicate via REST APIs through API Gateway
- Database: PostgreSQL with Prisma ORM
- Cache: Redis for sessions, rate limiting, caching

### Service Ports
| Service | Port | Route Prefix |
|---------|------|--------------|
| auth-service | 3000 | /auth |
| user-service | 3001 | /users |
| wallet-service | 3002 | /wallet |
| payment-service | 3003 | /payment |
| content-service | 3004 | /content |
| media-service | 3019 | /media |
| search-service | 3005 | /search |
| notification-service | 3006 | /notifications |
| reward-service | 3007 | /rewards |
| analytics-service | 3008 | /analytics |
| recommendation-service | 3009 | /recommendation |
| lifestyle-service | 3016 | /lifestyle |
| vertical-service | 3017 | /vertical |
| movie-service | 3011 | /movies |
| games-service | 3012 | /games |
| comedy-service | 3013 | /comedy |
| sports-service | 3014 | /sports |
| reality-service | 3010 | /reality |
| creator-service | 3018 | /creators |
| support-service | 3020 | /support |

## Coding Standards

### Naming Conventions
- **Files**: kebab-case (`user-service.ts`, `auth-controller.ts`)
- **Classes**: PascalCase (`AuthService`, `WalletController`)
- **Interfaces**: PascalCase with `I` prefix for service interfaces (`IAuthService`)
- **Types**: PascalCase (`UserRole`, `PaymentStatus`)
- **Enums**: PascalCase with UPPER_SNAKE_CASE values (`UserRole.ADMIN`)
- **Variables/Functions**: camelCase (`getUserById`, `walletBalance`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Database Tables**: snake_case plural (`wallet_transactions`)
- **Environment Variables**: UPPER_SNAKE_CASE (`DATABASE_URL`)

### Response Envelope
All API responses MUST use the standard envelope from `@azeebo/shared-types`:

```typescript
import { ApiResponseWrapper } from '@azeebo/shared-types';

return ApiResponseWrapper.success(data);
return ApiResponseWrapper.error('ERROR_CODE', 'Human message');
return ApiResponseWrapper.paginated(data, page, limit, total);
```

### API Response Format
```typescript
// Success
{ success: true, data: {...}, meta?: { page, limit, total, totalPages } }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: '...', details?: {...} } }
```

## Analytics Naming

### Event Names (snake_case)
- `screen_view`
- `content_impression`
- `content_click`
- `play_start`
- `play_complete`
- `login`
- `login_success`
- `login_failed`
- `signup`
- `signup_completed`
- `vote_submitted`
- `payment_success`
- `payment_failed`
- `reward_earned`
- `reward_redeemed`
- `creator_follow`
- `creator_tip_sent`
- `prediction_placed`
- `game_started`
- `game_completed`
- `share`
- `notification_received`
- `notification_clicked`

### Universe Names
`reality`, `creator`, `lifestyle`, `vertical`, `movie`, `games`, `comedy`, `sports`

### Platform Values
`web`, `mobile`, `tablet`

## Payment Safety Rules

1. **Never expose provider keys** - All payment operations go through backend services
2. **Webhook verification** - Always verify webhook signatures before processing
3. **Idempotency** - Use payment reference as idempotency key
4. **Amount validation** - Validate amounts server-side, minimum 100 NGN for NGN transactions
5. **Balance consistency** - Use database transactions for wallet operations
6. **No hardcoded prices** - All prices come from database/config, never hardcode
7. **Decimal precision** - Use integers (kobo/kope) for currency, not floats

## Security Requirements

1. **Input validation** - Use class-validator DTOs for all inputs
2. **SQL injection** - Use Prisma parameterized queries only
3. **Authentication** - JWT tokens with refresh token rotation
4. **Authorization** - Role-based guards for admin operations
5. **Rate limiting** - Redis-backed rate limiting on auth endpoints
6. **Secrets** - Never commit secrets, use environment variables
7. **CORS** - Configure allowed origins explicitly
8. **Helmet** - Use helmet middleware for security headers

## Review Checklist

Before submitting a PR, verify:

- [ ] No duplicate shared logic - shared code goes in packages/
- [ ] All states handled - loading, error, empty, success
- [ ] Analytics events added for new features
- [ ] Mobile-first responsive design
- [ ] No hardcoded prices or credentials
- [ ] Payment operations use transactions
- [ ] Unit tests for new services
- [ ] Error codes are descriptive
- [ ] API response uses ApiResponseWrapper
- [ ] No `unknown as` casts - use proper typing
- [ ] Environment variables documented
- [ ] Database migrations created for schema changes

## Module Ownership & Rollout Order

1. **Foundation**: auth, user, wallet, payment, content, media
2. **Universe Phase 1**: Reality, Creator
3. **Universe Phase 2**: Lifestyle, Games
4. **Universe Phase 3**: Comedy, Sports
5. **Universe Phase 4**: Vertical, Movie

## Database Conventions

### Prisma Model Naming
- Models: PascalCase singular (`User`, `WalletTransaction`)
- Fields: camelCase (`createdAt`, `userId`)
- Relations: Use implicit many-to-many where possible
- Indexes: Add indexes on foreign keys and frequently queried fields

### Migration Rules
- Always create migrations, never use `db push` in production
- migrations are service-specific in `services/*/prisma/migrations/`
- Each service has its own schema and migrations
- Shared schema elements via package dependencies

## Testing Requirements

### Unit Tests
- Service layer business logic
- Edge cases and error handling
- Authentication/authorization logic

### Integration Tests
- Database operations with real PostgreSQL
- Redis operations with real Redis
- API endpoint contracts

### E2E Tests
- Critical user journeys only
- Use Playwright for web
- Use Detox for mobile

## Documentation Requirements

- Inline comments for complex logic ("why" not "what")
- README.md in each service with setup instructions
- API documentation via Swagger/OpenAPI
- Keep docs/ structure: product/, design/, engineering/, api/, qa/