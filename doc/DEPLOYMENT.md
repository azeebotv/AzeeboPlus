# Azeebo+ Deployment Guide

**Date:** 2026-07-14  
**Version:** 1.0

---

## Overview

Azeebo+ uses a single-container "all-in-one" deployment strategy for simplicity, with Coolify as the deployment platform. The container runs PostgreSQL, Redis, PgBouncer, nginx, supervisor, 27+ microservices, and 3 frontends.

---

## Deployment Architecture

### All-in-One Container
- **Image:** `ghcr.io/azeebotv/azeebo-all-in-one:dev`
- **Ports:** 3013 (API Gateway), 4000 (Web), 4014 (Creator Portal), 4016 (Admin)
- **Resources:** 12GB memory, 4 CPUs
- **Health Check:** `curl -sf http://localhost:80/health`
- **Restart Policy:** `unless-stopped`
- **Stop Grace Period:** 60 seconds

### Infrastructure Components
| Component | Purpose |
|-----------|---------|
| PostgreSQL | Primary database (28 databases) |
| Redis | Cache, sessions, rate limiting |
| PgBouncer | Connection pooling |
| Nginx | Reverse proxy, static files |
| Supervisor | Process management |

---

## CI/CD Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)
**Trigger:** Push to `main` or `develop` branches

| Job | Timeout | Description |
|-----|---------|-------------|
| Lint | 15 min | Runs `pnpm run lint` |
| Type Check | 20 min | Runs `pnpm run typecheck` |
| Test | 30 min | Runs `pnpm run test` with PostgreSQL and Redis services |

### 2. CD Pipeline (`.github/workflows/cd.yml`)
**Trigger:** Push to `main` or manual dispatch

| Job | Description |
|-----|-------------|
| Deploy to Staging | Build, generate Prisma clients, deploy to staging |
| Deploy to Production | Deploy to production (requires staging success) |
| Post-Deploy Health Check | Verify health endpoints after deployment |

### 3. All-in-One Image Build (`.github/workflows/cd-all-in-one.yml`)
**Trigger:** Push to `Dev-Branch` or manual dispatch

| Step | Description |
|------|-------------|
| Free Disk Space | Remove unnecessary tools to free space |
| Build Docker Image | Two-stage build with layer caching |
| Push to GHCR | Push to GitHub Container Registry |

---

## Build Process

### Dockerfile.all-in-one (Two-Stage Build)

**Stage 1: Builder**
1. Install all dependencies with `pnpm install --frozen-lockfile`
2. Build shared packages (T0)
3. Build critical services (T1): Web, Gateway, Auth, User
4. Build core business (T2): Media, Content, Wallet, Payment, Search
5. Build apps (T3): Admin, Creator Portal
6. Build engagement services (T4): Notification, Reward, etc.
7. Build intelligence services (T5): Analytics, Recommendation
8. Build universe services (T6): Reality, Movie, Comedy, etc.
9. Build operations services (T7): Queue, Support, Moderation

**Stage 2: Runtime**
1. Fresh production install
2. Copy built artifacts from builder
3. Run Prisma migrations
4. Start all services via supervisor

---

## Deployment Commands

### First-Time Setup
```bash
# Local development
./scripts/local-dev.sh setup

# Start all services
./scripts/local-dev.sh start

# Stop all services
./scripts/local-dev.sh stop
```

### Docker Deployment
```bash
# Build all-in-one image
docker build -f Dockerfile.all-in-one -t azeebo-all-in-one .

# Run with environment file
docker run -d \
  --name azeebo \
  -p 3013:3013 \
  -p 4000:4000 \
  -p 4014:4014 \
  -p 4016:4016 \
  --env-file .env \
  azeebo-all-in-one
```

### Coolify Deployment
1. Create a new project in Coolify
2. Select "Docker Compose" type
3. Point to `docker-compose.all-in-one.yml` (root directory)
4. Add environment variables in Coolify UI
5. Deploy

---

## Environment Variables

