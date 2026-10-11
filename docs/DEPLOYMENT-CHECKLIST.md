# Azeebo+ Deployment Checklist

> Generated: 2026-07-22
> Based on code changes from this session

---

## Pre-Deployment Checklist

### 1. Environment Variables (Add to Coolify)

New environment variables required after this session's changes:

```bash
# Analytics Service URL (needed by ALL services for event tracking)
ANALYTICS_SERVICE_URL=http://analytics-service:3008

# WebSocket (needed by messaging-service and reality-service)
WS_CORS_ORIGIN=https://app.azeeboplus.com

# Feature Flags (runtime store — needed by every service that registers FeatureFlagModule)
FEATURE_FLAG_REDIS_URL=redis://localhost:6379
# Optional per-flag default overrides when the store is empty (e.g. emergency dark-launch):
# FEATURE_FLAG_DEFAULT_WEB_MAINTENANCE_MODE=true
# FEATURE_FLAG_DEFAULT_QUEUE_PROCESS_PAYMENTS=false

# Event Bus (needed by wallet-service)
EVENT_BUS_REDIS_URL=redis://localhost:6379

# OpenTelemetry (needed by auth, wallet, payment services)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=azeebo-platform
```

### 2. Database Migrations

Run migrations for services with schema changes:

```bash
# Reality service - social features (likes, comments, shares)
cd services/universes/reality-service
npx prisma migrate deploy

# Verify migration applied safely
npx prisma migrate status
```

### 3. Package Dependencies

Install new dependencies in services:

```bash
# Messaging service - WebSocket support
pnpm add --filter @azeebo/messaging-service @nestjs/websockets @nestjs/platform-socket.io

# Reality service - WebSocket support
pnpm add --filter @azeebo/reality-service @nestjs/websockets @nestjs/platform-socket.io

# Admin and Creator apps - if not already installed
pnpm add --filter @azeebo/admin @nestjs/serve-static
pnpm add --filter @azeebo/creator @nestjs/serve-static
```

### 4. Docker Image Rebuild

The Dockerfile already includes all packages. Rebuild the image:

```bash
# Build new image
docker build -f Dockerfile.all-in-one -t ghcr.io/azeebotv/azeebo-all-in-one:dev .

# Or trigger via GitHub Actions
gh workflow run cd-all-in-one.yml -f no_cache=true
```

---

## CI/CD Pipeline Status

### Current Pipelines

| Pipeline | Trigger | Status | Notes |
|----------|---------|--------|-------|
| ci.yml | push to main/develop | ✅ Working | lint, typecheck, test, build, docker |
| pr-checks.yml | pull_request | ✅ Working | validation, lint, typecheck, test, build |
| cd-all-in-one.yml | push to Dev-Branch | ✅ Working | builds and pushes Docker image |
| cd.yml | push to main | ⚠️ Placeholder | deploy steps are `echo` commands |
| database-backup.yml | schedule | ✅ Working | daily backups |
| rollback.yml | manual | ✅ Working | rollback to previous version |
| security-scan.yml | schedule | ✅ Working | vulnerability scanning |

### Recommended CI/CD Improvements

#### 1. Add Integration Test Step to CI

The new integration tests should run in CI. Update `ci.yml`:

```yaml
# Add after the test job
integration-test:
  name: Integration Tests
  runs-on: ubuntu-latest
  timeout-minutes: 45
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_USER: azeebo
        POSTGRES_PASSWORD: azeebo_test_2024
        POSTGRES_DB: azeebo_test
      ports:
        - 5432:5432
    redis:
      image: redis:7
      ports:
        - 6379:6379
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: ${{ env.PNPM_VERSION }}
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm run prisma:generate --if-present
    - run: pnpm run test:integration --if-present
```

#### 2. Add E2E Test Step to CI

For admin and creator apps:

```yaml
e2e-test:
  name: E2E Tests
  runs-on: ubuntu-latest
  timeout-minutes: 30
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: ${{ env.PNPM_VERSION }}
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: npx playwright install --with-deps
    - run: pnpm --filter @azeebo/admin run build:client
    - run: pnpm --filter @azeebo/admin run test:e2e
    - run: pnpm --filter @azeebo/creator run build:client
    - run: pnpm --filter @azeebo/creator run test:e2e
```

#### 3. Implement Real CD Deployment

The `cd.yml` currently has placeholder deploy steps. For Coolify deployment:

```yaml
deploy-staging:
  name: Deploy to Staging
  runs-on: ubuntu-latest
  timeout-minutes: 30
  if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
  environment: staging
  steps:
    - uses: actions/checkout@v4
    - name: Deploy to Coolify
      run: |
        # Option 1: Trigger Coolify webhook
        curl -X POST "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}" \
          -H "Content-Type: application/json" \
          -d '{"tag": "${{ github.sha }}"}'
        
        # Option 2: Use Coolify API
        # curl -X POST "${{ secrets.COOLIFY_API_URL }}/api/v1/deploy" \
        #   -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
        #   -H "Content-Type: application/json" \
        #   -d '{"project_id": "${{ secrets.COOLIFY_PROJECT_ID }}", "service_id": "${{ secrets.COOLIFY_SERVICE_ID }}"}'
```

