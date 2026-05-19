# Environment Parity Guide

## Overview

This document ensures all environments (development, staging, production) maintain configuration parity while respecting environment-specific requirements.

## Environment Matrix

| Environment | Purpose | Access | Database | Redis | AWS Account |
|-------------|---------|--------|----------|-------|-------------|
| Development | Local testing | All developers | Local PostgreSQL | Local Redis | Development |
| Staging | Pre-production QA | QA + Developers | Staging RDS | Staging ElastiCache | Staging |
| Production | Live users | Restricted | Production RDS | Production ElastiCache | Production |

## Service Environment Variables

### Required Variables by Environment

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | development | staging | production |
| `PORT` | 3000-3020 | Same as dev | Same as dev |
| `DATABASE_HOST` | localhost | staging-db.azeebo.com | prod-db.azeebo.com |
| `DATABASE_NAME` | azeebo_dev | azeebo_staging | azeebo_production |
| `REDIS_HOST` | localhost | staging-redis.azeebo.com | prod-redis.azeebo.com |
| `JWT_SECRET` | dev-secret-32chars | staging-secret-64chars | [AWS Secrets Manager] |
| `ALLOWED_ORIGINS` | * | staging.azeebo.com | azeebo.com |
| `RATE_LIMIT_TTL` | 60 | 60 | 60 |
| `RATE_LIMIT_MAX` | 1000 | 500 | 100 |

## Staging Environment Configuration

Each service must have a `.env.staging.example` file with staging-specific defaults.

### Example: api-gateway/.env.staging.example

```
# API Gateway Service - Staging
PORT=3000

# Service URLs (Internal Kubernetes DNS)
AUTH_SERVICE_URL=http://auth-service.azeebo-staging.svc.cluster.local:3000
USER_SERVICE_URL=http://user-service.azeebo-staging.svc.cluster.local:3000
WALLET_SERVICE_URL=http://wallet-service.azeebo-staging.svc.cluster.local:3000
PAYMENT_SERVICE_URL=http://payment-service.azeebo-staging.svc.cluster.local:3000
CONTENT_SERVICE_URL=http://content-service.azeebo-staging.svc.cluster.local:3000

# Database
DATABASE_HOST=staging-db.azeebo.com
DATABASE_PORT=5432
DATABASE_NAME=azeebo_staging

# Redis
REDIS_HOST=staging-redis.azeebo.com
REDIS_PORT=6379

# Rate Limiting (stricter in staging)
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=500

# CORS
CORS_ORIGIN=https://staging.azeebo.com

# Security
NODE_ENV=staging
```

## Environment-Specific Secrets Management

### Development
- Local `.env` files (gitignored)
- No secrets in version control

### Staging
- AWS Secrets Manager for sensitive values
- Secret ARNs follow pattern: `arn:aws:secretsmanager:us-east-1:ACCOUNT:staging:SERVICE:VARIABLE`

### Production
- AWS Secrets Manager (mandatory)
- Secret ARNs follow pattern: `arn:aws:secretsmanager:us-east-1:ACCOUNT:production:SERVICE:VARIABLE`
- Rotation policies enabled for critical secrets

## Environment Validation

All services MUST validate environment on startup using `@azeebo/shared-types`:

```typescript
import { validateEnvironment } from '@azeebo/shared-types';

async function bootstrap() {
  validateEnvironment(process.env);
  // ... rest of bootstrap
}
```

### Validation Rules

| Check | Development | Staging | Production |
|-------|-------------|---------|------------|
| JWT_SECRET length | >= 32 chars | >= 64 chars | >= 64 chars |
| DATABASE_HOST | Any | No localhost | No localhost |
| REDIS_HOST | Any | No localhost | No localhost |
| Payment secrets | Optional | Required | Required |
| ALLOWED_ORIGINS | Any | Specific domains | Specific domains |

## Feature Flags by Environment

| Flag | Development | Staging | Production |
|------|-------------|---------|------------|
| `dark_mode` | true | true | gradual (10%) |
| `new_payment_flow` | true | true | gradual (25%) |
| `video_autoplay` | true | true | false |

## Service Ports

| Service | Port | Staging Port | Production Port |
|---------|------|--------------|----------------|
| api-gateway | 3000 | 3000 | 3000 |
| auth-service | 3001 | 3001 | 3001 |
| user-service | 3002 | 3002 | 3002 |
| wallet-service | 3003 | 3003 | 3003 |
| payment-service | 3004 | 3004 | 3004 |
| content-service | 3005 | 3005 | 3005 |
| notification-service | 3006 | 3006 | 3006 |
| reward-service | 3007 | 3007 | 3007 |
| search-service | 3008 | 3008 | 3008 |
| analytics-service | 3009 | 3009 | 3009 |
| moderation-service | 3010 | 3010 | 3010 |
| recommendation-service | 3011 | 3011 | 3011 |
| creator-service | 3012 | 3012 | 3012 |
| lifestyle-service | 3013 | 3013 | 3013 |
| vertical-service | 3014 | 3014 | 3014 |
| queue-service | 3015 | 3015 | 3015 |

## Database Schema Parity

All environments MUST use the same Prisma schema version. Migrations are applied in order:

1. Development: `pnpm prisma migrate dev`
2. Staging: Applied automatically via CI/CD on merge to main
3. Production: Applied manually with approval gate

## Checklist

- [ ] All services have `.env.example` for development
- [ ] All services have `.env.staging.example` for staging
- [ ] All services call `validateEnvironment()` on startup
- [ ] All secrets stored in AWS Secrets Manager (staging/prod)
- [ ] All services have health endpoints
- [ ] All services have readiness endpoints
- [ ] Environment variables documented in service README