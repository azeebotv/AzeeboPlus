# Azeebo+ Deployment Guide

**Date:** 2026-07-14  
**Version:** 1.0

---

## Overview

Azeebo+ uses a single-container "all-in-one" deployment strategy for simplicity, with Coolify as the deployment platform. The container runs PostgreSQL, Redis, PgBouncer, nginx, supervisor, 27+ microservices, and 3 frontends.

---

## Deployment Architecture

### All-in-One Container
- **Image:** `ghcr.io/azeebotv/azeebo-all-in-one:${IMAGE_TAG:-dev}`
- **Tags published by CI:** `staging-<sha>` (immutable), `staging` (moving), `production-<sha>` (immutable), `latest`
- **Version selection:** the Compose app interpolates `IMAGE_TAG`, so a deploy (or rollback) picks a tag by setting that variable on the Coolify app — `cd.yml`/`rollback.yml` do it through `scripts/coolify-set-image-tag.sh` when `COOLIFY_API_URL`, `COOLIFY_API_TOKEN` and `COOLIFY_APP_UUID` are configured.
- **Version verification:** the post-deploy health job runs `scripts/verify-deployed-image-tag.sh <env>-<sha> <health-url>`. It fails the deploy unless the running container reports that commit from `/version` (a missing or `dev` commit fails too) and, when the deploy went through Coolify, unless the app's `IMAGE_TAG` equals the tag this run published. A Coolify deploy with no API credentials fails closed rather than skipping the tag check. The result — image tag, expected commit, commit actually running, Coolify `IMAGE_TAG` — is written to the run's **step summary**, and a success also emits a `Deploy verified` notice annotation, so reviewers see which build shipped without expanding the log.
- **Ports:** 3013 (API Gateway), 4000 (Web), 4014 (Creator Portal), 4016 (Admin)
- **Resources:** 12GB memory, 4 CPUs
- **Health Check:** `curl -sf http://localhost:80/health`
- **Restart Policy:** `unless-stopped`
- **Stop Grace Period:** 60 seconds

### Infrastructure Components
| Component | Purpose |
|-----------|---------|
| PostgreSQL | Primary database (26 databases) |
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
| Post-Deploy Health Check | Verify health endpoints, then the running image tag; records the verified tag in the step summary |

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
| `JWT_ACCESS_SECRET` | JWT access token secret (>=64 chars) | (required) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (>=64 chars) | (required) |

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
| `ANALYTICS_SERVICE_URL` | Analytics service URL for event tracking | `http://localhost:3008` |
| `WS_CORS_ORIGIN` | WebSocket CORS origin | `https://app.azeeboplus.com` |
| `FEATURE_FLAG_REDIS_URL` | Redis URL for feature flags | `redis://localhost:6379` |
| `EVENT_BUS_REDIS_URL` | Redis URL for event bus | `redis://localhost:6379` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry endpoint | `http://localhost:4318` |
| `OTEL_SERVICE_NAME` | OpenTelemetry service name | `azeebo-platform` |

---

## Health Checks

### Which build is live?

Every environment has exactly one answer, and the deploy gate records it. Three
places report the same build, so a mismatch is always visible:

| Question | Where to look |
|----------|---------------|
| Which tag did this run publish and verify? | The run's **Summary** page — the `Verify running image tag` step appends a *Deploy verification — staging/production* table with the image tag, expected commit, the commit `/version` actually reported, and Coolify's `IMAGE_TAG`. A failed gate writes the same table with the reason it refused. |
| Which tag is Coolify configured to serve? | Coolify app → Environment Variables → `IMAGE_TAG` (must equal `<env>-<sha>` from the table). |
| What is the container actually running? | `curl -fsS https://<env-health-url>/version \| jq -r .commitSha` — the commit must match the tag's SHA. |

A tag alone is not proof: the tag is a pointer, and `commitSha` from `/version`
is the only identity the running container can produce. `commitSha=dev` (or an
absent field) means the image was built without `COMMIT_SHA` and cannot be
attributed to any tag — the deploy fails instead of guessing.

To check the same thing by hand after a deploy (or before a rollback):

```bash
# Same gate the workflow runs; prints the artifact + selector result
COOLIFY_API_URL=... COOLIFY_API_TOKEN=... COOLIFY_APP_UUID=... \
  ./scripts/verify-deployed-image-tag.sh production-1a2b3c4d https://api.azeeboplus.com
```

### Endpoints
| Endpoint | Port | Description |
|----------|------|-------------|
| `/health` | 3013 | API Gateway health |
| `/health` | 4000 | Web app health |
| `/health` | 4014 | Creator Portal health |
| `/health` | 4016 | Admin Panel health |
| `/health` | 3008 | Analytics service health |

> **Exposure note (`docker-compose.prod.yml`):** only the four rows above
> (3013/4000/4014/4016) are published to the host. All 28 internal services
> use `expose:` only — reach them from inside the compose network
> (`http://<service>:<port>`) or through the gateway. Do not add host `ports:`
> back for internal services (AUD-02); health-check them via the gateway's
> `/api/v1/<service>/health` routes instead.

### Analytics Service Endpoint Contract
- **Port:** `3008` (authoritative service port)
- **Local Host:** `http://localhost:3008`
- **Internal Docker / Fleet:** `http://analytics-service:3008`
- **Gateway Proxied Route:** `/api/v1/analytics/track`
- **Direct Upstream Ingestion:** `POST /v1/analytics/track`
- **Health Check:** `GET /health`

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
# Generate Prisma clients across workspaces
pnpm run prisma:generate

# Run migrations for local fleet
./scripts/local-dev.sh db migrate

# Run production migration deploy for a specific service
pnpm --filter @azeebo/auth-service exec prisma migrate deploy
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

`scripts/rollback.sh` pulls the target tag first, replaces the container, and
restores the previous image automatically if the new one fails its health check.

```bash
# Already-published tags look like: dev, <short-sha>, staging-<sha>, production-<sha>
ENVIRONMENT=production ./scripts/rollback.sh production-1a2b3c4

# Preview the resolved plan without changing the container
ENVIRONMENT=production ./scripts/rollback.sh production-1a2b3c4 --dry-run
```

### Automated Rollback
```bash
# Use GitHub Actions rollback workflow
gh workflow run rollback.yml -f environment=production -f target_tag=<tag>
```

A rollback is verified the same way a deploy is. After restoring the tag, the
run's `Verify restored image tag` step compares `/version` against the tag and
checks Coolify's `IMAGE_TAG`, then writes a **Rollback verification** block to
the run summary naming the tag that was restored and the commit that came back
up — so "which build is live now?" is answered on the run page, not in logs.

A moving tag (`latest`, `staging`, a bare `<sha>`) is accepted here because a
rollback may legitimately restore one: the tag names no commit, so the reported
`/version` commit is recorded instead of compared, and the summary says so. An
SSH rollback skips the Coolify selector (it never moved there) and says that too.

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
3. **JWT Secrets:** Must be at least 64 characters
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
