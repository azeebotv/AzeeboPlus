# Hardcoded Values Audit - Azeebo+ Project

**Audit Date:** 2026  
**Severity Levels:** CRITICAL | HIGH | MEDIUM | LOW

---

## Executive Summary

This document catalogs all hardcoded values found in the Azeebo+ codebase, organized by severity and type. The audit identified **120+ instances** across 8 categories requiring remediation.

---

## Category 1: Secrets & Credentials (CRITICAL)

### 1.1 Development Environment Secrets in .env

**Severity:** CRITICAL  
**Location:** `.env` (root)

| Line | Hardcoded Value | Issue |
|------|-----------------|-------|
| 5 | `DATABASE_URL=postgresql://postgres:azeebo_dev_password@localhost:5432/azeebo_plus_dev` | Hardcoded database password |
| 9 | `DATABASE_PASSWORD=azeebo_dev_password` | Plaintext password |
| 12 | `POSTGRES_PASSWORD=azeebo_dev_password` | Plaintext password |
| 21 | `JWT_SECRET=azeebo_plus_dev_jwt_secret_key_must_be_at_least_32_characters_long_for_security` | Hardcoded JWT secret |
| 32 | `PAYSTACK_SECRET_KEY=sk_test_mock_key_for_development` | Mock payment key |
| 33 | `PAYSTACK_PUBLIC_KEY=pk_test_mock_key_for_development` | Mock payment key |
| 34 | `FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_mock_key_for_development` | Mock payment key |
| 35 | `FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_mock_key_for_development` | Mock payment key |
| 38 | `SENDGRID_API_KEY=SG.mock_key_for_development_only` | Mock API key |
| 39 | `TWILIO_ACCOUNT_SID=AC_mock_account_sid_for_development` | Mock credentials |
| 40 | `TWILIO_AUTH_TOKEN=mock_auth_token_for_development` | Mock credentials |
| 45 | `AWS_ACCESS_KEY_ID=mock_access_key_for_development` | Mock AWS credentials |
| 46 | `AWS_SECRET_ACCESS_KEY=mock_secret_key_for_development` | Mock AWS credentials |
| 70 | `SESSION_SECRET=azeebo_plus_dev_session_secret_key_must_be_secure` | Hardcoded session secret |
| 73 | `WEBHOOK_SECRET=azeebo_plus_dev_webhook_secret_key` | Hardcoded webhook secret |

**Remediation:**
- Use `.env.example` as template (already exists)
- Never commit `.env` files (already in `.gitignore` ✓)
- Use secrets manager (HashiCorp Vault, AWS Secrets Manager) for production
- Rotate all development secrets immediately

---

### 1.2 Web App Environment Secrets

**Severity:** CRITICAL  
**Location:** `apps/web/.env`

| Line | Hardcoded Value | Issue |
|------|-----------------|-------|
| 10 | `NEXT_PUBLIC_IMAGE_API_URL=https://neeko-copilot.bytedance.net/api/text2image` | External API URL hardcoded |
| 19 | `NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key` | Placeholder Stripe key |
| 22 | `NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key` | Placeholder Firebase key |
| 23 | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com` | Placeholder Firebase config |
| 24 | `NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id` | Placeholder Firebase config |
| 27 | `NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn` | Placeholder Sentry DSN |

**Remediation:**
- Move all API keys to environment variables
- Use `.env.local` for local development (already gitignored)
- Create proper `.env.example` template for web app

---

### 1.3 Fallback Secrets in Source Code

**Severity:** CRITICAL  
**Location:** Multiple services

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/support-service/src/common/common.module.ts` | 10 | `secret: process.env.JWT_SECRET \|\| 'development-secret'` |
| `services/user-service/src/modules/admin/admin.module.ts` | 12 | `secret: process.env.JWT_SECRET \|\| 'secret'` |
| `services/referral-service/src/main.ts` | 13 | `origin: process.env.CORS_ORIGIN \|\| '*'` |

**Remediation:**
- **NEVER** provide fallback values for secrets
- Use `configService.getOrThrow()` to fail fast if secrets are missing
- Add validation in `main.ts` to check required environment variables before startup

**Code Fix Example:**
```typescript
// ❌ BAD
secret: process.env.JWT_SECRET || 'development-secret'

// ✅ GOOD
secret: configService.getOrThrow<string>('JWT_SECRET')
```

---

### 1.4 Docker Compose Default Passwords

**Severity:** CRITICAL  
**Location:** `docker-compose.yml` (lines 21-42)

All 22 service database passwords have hardcoded fallback values:

```yaml
AUTH_DB_PASSWORD: ${AUTH_DB_PASSWORD:-auth_dev_password}
USER_DB_PASSWORD: ${USER_DB_PASSWORD:-user_dev_password}
WALLET_DB_PASSWORD: ${WALLET_DB_PASSWORD:-wallet_dev_password}
PAYMENT_DB_PASSWORD: ${PAYMENT_DB_PASSWORD:-payment_dev_password}
CONTENT_DB_PASSWORD: ${CONTENT_DB_PASSWORD:-content_dev_password}
# ... 17 more services with similar pattern
```