### Required Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | (required) |
| `REDIS_PASSWORD` | Redis password | (required) |
| `JWT_ACCESS_SECRET` | JWT access token secret (>=32 chars) | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (>=32 chars) | (required) |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PAYSTACK_SECRET_KEY` | Paystack payment key | (empty) |
| `FLW_SECRET_KEY` | Flutterwave payment key | (empty) |
| `AWS_REGION` | AWS region | (empty) |
| `SMTP_HOST` | Email SMTP host | (empty) |

### New Variables (Required for Full Functionality)
| Variable | Description | Default |
|----------|-------------|---------|
| `ANALYTICS_SERVICE_URL` | Analytics service URL for event tracking | `http://localhost:3040` |
| `WS_CORS_ORIGIN` | WebSocket CORS origin | `https://app.azeeboplus.com` |
| `FEATURE_FLAG_REDIS_URL` | Redis URL for feature flags | `redis://localhost:6379` |
| `EVENT_BUS_REDIS_URL` | Redis URL for event bus | `redis://localhost:6379` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry endpoint | `http://localhost:4318` |
| `OTEL_SERVICE_NAME` | OpenTelemetry service name | `azeebo-platform` |

---

## Health Checks

### Endpoints
| Endpoint | Port | Description |
|----------|------|-------------|
| `/health` | 3013 | API Gateway health |
| `/health` | 4000 | Web app health |
| `/health` | 4014 | Creator Portal health |
| `/health` | 4016 | Admin Panel health |

### Health Check Configuration
```yaml
healthcheck:
  test: ["CMD", "curl", "-sf", "http://localhost:80/health"]
  interval: 10s
  timeout: 5s
  retries: 30
  start_period: 300s
```

---

## Database Migrations

### Running Migrations
```bash
# Generate Prisma clients
pnpm run prisma:generate

# Run migrations for all services
pnpm run prisma:migrate

# Run migrations for specific service
pnpm --filter @azeebo/auth-service run prisma:migrate
```

### Migration Strategy
1. Migrations run automatically during Docker build
2. Manual migrations can be run via `pnpm run prisma:migrate`
3. Each service has its own database with `azeebo_` prefix

---

## Monitoring

### Logs
```bash
# View container logs
docker logs -f azeebo

# View specific service logs
docker exec azeebo tail -f /var/log/supervisor/auth-service.log
```

### Metrics
- Prometheus metrics available at `/metrics`
- Grafana dashboards for monitoring
- Custom metrics via OpenTelemetry

---

## Rollback

### Manual Rollback
```bash
# Stop current container
docker stop azeebo

# Start previous version
docker run -d --name azeebo ghcr.io/azeebotv/azeebo-all-in-one:previous-tag
```

### Automated Rollback
```bash
# Use GitHub Actions rollback workflow
gh workflow run rollback.yml -f environment=production
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Container won't start | Check logs: `docker logs azeebo` |
| Database connection failed | Verify `POSTGRES_PASSWORD` is set |
| Redis connection failed | Verify `REDIS_PASSWORD` is set |
| JWT errors | Verify `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` |
| Port conflicts | Ensure ports 3013, 4000, 4014, 4016 are available |

### Debug Mode
```bash
# Start in debug mode
docker run -e NODE_ENV=development -p 3013:3013 azeebo-all-in-one
```

---

## Security Notes

1. **Secrets:** Never commit `.env` files; use Coolify UI or secret managers
2. **GATEWAY_SECRET:** Rotated on 2026-07-14; ensure all services use the new value
3. **JWT Secrets:** Must be at least 32 characters
4. **Database:** Use strong passwords; enable SSL in production
5. **Rate Limiting:** Enabled by default in production; disabled only in development

---

## Changelog

### 2026-07-14 Session Updates

#### Database Migrations Added
- **lifestyle-service:** `20240715000000_add_challenge_vote` — Added ChallengeVote model for vote deduplication
- **support-service:** `20240715000000_add_analytics_events` — Added SupportAnalyticsEvent model for analytics persistence

#### Package Changes
- **apps/web/package.json:** Added `@azeebo/analytics-sdk` dependency
- **packages/ui/package.json:** Added `typesVersions` for subpath exports
- **packages/opentelemetry/package.json:** Updated `@opentelemetry/resources` to `^2.7.0`

#### Service Changes
- **admin controllers:** Normalized to `@Controller('v1/admin')` across 17 services
- **shared-services:** Added `exists()` and `setIfNotExists()` to RedisService
- **auth-service:** Fixed `ServiceAuthGuard` to set both `id` and `sub` fields

#### Deployment Notes
- Prisma migrations must run before deploying (handled automatically in Dockerfile)
- No breaking API changes — all changes are backwards compatible
- GATEWAY_SECRET was rotated; ensure all services use the new value

---

*Last Updated: 2026-07-14*
