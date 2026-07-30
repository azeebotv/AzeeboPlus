# API Gateway — Reference

> Port: 3013 | Database: None (stateless)
> File: `services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts` (1481 lines)

## Purpose
Central entry point for all client requests. Handles request routing, JWT validation, rate limiting, CORS, health aggregation, and circuit breaker protection.

## Architecture

```
Client → API Gateway (:3013) → Backend Services (:3000-3026)
         ├── JWT Validation
         ├── Rate Limiting
         ├── CORS
         ├── Circuit Breaker
         └── Request Proxying
```

## Service Routing

The gateway routes requests to 27 backend services via `SERVICE_CONFIGS` array. Each service has:
- **path**: URL prefix (e.g., `/auth`, `/wallet`, `/reality`)
- **envKey**: Environment variable for service URL
- **fallbackUrl**: Default service URL
- **pathStrategy**: How to build the target URL
- **endpoints**: Documented endpoint list

### Path Strategies
| Strategy | Description | Example |
|----------|-------------|---------|
| `default` | `/v{version}/{service}{path}` | `/v1/auth/login` |
| `includes-prefix` | Service has global prefix | `/v1/wallet/balance` |
| `no-prefix` | Service has no global prefix | `/creator/dashboard` |
| `auth-service-strategy` | Auth service has `/v{version}` prefix | `/v1/auth/login` |

### Service Map
| Path | Service | Port | Strategy |
|------|---------|------|----------|
| `/auth` | auth-service | 3000 | auth-service-strategy |
| `/users` | user-service | 3001 | includes-prefix |
| `/wallet` | wallet-service | 3002 | includes-prefix |
| `/payments` | payment-service | 3003 | default |
| `/content` | content-service | 3004 | default |
| `/search` | search-service | 3005 | default |
| `/media` | media-service | 3019 | default |
| `/reality` | reality-service | 3010 | default |
| `/creator` | creator app | 4014 | no-prefix |
| `/creators` | creator-service | 3018 | default |
| `/lifestyle` | lifestyle-service | 3016 | default |
| `/vertical` | vertical-service | 3017 | default |
| `/movies` | movie-service | 3011 | default |
| `/games` | games-service | 3014 | default |
| `/comedy` | comedy-service | 3012 | default |
| `/sports` | sports-service | 3021 | default |
| `/notifications` | notification-service | 3006 | default |
| `/rewards` | reward-service | 3007 | no-prefix |
| `/referrals` | referral-service | 3025 | default |
| `/messaging` | messaging-service | 3024 | default |
| `/engagement` | engagement-service | 3023 | default |
| `/subscription` | subscription-service | 3026 | default |
| `/moderation` | moderation-service | 3022 | default |
| `/queue` | queue-service | 3015 | default |
| `/support` | support-service | 3020 | default |
| `/analytics` | analytics-service | 3008 | default |
| `/recommendation` | recommendation-service | 3009 | default |

## Key Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Gateway health check |
| GET | /ready | Readiness check (all services up) |
| GET | /live | Liveness check |

### Proxied Routes
All `/api/v1/*` requests are proxied to the appropriate backend service based on the path prefix.

## Security

### JWT Validation
- Every request is validated against `JWT_ACCESS_SECRET`
- Token decoded and passed to backend as `X-User-Id`, `X-User-Role` headers
- Expired/invalid tokens return 401

### Rate Limiting
| Scope | Limit | Window |
|-------|-------|--------|
| General API | 1000 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute |
| Payment endpoints | 20 requests | 1 minute |
| Search API | 100 requests | 1 minute |
| File upload | 10 requests | 1 minute |

### CORS
- Production: `azeeboplus.com`, `www.azeeboplus.com`, `admin.azeeboplus.com`, `creator.azeeboplus.com`
- Staging: `app.azeeboplus.com`
- Localhost for development

### Circuit Breaker
- 5s timeout per service call
- Automatic fallback on service failure
- Half-open state for recovery testing

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Gateway port | 3013 |
| JWT_ACCESS_SECRET | JWT validation secret | — |
| GATEWAY_SECRET | Inter-service authentication | — |
| INTERNAL_API_KEY | Internal API key | — |
| CORS_ORIGINS | Allowed origins | — |
| *_SERVICE_URL | Service URLs for each backend | varies |

## Caching
- Response caching via `@nestjs/cache-manager`
- 5-minute TTL for GET requests
- Cache invalidated on mutations