**Remediation:**
- Remove all default password fallbacks
- Use `:-` syntax only for non-sensitive defaults
- Document required environment variables in `README.md`
- Add pre-flight checks to validate all secrets are set

**Code Fix:**
```yaml
# ❌ BAD
environment:
  AUTH_DB_PASSWORD: ${AUTH_DB_PASSWORD:-auth_dev_password}

# ✅ GOOD
environment:
  AUTH_DB_PASSWORD: ${AUTH_DB_PASSWORD:?AUTH_DB_PASSWORD must be set}
```

---

### 1.5 PgBouncer Userlist with Placeholder Passwords

**Severity:** HIGH  
**Location:** `infra/config/pgbouncer_userlist.txt` (all 23 lines)

```
"postgres" "CHANGE_ME_MASTER_PASSWORD"
"auth_user" "CHANGE_ME_AUTH_DB_PASSWORD"
"user_user" "CHANGE_ME_USER_DB_PASSWORD"
# ... 20 more users with CHANGE_ME_* passwords
```

**Remediation:**
- Generate this file from environment variables during deployment
- Never commit actual passwords
- Add to `.gitignore` if needed for local development
- Use init scripts to populate from secrets manager

---

### 1.6 Test Files with Hardcoded Secrets

**Severity:** MEDIUM  
**Location:** Test specifications

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/auth-service/src/modules/auth/auth.service.spec.ts` | 42-43 | `process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-for-access-tokens-min-32-chars'` |
| `services/auth-service/src/modules/auth/auth.integration.spec.ts` | 31-32 | `process.env.JWT_SECRET = 'test-jwt-secret-for-integration'` |
| `services/auth-service/src/modules/auth/auth.contract.spec.ts` | 41-42 | `process.env.JWT_SECRET = 'test-jwt-secret'` |
| `services/sports-service/src/modules/fan-contests/fan-contests.contract.spec.ts` | 14 | `process.env.JWT_SECRET = 'test-jwt-secret'` |
| `services/sports-service/src/modules/prediction-markets/prediction-markets.contract.spec.ts` | 14 | `process.env.JWT_SECRET = 'test-jwt-secret'` |
| `services/movie-service/src/modules/movies/movies.contract.spec.ts` | 22 | `process.env.JWT_SECRET = 'test-jwt-secret'` |
| `services/vertical-service/src/modules/universe/universe.contract.spec.ts` | 20 | `process.env.JWT_SECRET = 'test-jwt-secret'` |
| `services/content-service/src/modules/content/content.contract.spec.ts` | 26 | `process.env.JWT_SECRET = 'test-jwt-secret'` |

**Remediation:**
- Use test fixtures in `packages/test-utils`
- Create `.env.test` files (gitignored)
- Use `jest-setup.ts` to configure test environment
- Ensure test secrets are clearly marked as test-only

---

### 1.7 E2E Test Credentials

**Severity:** LOW  
**Location:** E2E test files

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `apps/web/e2e/core-journeys.spec.ts` | 9-312 | `password: 'Password123!'` (14 occurrences) |
| `apps/web/e2e/core-journeys.spec.ts` | 248 | `password: 'Admin123!'` |
| `apps/web/e2e/auth.spec.ts` | 43 | `password: 'password123'` |
| `apps/mobile/src/api/auth.api.spec.ts` | 31 | `password: 'password123'` |
| `apps/mobile/src/api/auth.api.spec.js` | 28-63 | `password: 'password123'` (4 occurrences) |

**Remediation:**
- Use test user factories
- Store test credentials in test configuration files
- Document that these are test-only credentials
- Consider using OAuth test tokens instead

---

## Category 2: Hardcoded URLs (HIGH)

### 2.1 Localhost URL Fallbacks in Services

**Severity:** HIGH  
**Location:** Service main.ts and service files

