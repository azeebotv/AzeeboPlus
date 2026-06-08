# Azeebo+ Service Port Allocation

This document defines the port allocation for all services in the Azeebo+ platform.

## Port Ranges

- **3000-3026**: Backend Services
- **3100-3199**: Infrastructure Services
- **5000-5099**: Database Services
- **6000-6099**: Cache/Message Queue Services

## Backend Services

| Service | Port | Description |
|---------|------|-------------|
| auth-service | 3000 | Authentication & Authorization |
| user-service | 3001 | User Management |
| wallet-service | 3002 | Wallet & Transactions |
| payment-service | 3003 | Payment Processing |
| content-service | 3004 | Content Management |
| search-service | 3005 | Search & Discovery |
| notification-service | 3006 | Notifications (Email, Push, SMS) |
| reward-service | 3007 | Rewards & Loyalty |
| analytics-service | 3008 | Analytics & Reporting |
| recommendation-service | 3009 | Content Recommendations |
| reality-service | 3010 | Reality Shows & Voting |
| movie-service | 3011 | Movie Content |
| comedy-service | 3012 | Comedy Content |
| api-gateway | 3013 | API Gateway / Reverse Proxy |
| games-service | 3014 | Gaming Content |
| queue-service | 3015 | Background Job Processing (BullMQ) |
| lifestyle-service | 3016 | Lifestyle Content |
| vertical-service | 3017 | Vertical Management |
| creator-service | 3018 | Creator Management |
| media-service | 3019 | Media Processing & Storage |
| support-service | 3020 | Customer Support |
| sports-service | 3021 | Sports Content |
| moderation-service | 3022 | Content Moderation |
| engagement-service | 3023 | User Engagement |
| messaging-service | 3024 | In-app Messaging |
| referral-service | 3025 | Referral Program |
| subscription-service | 3026 | Subscription Management |

## Infrastructure Services

| Service | Port | Description |
|---------|------|-------------|
| PgBouncer | 6432 | PostgreSQL Connection Pooler |

## Database Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary Database |

## Cache Services

| Service | Port | Description |
|---------|------|-------------|
| Redis | 6379 | Caching & Session Store |

## Frontend Applications

| Application | Port | Description |
|-------------|------|-------------|
| Web App | 3000 | Next.js Web Application |
| Admin Dashboard | 3001 | Admin Management Portal |
| Creator Portal | 3002 | Creator Dashboard |
| Mobile App | 8081 | React Native Metro Bundler |

## Environment Variables

Each service should have the following port-related environment variables:

```bash
# Service Port
PORT=3XXX

# Service URLs (for inter-service communication)
AUTH_SERVICE_URL=http://localhost:3000
USER_SERVICE_URL=http://localhost:3001
WALLET_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
CONTENT_SERVICE_URL=http://localhost:3004
SEARCH_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006
REWARD_SERVICE_URL=http://localhost:3007
ANALYTICS_SERVICE_URL=http://localhost:3008
RECOMMENDATION_SERVICE_URL=http://localhost:3009
REALITY_SERVICE_URL=http://localhost:3010
MOVIE_SERVICE_URL=http://localhost:3011
COMEDY_SERVICE_URL=http://localhost:3012
API_GATEWAY_URL=http://localhost:3013
GAMES_SERVICE_URL=http://localhost:3014
QUEUE_SERVICE_URL=http://localhost:3015
LIFESTYLE_SERVICE_URL=http://localhost:3016
VERTICAL_SERVICE_URL=http://localhost:3017
CREATOR_SERVICE_URL=http://localhost:3018
MEDIA_SERVICE_URL=http://localhost:3019
SUPPORT_SERVICE_URL=http://localhost:3020
SPORTS_SERVICE_URL=http://localhost:3021
MODERATION_SERVICE_URL=http://localhost:3022
ENGAGEMENT_SERVICE_URL=http://localhost:3023
MESSAGING_SERVICE_URL=http://localhost:3024
REFERRAL_SERVICE_URL=http://localhost:3025
SUBSCRIPTION_SERVICE_URL=http://localhost:3026
```

## Docker Compose

When running with Docker Compose, services communicate using service names:

```yaml
services:
  auth-service:
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
```

## Production Deployment

In production, services should be configured with:
1. Internal service discovery (Kubernetes, Consul, etc.)
2. Load balancers for external access
3. Health checks on each service port
4. Monitoring for port availability