#### 4. Add Post-Deploy Verification

Enhance the health check job:

```yaml
health-check:
  name: Post-Deploy Health Check
  runs-on: ubuntu-latest
  timeout-minutes: 10
  needs: [deploy-staging]
  steps:
    - name: Wait for services to start
      run: sleep 60
    
    - name: Check API Gateway health
      run: |
        for i in {1..10}; do
          if curl -sf "http://localhost:3013/health" > /dev/null 2>&1; then
            echo "API Gateway healthy"
            break
          fi
          echo "Waiting for API Gateway... ($i/10)"
          sleep 10
        done
    
    - name: Check all service health endpoints
      run: |
        SERVICES=(
          "3013:API Gateway"
          "4000:Web App"
          "4014:Creator Portal"
          "4016:Admin Panel"
        )
        for svc in "${SERVICES[@]}"; do
          PORT="${svc%%:*}"
          NAME="${svc##*:}"
          if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
            echo "✅ ${NAME} healthy on port ${PORT}"
          else
            echo "❌ ${NAME} unhealthy on port ${PORT}"
            exit 1
          fi
        done
    
    - name: Run smoke tests
      run: |
        # Test API endpoints
        curl -sf "http://localhost:3013/api/v1/auth/health" || exit 1
        curl -sf "http://localhost:3013/api/v1/users/health" || exit 1
        echo "✅ Smoke tests passed"

    - name: Verify feature-flag store reachable + defaults loaded
      run: |
        # Bootstrap endpoint returns public flags with defaults when the store is up;
        # empty store still resolves registered defaults (not an error). A 5xx or
        # timeout means FEATURE_FLAG_REDIS_URL is unreachable.
        curl -sf "http://localhost:3013/feature-flags/bootstrap" | grep -q '"success":true' || exit 1
        echo "✅ Feature flag store reachable, defaults resolved"
```

---

## Deployment Commands

### First-Time Setup

```bash
# 1. Clone and install
git clone https://github.com/azeebotv/azeebo-plus.git
cd azeebo-plus
pnpm install

# 2. Setup local databases
./scripts/local-dev.sh setup

# 3. Seed data
./scripts/local-dev.sh db seed

# 4. Start services
./scripts/local-dev.sh start --quick
```

### Docker Deployment (Coolify)

```bash
# 1. Build image
docker build -f Dockerfile.all-in-one -t ghcr.io/azeebotv/azeebo-all-in-one:dev .

# 2. Push to registry
docker push ghcr.io/azeebotv/azeebo-all-in-one:dev

# 3. Deploy via Coolify
# - Create project in Coolify UI
# - Select "Docker Compose" type
# - Point to docker-compose.all-in-one.yml
# - Add environment variables
# - Deploy
```

### Manual Deployment

```bash
# Stop existing container
docker stop azeebo-all-in-one

# Pull new image
docker pull ghcr.io/azeebotv/azeebo-all-in-one:dev

# Start new container
docker run -d \
  --name azeebo-all-in-one \
  -p 3013:3013 \
  -p 4000:4000 \
  -p 4014:4014 \
  -p 4016:4016 \
  --env-file .env \
  ghcr.io/azeebotv/azeebo-all-in-one:dev
```

---

## Rollback Procedure

```bash
# Option 1: Use rollback workflow
gh workflow run rollback.yml -f environment=production

# Option 2: Manual rollback
docker stop azeebo-all-in-one
docker run -d \
  --name azeebo-all-in-one \
  -p 3013:3013 \
  -p 4000:4000 \
  -p 4014:4014 \
  -p 4016:4016 \
  --env-file .env \
  ghcr.io/azeebotv/azeebo-all-in-one:previous-tag
```

---

## Monitoring

### Health Endpoints

| Service | Endpoint | Port |
|---------|----------|------|
| API Gateway | `/health` | 3013 |
| Web App | `/health` | 4000 |
| Creator Portal | `/health` | 4014 |
| Admin Panel | `/health` | 4016 |

### Logs

```bash
# View container logs
docker logs -f azeebo-all-in-one

# View specific service logs
docker exec azeebo-all-in-one tail -f /var/log/supervisor/auth-service.log

# View all service logs
docker exec azeebo-all-in-one supervisorctl status
```

### Metrics

- Prometheus metrics available at `/metrics` (auth-service, wallet-service)
- OpenTelemetry tracing enabled for auth, wallet, payment services
- Request logs carry `x-request-id` for tracing

---

*Last Updated: 2026-07-22*