#### CORS Origin Fallbacks (25+ occurrences):

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/auth-service/src/main.ts` | 84 | `\|\| ['http://localhost:3000']` |
| `services/user-service/src/main.ts` | 46 | `\|\| ['http://localhost:3000']` |
| `services/wallet-service/src/main.ts` | 46 | `\|\| ['http://localhost:3000']` |
| `services/content-service/src/main.ts` | 44 | `\|\| ['http://localhost:3000']` |
| `services/movie-service/src/main.ts` | 44 | `\|\| ['http://localhost:3000']` |
| `services/search-service/src/main.ts` | 44 | `\|\| ['http://localhost:3000']` |
| `services/analytics-service/src/main.ts` | 45 | `\|\| ['http://localhost:3000']` |
| `services/games-service/src/main.ts` | 44 | `\|\| ['http://localhost:3000']` |
| `services/reality-service/src/main.ts` | 44 | `\|\| ['http://localhost:3000']` |
| `services/vertical-service/src/main.ts` | 43 | `\|\| ['http://localhost:3000']` |
| `services/lifestyle-service/src/main.ts` | 45 | `\|\| ['http://localhost:3000']` |
| `services/queue-service/src/main.ts` | 132 | `\|\| ['http://localhost:3000']` |
| `services/sports-service/src/main.ts` | 43 | `\|\| ['http://localhost:3000']` |

**Remediation:**
- Remove all localhost fallbacks
- Require `ALLOWED_ORIGINS` environment variable
- Fail fast if CORS origins not configured
- Use environment-specific configuration

#### Service-to-Service URL Fallbacks (24+ occurrences):

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/sports-service/src/modules/sports/sports.service.ts` | 15-16 | `ANALYTICS_SERVICE_URL \|\| 'http://localhost:3008'`, `WALLET_SERVICE_URL \|\| 'http://localhost:3006'` |
| `services/games-service/src/modules/games/games.service.ts` | 9 | `ANALYTICS_SERVICE_URL \|\| 'http://localhost:3008'` |
| `services/reality-service/src/modules/reality/reality.service.ts` | 32-33 | `WALLET_SERVICE_URL \|\| 'http://localhost:3006'`, `ANALYTICS_SERVICE_URL \|\| 'http://localhost:3008'` |
| `services/creator-service/src/modules/creators/creators.service.ts` | 46-48 | `WALLET_SERVICE_URL \|\| 'http://localhost:3002'`, `MEDIA_SERVICE_URL \|\| 'http://localhost:3019'`, `ANALYTICS_SERVICE_URL \|\| 'http://localhost:3008'` |
| `services/payment-service/src/modules/payments/payments.service.ts` | 32-33 | `ANALYTICS_SERVICE_URL \|\| 'http://localhost:3008'`, `WALLET_SERVICE_URL \|\| 'http://localhost:3002'` |
| `services/comedy-service/src/modules/comedy/comedy.service.ts` | 14 | `ANALYTICS_SERVICE_URL \|\| 'http://localhost:3008'` |
| `services/support-service/src/modules/chargeback/chargeback.service.ts` | 10-18 | `PAYMENT_SERVICE_URL \|\| 'http://localhost:3003'`, `WALLET_SERVICE_URL \|\| 'http://localhost:3002'`, `MODERATION_SERVICE_URL \|\| 'http://localhost:3006'` |
| `services/support-service/src/modules/takedown/takedown.service.ts` | 10-14 | `CONTENT_SERVICE_URL \|\| 'http://localhost:3004'`, `MODERATION_SERVICE_URL \|\| 'http://localhost:3006'` |
| `services/support-service/src/modules/suspension/suspension.service.ts` | 9-13 | `NOTIFICATION_SERVICE_URL \|\| 'http://localhost:3006'`, `MODERATION_SERVICE_URL \|\| 'http://localhost:3006'` |
| `services/support-service/src/modules/appeal/appeal.service.ts` | 10-18 | `CONTENT_SERVICE_URL \|\| 'http://localhost:3004'`, `MODERATION_SERVICE_URL \|\| 'http://localhost:3006'`, `USER_SERVICE_URL \|\| 'http://localhost:3001'` |
| `services/content-service/src/modules/content/content.service.ts` | 29 | `'http://localhost:3004'` |

**Remediation:**
- Create service discovery mechanism (Consul, Kubernetes DNS)
- Remove all localhost fallbacks
- Use `configService.getOrThrow()` for required service URLs
- Add health checks to validate service connectivity at startup

---

### 2.2 Database Connection String Fallbacks

**Severity:** HIGH  
**Location:** Service prisma.service.ts files

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/auth-service/src/modules/database/prisma.service.ts` | 13 | `DATABASE_URL \|\| 'postgresql://localhost:5432/azeebo'` |
| `services/user-service/src/modules/database/prisma.service.ts` | 13 | `DATABASE_URL \|\| 'postgresql://localhost:5432/azeebo'` |
| `services/wallet-service/src/modules/database/prisma.service.ts` | 13 | `DATABASE_URL \|\| 'postgresql://localhost:5432/azeebo'` |
| `services/payment-service/src/modules/database/prisma.service.ts` | 13 | `DATABASE_URL \|\| 'postgresql://localhost:5432/azeebo'` |
| `services/content-service/src/modules/database/prisma.service.ts` | 13 | `DATABASE_URL \|\| 'postgresql://localhost:5432/azeebo'` |

**Remediation:**
```typescript
// ❌ BAD
const databaseUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/azeebo');

// ✅ GOOD
const databaseUrl = new URL(configService.getOrThrow<string>('DATABASE_URL'));
```

---

### 2.3 Redis URL Fallbacks

**Severity:** HIGH  
**Location:** Service redis.service.ts files

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/shared/src/redis/redis.service.ts` | 9 | `REDIS_URL \|\| 'redis://localhost:6379'` |
| `services/auth-service/src/common/services/redis.service.ts` | 9 | `REDIS_URL \|\| 'redis://localhost:6379'` |
| `services/comedy-service/src/common/services/redis.service.ts` | 10 | `REDIS_URL \|\| 'redis://localhost:6379'` |
| `services/reality-service/src/common/services/redis.service.ts` | 9 | `REDIS_URL \|\| 'redis://localhost:6379'` |
| `services/payment-service/src/common/services/redis.service.ts` | 10 | `REDIS_URL \|\| 'redis://localhost:6379'` |
| `services/media-service/src/common/services/redis.service.ts` | 9 | `REDIS_URL \|\| 'redis://localhost:6379'` |
| `services/api-gateway/src/app.module.ts` | 34 | `REDIS_URL \|\| 'redis://localhost:6379'` |

