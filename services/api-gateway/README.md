# API Gateway

Azeebo+ API Gateway - Central entry point for all API requests, handling routing, authentication, rate limiting, caching, and observability.

## Features

- **Service Routing**: Route requests to appropriate backend services
- **Request Forwarding**: Forward requests with proper path handling
- **Caching**: Redis-based caching for frequent read operations
- **Rate Limiting**: Rate limiting to prevent abuse
- **Health Checks**: Service health monitoring
- **Observability**: Request logging and metrics
- **JWT Extraction**: Extract user ID from JWT for cache partitioning (no verification)

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3000 | Gateway port (public API entry point) |
| REDIS_URL | redis://localhost:6379 | Redis connection for caching/rate limiting |
| AUTH_SERVICE_URL | http://localhost:3000 | Auth service URL |
| USER_SERVICE_URL | http://localhost:3001 | User service URL |
| WALLET_SERVICE_URL | http://localhost:3002 | Wallet service URL |
| PAYMENT_SERVICE_URL | http://localhost:3003 | Payment service URL |
| CONTENT_SERVICE_URL | http://localhost:3004 | Content service URL |
| MEDIA_SERVICE_URL | http://localhost:3019 | Media service URL |
| SEARCH_SERVICE_URL | http://localhost:3005 | Search service URL |
| NOTIFICATION_SERVICE_URL | http://localhost:3006 | Notification service URL |
| REWARD_SERVICE_URL | http://localhost:3007 | Reward service URL |
| ANALYTICS_SERVICE_URL | http://localhost:3008 | Analytics service URL |
| RECOMMENDATION_SERVICE_URL | http://localhost:3009 | Recommendation service URL |
| REALITY_SERVICE_URL | http://localhost:3010 | Reality service URL |
| MOVIE_SERVICE_URL | http://localhost:3011 | Movie service URL |
| GAMES_SERVICE_URL | http://localhost:3012 | Games service URL |
| COMEDY_SERVICE_URL | http://localhost:3013 | Comedy service URL |
| SPORTS_SERVICE_URL | http://localhost:3014 | Sports service URL |
| LIFESTYLE_SERVICE_URL | http://localhost:3016 | Lifestyle service URL |
| VERTICAL_SERVICE_URL | http://localhost:3017 | Vertical service URL |
| CREATOR_SERVICE_URL | http://localhost:3018 | Creator service URL |
| SUPPORT_SERVICE_URL | http://localhost:3020 | Support service URL |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start:dev
```

## Public API URL Pattern

All services are exposed through the gateway at: `https://api.azeebo.com/api/v1/{service}/...`

## Health Check

- `GET /health` - Gateway and backend services health status

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: platform-engineering@azeebo.com
- **Last Updated**: 2026-05-11