**Remediation:**
- Remove all localhost Redis fallbacks
- Use `configService.getOrThrow()` for required Redis connections
- Add Redis health checks at startup

---

### 2.4 Frontend Localhost URLs

**Severity:** HIGH  
**Location:** Frontend apps

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `apps/mobile/src/api/client.ts` | 15 | `baseURL: Constants.expoConfig?.extra?.apiBaseURL \|\| 'http://localhost:3013'` |
| `apps/web/src/lib/api.ts` | 3 | `API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/lib/api.js` | 5 | `API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/reality/episodes/page.tsx` | 39 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/reality/episode/page.tsx` | 43, 105 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/reality/results/page.tsx` | 43 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/reality/super-vote/page.tsx` | 74, 82, 139 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/reality/contestant/page.tsx` | 43 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/settings/devices/page.tsx` | 27, 50 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/premium/page.tsx` | 36, 40, 80, 109 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3013'` |
| `apps/web/src/app/onboarding/page.tsx` | 39 | `process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3000'` |
| `apps/creator-portal/src/main.ts` | 39 | `'http://localhost:3014'` |
| `apps/creator-portal/src/api/clients/content-client.service.ts` | 51 | `'http://localhost:3001'` |
| `apps/admin/src/main.ts` | 38 | `\|\| ['http://localhost:3016']` |

**Remediation:**
- Remove all localhost fallbacks
- Use environment-specific configuration
- Add build-time validation for required environment variables
- Consider using Next.js `env.mjs` for type-safe environment variables

---

### 2.5 External Third-Party URLs

**Severity:** HIGH  
**Location:** Frontend apps

#### ByteDance AI Image Generation URLs (25+ occurrences):

| File | Lines | URL Pattern |
|------|-------|-------------|
| `apps/mobile/app/watch/movie-detail.tsx` | 25, 112-116 | `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...` |
| `apps/mobile/app/watch/movie-detail.js` | 42, 87-91 | Same URLs (compiled duplicate) |
| `apps/web/src/app/games/page.tsx` | 13, 23, 33 | `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...` |
| `apps/web/src/app/games/page.js` | 41, 51, 61 | Same URLs (compiled duplicate) |
| `apps/web/src/app/reality/page.tsx` | 14, 24, 34 | `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...` |
| `apps/web/src/app/reality/page.js` | 41, 51, 61 | Same URLs (compiled duplicate) |
| `apps/web/src/app/movies/page.tsx` | 13, 24 | `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...` |
| `apps/web/src/app/vertical/page.tsx` | 13, 23, 33 | `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...` |
| `apps/web/src/app/vertical/page.js` | 41, 51, 61 | Same URLs (compiled duplicate) |

**Issues:**
- External third-party API hardcoded (not in environment variables)
- ByteDance AI image generation service (unreliable, may be discontinued)
- No fallback mechanism
- URLs contain prompts (not configurable)

**Remediation:**
- Move base URL to environment variable: `NEXT_PUBLIC_IMAGE_API_URL`
- Store prompts in database or configuration file
- Add fallback to placeholder images or CDN
- Implement proper image generation service with caching

**Code Fix:**
```typescript
// ❌ BAD
thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=...'

// ✅ GOOD
thumbnail: `${process.env.NEXT_PUBLIC_IMAGE_API_URL}?prompt=${encodeURIComponent(content.prompt)}`
```

---

#### Placeholder Image URLs (10+ occurrences):

| File | Lines | URL |
|------|-------|-----|
| `apps/mobile/app/(reality)/episodes.tsx` | 66, 77, 88, 99, 115 | `https://via.placeholder.com/300x170` |
| `apps/web/src/app/reality/episodes/page.tsx` | 64, 75, 86, 97, 113 | `https://via.placeholder.com/300x170` |
| `packages/ui/src/Feedback.stories.tsx` | 96 | `https://via.placeholder.com/48` |
| `packages/ui/src/Card.stories.tsx` | 91, 105, 122 | `https://via.placeholder.com/400x225`, `https://via.placeholder.com/800x450` |

**Remediation:**
- Use local placeholder images in `/public` directory
- Use Next.js `next/image` with built-in placeholders
- Implement proper image fallback strategy

---

### 2.6 AWS Region Fallbacks

**Severity:** MEDIUM  
**Location:** Service files

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/content-service/src/modules/media/transcoding.service.ts` | 19 | `AWS_REGION \|\| 'us-east-1'` |
| `services/content-service/src/modules/media/media.service.ts` | 17 | `AWS_REGION \|\| 'us-east-1'` |
| `services/media-service/src/modules/upload/s3.service.ts` | 59 | `AWS_REGION \|\| 'us-east-1'` |

**Remediation:**
- Remove fallback or use region-agnostic configuration
- Use `configService.getOrThrow()` for required AWS configuration

---

### 2.7 Email Address Fallbacks

**Severity:** LOW  
**Location:** Email services

| File | Line | Hardcoded Value |
|------|------|-----------------|
| `services/queue-service/src/modules/email/email.service.ts` | 119, 148 | `SENDGRID_FROM_EMAIL, 'no-reply@azeebo.plus'` |
| `services/notification-service/src/modules/email/email.service.ts` | 120, 149 | `SENDGRID_FROM_EMAIL, 'no-reply@azeebo.com'` |

**Issues:**
- Inconsistent email domains (`.plus` vs `.com`)
- Hardcoded fallback emails

**Remediation:**
- Standardize on one email domain
- Remove fallback, require environment variable
- Add email configuration validation

---

## Category 3: Hardcoded Prices (MEDIUM)

### 3.1 Mobile App Hardcoded Prices

**Severity:** MEDIUM  
**Location:** `apps/mobile/app/`

| File | Lines | Hardcoded Values |
|------|-------|------------------|
| `apps/mobile/app/movies/[id].tsx` | 34-36 | `₦500`, `₦1,500`, `₦4,500/mo` |
| `apps/mobile/app/movies/index.tsx` | 35-36, 81, 119 | `₦2,500`, `₦4,500`, `₦500` |
| `apps/mobile/app/(tabs)/wallet/add-funds.tsx` | 41, 43, 205-206 | `₦100`, `₦1,000,000` |
| `apps/mobile/app/(tabs)/wallet/withdraw.tsx` | 42, 281 | `₦500` |
| `apps/mobile/app/watch/[id].tsx` | 41-43, 61 | `₦200`, `₦1,000`, `₦2,500` |
| `apps/mobile/app/reality/show.tsx` | 24-27 | `price: 100, 450, 850, 4000` |
| `apps/mobile/app/(reality)/super-vote.tsx` | 50, 57, 65, 72 | `price: 100, 450, 800, 1800` |
| `apps/mobile/app/vote.tsx` | 46-49 | `price: 100, 450, 850, 4000` |

**Remediation:**
- Fetch prices from backend API or configuration service
- Store pricing in database with currency support
- Implement dynamic pricing configuration
- Use constants file for development/testing only

**Code Fix:**
```typescript
// ❌ BAD
{ id: '1', type: 'Rent (48h)', price: '₦500' }

// ✅ GOOD
const pricing = await api.pricing.getMovieRental();
// { id: '1', type: 'Rent (48h)', price: 500, currency: 'NGN' }
```

---

### 3.2 Web App Hardcoded Prices

**Severity:** MEDIUM  
**Location:** `apps/web/src/app/`

| File | Lines | Hardcoded Values |
|------|-------|------------------|
| `apps/web/src/app/reality/page.tsx` | 13 | `₦100 million` |
| `apps/web/src/app/notifications/page.tsx` | 37 | `₦5,000` |
| `apps/web/src/app/wallet/add-funds/page.tsx` | 32, 37, 247-248 | `₦100`, `₦1,000,000` |
| `apps/web/src/app/wallet/withdraw/page.tsx` | 29 | `₦500` |
| `apps/web/src/app/reality/super-vote/page.tsx` | 39, 46, 54, 61 | `price: 100, 450, 800, 1800` |

**Remediation:**
- Same as mobile app - fetch from API
- Use environment variables for configuration
- Implement pricing service with admin UI

---

## Category 4: Hardcoded Port Numbers (MEDIUM)

### 4.1 Service Port Fallbacks

**Severity:** MEDIUM  
**Location:** Service main.ts files (23 services)

| File | Line | Port |
|------|------|------|
| `services/auth-service/src/main.ts` | 105-106 | `3000` |
| `services/user-service/src/main.ts` | 64 | `3001` |
| `services/wallet-service/src/main.ts` | 64 | `3002` |
| `services/content-service/src/main.ts` | 61 | `3003` |
| `services/search-service/src/main.ts` | 49 | `3008` |
| `services/reward-service/src/main.ts` | 49 | `3008` |
| `services/analytics-service/src/main.ts` | 64 | `3012` |
| `services/notification-service/src/main.ts` | 64 | `3012` |
| `services/reality-service/src/main.ts` | 57 | `3014` |
| `services/moderation-service/src/main.ts` | 64 | `3014` |
| `services/queue-service/src/main.ts` | 139 | `3015` |
| `services/lifestyle-service/src/main.ts` | 62 | `3016` |
| `services/vertical-service/src/main.ts` | 48 | `3017` |
| `services/movie-service/src/main.ts` | 61 | `3017` |
| `services/games-service/src/main.ts` | 61 | `3018` |
| `services/messaging-service/src/main.ts` | 31 | `3018` |
| `services/media-service/src/main.ts` | 58 | `3019` |
| `services/engagement-service/src/main.ts` | 25 | `3019` |
| `services/referral-service/src/main.ts` | 36 | `3010` |
| `services/sports-service/src/main.ts` | 48 | `3020` |
| `services/support-service/src/main.ts` | 85 | `3020` |
| `services/subscription-service/src/main.ts` | 22 | `3020` |
| `services/api-gateway/src/main.ts` | 62 | `3000` |

**Remediation:**
- Port fallbacks are acceptable for development
- Document port assignments in `README.md`
- Use port registry configuration for production
- Add validation to prevent port conflicts

---

## Category 5: Code Quality Issues (MEDIUM)

### 5.1 Math.random() in Business Logic

**Severity:** MEDIUM  
**Location:** Multiple files

| File | Line | Context |
|------|------|---------|
| `services/auth-service/src/modules/auth/otp/otp.service.ts` | 12 | `Math.floor(100000 + Math.random() * 900000)` - OTP generation |
| `services/auth-service/src/modules/auth/mfa/mfa.service.ts` | 75 | `Math.random().toString(36).slice(2, 8)` - Backup code generation |
| `services/moderation-service/src/modules/moderation/safety-scanning.service.ts` | 395, 424, 434, 469-470 | Mock risk calculations |
| `services/media-service/src/modules/upload/s3.service.ts` | 210, 214 | Mock video/audio duration |
| `apps/mobile/app/(tabs)/_layout.tsx` | 50 | `Math.random() > 0.3` - Live status |
| `apps/mobile/src/utils/performance.ts` | 35 | `Math.random().toString(36).substr(2, 9)` - ID generation |
| `apps/web/src/app/creators/page.tsx` | 51 | `Math.floor(Math.random() * 100000)` - Mock view count |
| `apps/web/src/app/library/page.tsx` | 40 | `Math.floor(Math.random() * 100)` - Mock progress |

**Issues:**
- OTP generation using `Math.random()` is cryptographically insecure
- Mock data in production code
- Unpredictable behavior in business logic

**Remediation:**
```typescript
// ❌ BAD (insecure OTP)
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// ✅ GOOD (cryptographically secure)
import { randomInt } from 'crypto';
const otp = randomInt(100000, 999999).toString();
```

- Replace all `Math.random()` in security contexts with `crypto.randomInt()`
- Move mock data to test fixtures
- Use deterministic algorithms for business logic

---

### 5.2 Console.log Statements in Production Code

**Severity:** LOW  
**Location:** Multiple files

#### Mobile App (25+ occurrences):
| File | Lines |
|------|-------|
| `apps/mobile/app/rankings.tsx` | 42 |
| `apps/mobile/app/messages.tsx` | 50, 64, 80 |
| `apps/mobile/app/(tabs)/home.tsx` | 62 |
| `apps/mobile/app/reality/[showId]/live-chat.tsx` | 61, 76 |
| `apps/mobile/app/(creator)/drafts.tsx` | 42 |
| `apps/mobile/app/premium.tsx` | 68 |
| `apps/mobile/app/settings/devices.tsx` | 39 |
| `apps/mobile/app/(tabs)/referral.tsx` | 56, 71 |
| `apps/mobile/app/(tabs)/wallet/subscription-plans.tsx` | 54 |
| `apps/mobile/app/(tabs)/profile.tsx` | 65, 68 |
| `apps/mobile/app/predictions/[predictionId]/results.tsx` | 48 |
| `apps/mobile/app/(creator)/earnings.tsx` | 49 |
| `apps/mobile/app/recommendations.tsx` | 38 |
| `apps/mobile/app/(tabs)/transactions.tsx` | 60 |
| `apps/mobile/app/(tabs)/settings.tsx` | 50 |
| `apps/mobile/app/leaderboard.tsx` | 46 |
| `apps/mobile/app/transactions/[transactionId].tsx` | 48 |
| `apps/mobile/app/(creator)/scheduled.tsx` | 40 |
| `apps/mobile/app/(creator)/published.tsx` | 42 |
| `apps/mobile/app/(creator)/profile.tsx` | 60 |

#### Web App (25+ occurrences):
| File | Lines |
|------|-------|
| `apps/web/src/hooks/usePWA.ts` | 29, 32 |
| `apps/web/src/lib/performance.js` | 37, 57, 78, 98, 120, 155, 160 |
| `apps/web/src/lib/performance.ts` | 51, 71, 92, 112, 134, 166, 172 |
| `apps/web/src/lib/analytics.ts` | 19 |
| `apps/web/src/lib/analytics.js` | 13 |
| `apps/web/src/context/AuthContext.tsx` | 193 |
| `apps/web/src/app/premium/page.tsx` | 70 |
| `apps/web/src/lib/share.ts` | 42, 87 |
| `apps/web/src/app/settings/devices/page.tsx` | 41, 65 |
| `apps/web/src/app/onboarding/page.tsx` | 51 |

#### Backend Services (2 occurrences):
| File | Line |
|------|------|
| `services/referral-service/src/main.ts` | 38 |
| `services/subscription-service/src/main.ts` | 24 |

**Remediation:**
- Use proper logging library (`@azeebo/logger` package)
- Remove all `console.log` from production code
- Use log levels (debug, info, warn, error)
- Add log aggregation (Loki, ELK stack)

**Code Fix:**
```typescript
// ❌ BAD
console.error('Failed to load data:', error);

// ✅ GOOD
import { Logger } from '@azeebo/logger';
const logger = new Logger('RankingsService');
logger.error('Failed to load rankings', { error });
```

---

### 5.3 Duplicate Compiled .js Files

**Severity:** MEDIUM  
**Location:** `apps/web/src/app/` (34 files)

All `.tsx` page files have corresponding `.js` compiled duplicates:
- `page.tsx` + `page.js` (34 occurrences)
- `layout.tsx` + `layout.js`
- `robots.ts` + `robots.js`
- `sitemap.ts` + `sitemap.js`

**Files:**
```
apps/web/src/app/admin/content/page.js
apps/web/src/app/admin/page.js
apps/web/src/app/admin/users/page.js
apps/web/src/app/auth/forgot-password/page.js
apps/web/src/app/auth/login/page.js
apps/web/src/app/auth/register/page.js
apps/web/src/app/browse/page.js
apps/web/src/app/comedy/page.js
apps/web/src/app/creators/dashboard/page.js
apps/web/src/app/creators/page.js
apps/web/src/app/expired-session/page.js
apps/web/src/app/forbidden/page.js
apps/web/src/app/games/page.js
apps/web/src/app/layout.js
apps/web/src/app/library/page.js
apps/web/src/app/lifestyle/page.js
apps/web/src/app/maintenance/page.js
apps/web/src/app/movies/page.js
apps/web/src/app/notifications/page.js
apps/web/src/app/page.js
apps/web/src/app/privacy/page.js
apps/web/src/app/reality/page.js
apps/web/src/app/rewards/page.js
apps/web/src/app/robots.js
apps/web/src/app/search/page.js
apps/web/src/app/sitemap.js
apps/web/src/app/sports/page.js
apps/web/src/app/support/page.js
apps/web/src/app/terms/page.js
apps/web/src/app/unauthorized/page.js
apps/web/src/app/vertical/page.js
apps/web/src/app/wallet/page.js
apps/web/src/app/watch/[id]/WatchPageClient.js
apps/web/src/app/watch/[id]/page.js
```

**Issues:**
- Stale build artifacts committed to repository
- Duplicates increase repository size
- Risk of editing wrong file (`.js` instead of `.tsx`)
- Confusing for developers

**Remediation:**
```bash
# Delete all compiled .js files
find apps/web/src/app -name "*.js" -type f -delete

# Add to .gitignore
apps/web/src/app/**/*.js
```

- Add cleanup script to `package.json`:
```json
{
  "scripts": {
    "clean:compiled": "find apps/web/src/app -name '*.js' -type f -delete"
  }
}
```

---

## Category 6: Infrastructure & Configuration (LOW)

### 6.1 Kubernetes Secrets Template

**Severity:** LOW  
**Location:** `infra/k8s/secrets.yaml`

| Line | Hardcoded Value |
|------|-----------------|
| 8 | `jwt-access-secret: ${JWT_ACCESS_SECRET}` |
| 9 | `jwt-refresh-secret: ${JWT_REFRESH_SECRET}` |
| 20 | `postgres-password: ${POSTGRES_PASSWORD}` |

**Note:** These are templates using `${}` syntax, which is acceptable. Ensure they are populated from secrets manager during deployment.

**Remediation:**
- Document that these must be replaced before deployment
- Use `kubectl create secret` with `--from-literal` flags
- Integrate with HashiCorp Vault or AWS Secrets Manager

---

### 6.2 CI/CD Hardcoded Test Secret

**Severity:** LOW  
**Location:** `.github/workflows/ci.yml`

| Line | Hardcoded Value |
|------|-----------------|
| 327 | `--env JWT_SECRET="test-secret-for-smoke-tests"` |

**Remediation:**
- Use GitHub secrets for test credentials
- Create `.env.test` file (gitignored)
- Document that this is for smoke tests only

---

## Category 7: Inconsistent Configuration (LOW)

### 7.1 Inconsistent Email Domains

**Severity:** LOW  
**Location:** Email services

| Service | Email Domain |
|---------|--------------|
| `queue-service` | `no-reply@azeebo.plus` |
| `notification-service` | `no-reply@azeebo.com` |

**Remediation:**
- Standardize on `azeebo.plus` domain
- Update all email services to use consistent domain
- Add email configuration to shared package

---

### 7.2 Inconsistent JWT Configuration

**Severity:** MEDIUM  
**Location:** Multiple services

Some services use:
- `JWT_SECRET` (single secret)
- `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` (separate secrets)

**Files:**
- `services/auth-service/src/main.ts` - validates both `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- `services/sports-service/src/modules/sports/sports.module.ts` - uses `JWT_SECRET`
- `services/content-service/src/modules/content/content.module.ts` - uses `JWT_SECRET`
- `services/referral-service/src/modules/referral/referral.module.ts` - uses `JWT_SECRET`

**Remediation:**
- Standardize on separate access/refresh secrets
- Update all services to use consistent configuration
- Add JWT configuration validation to shared package

---

## Summary Statistics

| Category | Count | Severity |
|----------|-------|----------|
| Secrets & Credentials | 45+ | CRITICAL |
| Hardcoded URLs | 60+ | HIGH |
| Hardcoded Prices | 30+ | MEDIUM |
| Hardcoded Ports | 23 | MEDIUM |
| Code Quality Issues | 50+ | MEDIUM/LOW |
| Infrastructure Config | 5 | LOW |
| **TOTAL** | **213+** | - |

---

## Priority Matrix

| Priority | Task | Effort | Impact | Timeline |
|----------|------|--------|--------|----------|
| P0 | Remove fallback secrets in source code | 1 day | CRITICAL | Week 1 |
| P0 | Fix Docker Compose default passwords | 1 day | CRITICAL | Week 1 |
| P0 | Remove localhost URL fallbacks | 2 days | HIGH | Week 1 |
| P1 | Replace Math.random() with crypto | 1 day | HIGH | Week 2 |
| P1 | Delete duplicate .js files | 0.5 day | MEDIUM | Week 2 |
| P1 | Implement dynamic pricing | 3 days | MEDIUM | Week 2-3 |
| P2 | Add proper logging | 2 days | LOW | Week 3 |
| P2 | Standardize email domains | 0.5 day | LOW | Week 3 |
| P2 | Standardize JWT configuration | 1 day | MEDIUM | Week 3 |

---

## Quick Wins (Do Today)

1. **Delete 34 duplicate .js files** - 10 minutes
2. **Remove `|| 'development-secret'` fallbacks** - 15 minutes
3. **Update `docker-compose.yml` to require passwords** - 20 minutes
4. **Add `apps/web/src/app/**/*.js` to `.gitignore`** - 5 minutes
5. **Fix inconsistent email domains** - 10 minutes

**Total: ~1 hour for immediate security improvements**

---

## Recommendations

### 1. Implement Configuration Validation

Create a shared configuration validation package:

```typescript
// packages/config-validation/src/index.ts
import { z } from 'zod';

export const serviceConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
});

export function validateConfig(config: unknown) {
  return serviceConfigSchema.parse(config);
}
```

### 2. Use Secrets Manager

Implement HashiCorp Vault or AWS Secrets Manager:

```typescript
// services/auth-service/src/main.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager();
const secrets = await secretsManager.getSecretValue({
  SecretId: 'azeebo/auth-service/production'
});
```

### 3. Add Pre-Commit Hooks

Use Husky to prevent committing secrets:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run scan:secrets"
    }
  }
}
```

### 4. Enhance Security Scanning

Fix bugs in `ci/scripts/scan-hardcoded-values.sh`:

**Current Bug (Line 26):**
```bash
| grep -v "localhost" \  # This removes ALL localhost matches!
```

**Fixed Version:**
```bash
| grep -v "// localhost" \  # Only remove comments
| grep -v "# localhost" \   # Only remove comments
# Remove the overly broad grep -v "localhost"
```

**Add Additional Scans:**
- Database connection strings
- Redis URLs
- External third-party URLs
- Duplicate .js files
- Hardcoded email addresses

### 5. Implement Environment-Specific Configuration

Use Next.js environment validation:

```typescript
// apps/web/env.mjs
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
});
```

---

## Related Documents

- [docs/UPGRADE.md](./docs/UPGRADE.md) - Comprehensive technical audit
- [ci/scripts/scan-hardcoded-values.sh](./ci/scripts/scan-hardcoded-values.sh) - Security scanning script
- [.env.example](./.env.example) - Environment template
- [.gitignore](./.gitignore) - Git ignore rules (`.env` already excluded ✓)

---

## Next Steps

1. **Immediate (This Week):**
   - [ ] Remove all fallback secrets from source code
   - [ ] Fix Docker Compose default passwords
   - [ ] Delete duplicate .js files
   - [ ] Fix `scan-hardcoded-values.sh` bugs

2. **Short-term (Next 2 Weeks):**
   - [ ] Remove all localhost URL fallbacks
   - [ ] Replace `Math.random()` with secure alternatives
   - [ ] Implement dynamic pricing configuration
   - [ ] Add proper logging throughout codebase

3. **Medium-term (Next Month):**
   - [ ] Implement secrets manager integration
   - [ ] Add configuration validation to all services
   - [ ] Enhance CI/CD security scanning
   - [ ] Standardize JWT configuration across services

---

**Document Version:** 1.0  
**Last Updated:** 2026  
**Owner:** Security & DevOps Team
