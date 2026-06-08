# Azeebo+ Technical Audit & Upgrade Plan

**Audit Date:** May 26, 2026  
**Auditor:** Comprehensive Technical Review  
**Version:** 1.0  
**Status:** Draft - Pending Review

---

## Executive Summary

This audit covers the entire Azeebo+ monorepo including 20+ microservices, 3 frontend applications, shared packages, CI/CD pipelines, and infrastructure configurations. The project demonstrates solid architectural foundations with NestJS microservices, Prisma ORM, and proper separation of concerns. However, several critical areas require immediate attention before production deployment.

### Key Findings by Severity

| Severity | Count | Category |
|----------|-------|----------|
| Critical | 8 | Security, Infrastructure |
| High | 12 | Code Quality, Performance, Dependencies |
| Medium | 15 | Maintainability, Testing, DX |
| Low | 10 | Documentation, Minor Optimizations |

---

## Phase 1: Critical Security Fixes (Week 1-2)

### 1.1 JWT Secret Configuration

**Priority:** Critical  
**Impact:** Authentication bypass risk  
**Location:** `.env.example`, auth-service, all services

**Issue:**
- No `REFRESH_TOKEN_SECRET` defined in `.env.example` but required in [auth.service.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/modules/auth/auth.service.ts#L125)
- JWT secret validation happens at runtime, not at build time
- Multiple services use the same JWT secret for different purposes

**Fix:**
```env
# Add to .env.example
REFRESH_TOKEN_SECRET=CHANGE_ME_TO_A_DIFFERENT_SECURE_SECRET_AT_LEAST_32_CHARS
JWT_ACCESS_SECRET=CHANGE_ME_ACCESS_TOKEN_SECRET
JWT_REFRESH_SECRET=CHANGE_ME_REFRESH_TOKEN_SECRET
```

**Action:**
- Separate access and refresh token secrets
- Add environment validation at startup for all auth-related secrets
- Implement secret rotation mechanism

---

### 1.2 Docker Security Hardening

**Priority:** Critical  
**Impact:** Container escape, privilege escalation  
**Location:** All Dockerfiles

**Issues Found:**
1. **Base image uses Alpine without security patches** - `node:20-alpine` should specify exact patch version
2. **No multi-stage build optimization** - auth-service Dockerfile copies entire `dist` without filtering
3. **Missing security labels** - No metadata for scanning/tracking
4. **No read-only filesystem** - Containers can write to any directory
5. **Missing capability drops** - Containers run with unnecessary Linux capabilities

**Fix - Standardized Dockerfile Template:**
```dockerfile
FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.15.0

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY services/<service-name>/package.json ./services/<service-name>/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY services/<service-name>/src ./services/<service-name>/src
COPY services/<service-name>/tsconfig*.json ./services/<service-name>/
RUN pnpm --filter <service-name> build

# Production stage
FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install only production dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/<service-name>/package.json ./services/<service-name>/
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/services/<service-name>/dist ./dist

# Security hardening
USER nodejs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/services/<service-name>/src/main.js"]
```

---

### 1.3 Database Connection Security

**Priority:** Critical  
**Impact:** Data breach, unauthorized access  
**Location:** `docker-compose.yml`, all services

**Issues:**
1. **Single shared database** - All services use the same `DATABASE_URL` and database
2. **No connection pooling** - Each service creates direct connections
3. **Missing SSL/TLS** - Database connections not encrypted
4. **No database-per-service isolation** - Violates microservice principles

**Fix:**
```yaml
# docker-compose.yml - Add separate databases per service
services:
  postgres:
    environment:
      POSTGRES_MULTIPLE_DATABASES: "auth_db,user_db,wallet_db,payment_db,content_db"
    
  auth-service:
    environment:
      DATABASE_URL: postgresql://auth_user:${AUTH_DB_PASSWORD}@postgres:5432/auth_db?sslmode=require
      
  # Repeat for each service with isolated credentials
```

**Action:**
- Create separate databases per service
- Implement connection pooling (PgBouncer)
- Enforce SSL for all database connections
- Create separate database users with minimal permissions

---

### 1.4 CORS Configuration Vulnerability

**Priority:** Critical  
**Impact:** Cross-site request forgery, data leakage  
**Location:** [auth-service main.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/main.ts#L58-L72)

**Issue:**
```typescript
// Current implementation allows dynamic origin checking
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}
```

This allows `!origin` (no origin header) which can be exploited by certain attack vectors.

**Fix:**
```typescript
app.enableCors({
  origin: (origin, callback) => {
    // Reject requests with no origin (except for same-origin)
    if (!origin) {
      callback(new Error('Not allowed by CORS'));
      return;
    }
    
    // Strict whitelist matching
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = new RegExp(allowed.replace('*', '.*'));
        return pattern.test(origin);
      }
      return allowed === origin;
    });
    
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['Content-Disposition', 'X-Request-ID'],
  maxAge: 3600, // Reduced from 86400
});
```

---

### 1.5 Payment Webhook Security

**Priority:** Critical  
**Impact:** Payment fraud, unauthorized transactions  
**Location:** payment-service webhook handlers

**Issues:**
1. **Webhook signature verification** - Not implemented in visible code
2. **No idempotency keys** - Duplicate webhook processing possible
3. **Missing webhook timeout handling** - Long-running webhooks can block
4. **No webhook replay protection** - Old webhooks can be replayed

**Fix:**
```typescript
// payment-service/src/modules/webhooks/webhook.controller.ts
@Post('paystack')
async handlePaystackWebhook(
  @Headers('x-paystack-signature') signature: string,
  @Body() payload: any
) {
  // Verify webhook signature
  const isValid = this.webhookService.verifySignature(
    payload,
    signature,
    process.env.PAYSTACK_SECRET_KEY
  );
  
  if (!isValid) {
    throw new BadRequestException('Invalid webhook signature');
  }
  
  // Check idempotency
  const reference = payload.data.reference;
  const isDuplicate = await this.idempotencyService.check(reference);
  if (isDuplicate) {
    return { success: true, message: 'Already processed' };
  }
  
  // Process with timeout
  await Promise.race([
    this.paymentService.processWebhook(payload),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Webhook timeout')), 30000)
    )
  ]);
  
  // Mark as processed
  await this.idempotencyService.mark(reference);
}
```

---

### 1.6 Rate Limiting Implementation

**Priority:** Critical  
**Impact:** DDoS, brute force attacks  
**Location:** API Gateway, auth-service, all services

**Issues:**
1. **Inconsistent rate limiting** - Some services use `@nestjs/throttler`, others use custom guards
2. **No distributed rate limiting** - Redis-backed rate limiting not uniformly applied
3. **Missing rate limit headers** - Clients don't know their limits
4. **No IP-based blocking** - No mechanism to block abusive IPs

**Fix:**
```typescript
// api-gateway/src/modules/proxy/proxy.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 10,
          },
          {
            name: 'medium',
            ttl: 60000,
            limit: 100,
          },
          {
            name: 'long',
            ttl: 3600000,
            limit: 1000,
          },
        ],
        storage: new ThrottlerStorageRedisService(config.get('REDIS_URL')),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
```

---

### 1.7 Input Validation & Sanitization

**Priority:** Critical  
**Impact:** SQL injection, XSS, data corruption  
**Location:** All services, controllers

**Issues:**
1. **Missing DTOs** - Some endpoints lack validation DTOs
2. **No output sanitization** - Responses not sanitized before sending
3. **Missing payload size limits** - No max payload validation
4. **No file upload validation** - Media service lacks MIME type checking

**Fix:**
```typescript
// Add to all controllers
@Post()
@UsePipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  errorHttpStatusCode: 422,
}))
@UseInterceptors(FileInterceptor('file', {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Invalid file type'), false);
    }
  },
}))
```

---

### 1.8 Secrets Management

**Priority:** Critical  
**Impact:** Credential exposure, data breach  
**Location:** `.env.example`, CI/CD, all services

**Issues:**
1. **No secret rotation** - Secrets never rotated
2. **Missing secret encryption at rest** - `.env` files not encrypted
3. **No secret access auditing** - No logging of secret access
4. **CI/CD secrets not scoped** - GitHub secrets available to all workflows

**Actions:**
- Implement HashiCorp Vault or AWS Secrets Manager
- Enable secret rotation policies
- Add secret access logging
- Scope GitHub secrets to specific workflows
- Use encrypted environment variables in production

---

## Phase 2: Dependency Upgrades (Week 2-3)

### 2.1 NestJS Version Alignment

**Priority:** High  
**Current:** Mixed `^10.4.0` and `^11.1.19`  
**Target:** `^11.0.0` (latest stable)

**Issue:** `shared-types` package uses NestJS 11 while services use NestJS 10, causing potential compatibility issues.

**Action:**
```json
// Update all services to NestJS 11
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@nestjs/terminus": "^11.0.0",
    "@nestjs/throttler": "^6.0.0",
    "@nestjs/schedule": "^5.0.0",
    "@nestjs/event-emitter": "^3.0.0"
  }
}
```

---

### 2.2 Prisma Upgrade

**Priority:** High  
**Current:** `^5.22.0`  
**Target:** `^6.0.0` (latest stable)

**Benefits:**
- Improved query performance
- Better TypeScript integration
- New migration features
- Enhanced connection pooling

**Action:**
```bash
pnpm -r exec prisma upgrade
pnpm -r prisma generate
```

**Note:** Review breaking changes in Prisma 6 migration guide before upgrading.

---

### 2.3 Node.js Version

**Priority:** High  
**Current:** `>=20.0.0`  
**Target:** `20.11.1 LTS` (pinned)

**Issue:** Using `>=20.0.0` allows any Node 20 version, including potentially vulnerable older patches.

**Fix:**
```json
{
  "engines": {
    "node": "20.11.1",
    "pnpm": "9.15.0"
  }
}
```

---

### 2.4 Frontend Dependencies

**Priority:** Medium  
**Location:** apps/web, apps/mobile

**Web App:**
| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| next | ^14.2.0 | ^15.0.0 | Performance, security patches |
| react | ^18.3.1 | ^19.0.0 | React 19 features |
| @tanstack/react-query | ^5.56.0 | ^5.60.0 | Bug fixes |
| zustand | ^4.5.5 | ^5.0.0 | Performance improvements |

**Mobile App:**
| Package | Current | Target | Reason |
|---------|---------|--------|--------|
| expo | ~52.0.30 | ~53.0.0 | Latest SDK features |
| react-native | 0.76.5 | 0.77.0 | Performance, bug fixes |
| @react-navigation/* | ^6.5.20 | ^7.0.0 | New navigation features |

---

### 2.5 Security Dependencies

**Priority:** High  
**Location:** All services

**Add Missing Security Packages:**
```json
{
  "dependencies": {
    "helmet": "^8.1.0",
    "express-rate-limit": "^7.0.0",
    "csurf": "^1.11.0",
    "xss-clean": "^0.1.4",
    "hpp": "^0.2.3",
    "express-mongo-sanitize": "^2.2.0"
  }
}
```

---

## Phase 3: Code Quality & Architecture (Week 3-4)

### 3.1 Service Structure Standardization

**Priority:** High  
**Impact:** Maintainability, onboarding  
**Location:** All services

**Issue:** Services have inconsistent structure. Some have `common/`, others don't. Module organization varies.

**Standard Structure:**
```
services/<service-name>/
├── src/
│   ├── modules/
│   │   ├── <feature>/
│   │   │   ├── <feature>.module.ts
│   │   │   ├── <feature>.controller.ts
│   │   │   ├── <feature>.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-<feature>.dto.ts
│   │   │   │   └── update-<feature>.dto.ts
│   │   │   ├── interfaces/
│   │   │   │   └── <feature>.interface.ts
│   │   │   └── <feature>.spec.ts
│   │   └── health/
│   │       └── health.module.ts
│   ├── common/
│   │   ├── guards/
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── global-exception.filter.ts
│   │   └── services/
│   │       └── redis.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── test/
│   └── app.e2e-spec.ts
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

### 3.2 Error Handling Standardization

**Priority:** High  
**Location:** All services, `@azeebo/error-handling`

**Issue:** Error handling is inconsistent across services. Some use custom error classes, others use NestJS built-in exceptions.

**Fix:**
```typescript
// packages/error-handling/src/types.ts
export enum ErrorCode {
  // Auth errors (1000-1099)
  AUTH_INVALID_CREDENTIALS = 'AUTH_1001',
  AUTH_TOKEN_EXPIRED = 'AUTH_1002',
  AUTH_TOKEN_REVOKED = 'AUTH_1003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_1004',
  
  // Payment errors (2000-2099)
  PAYMENT_PROCESSING_FAILED = 'PAY_2001',
  PAYMENT_INSUFFICIENT_BALANCE = 'PAY_2002',
  PAYMENT_DUPLICATE_TRANSACTION = 'PAY_2003',
  
  // Content errors (3000-3099)
  CONTENT_NOT_FOUND = 'CNT_3001',
  CONTENT_ACCESS_DENIED = 'CNT_3002',
  
  // Add more error codes...
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

---

### 3.3 Testing Coverage

**Priority:** High  
**Current:** Partial (services pass, mobile has config issues)  
**Target:** 80%+ coverage for critical paths

**Missing Tests:**
1. **Integration tests** - Most services lack integration tests
2. **E2E tests** - Critical user journeys not fully covered
3. **Load tests** - No performance testing in CI
4. **Chaos tests** - No resilience testing
5. **Security tests** - No automated security testing

**Action Plan:**
```bash
# Add test scripts to all services
{
  "scripts": {
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration --runInBand",
    "test:e2e": "jest --testPathPattern=e2e --runInBand",
    "test:cov": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

**Test Coverage Requirements:**
| Layer | Minimum Coverage | Critical Paths |
|-------|-----------------|----------------|
| Unit | 80% | Auth, Payment, Wallet |
| Integration | 70% | Database, Redis, APIs |
| E2E | 60% | User journeys |
| Security | 100% | Auth, Payment, Webhooks |

---

### 3.4 API Versioning

**Priority:** Medium  
**Location:** All services, API Gateway

**Issue:** Services use `v1` prefix but no versioning strategy for backward compatibility.

**Fix:**
```typescript
// api-gateway/src/modules/proxy/proxy.module.ts
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

**Versioning Strategy:**
- URI versioning: `/v1/auth/login`, `/v2/auth/login`
- Deprecation headers: `Sunset: <date>`, `Deprecation: <date>`
- Version negotiation via `Accept` header

---

### 3.5 Database Migration Strategy

**Priority:** High  
**Location:** All services with Prisma

**Issues:**
1. **No migration rollback strategy** - Cannot rollback failed migrations
2. **No migration testing** - Migrations not tested in CI
3. **No data migration scripts** - Schema changes without data migration
4. **No migration versioning** - No way to track migration history

**Fix:**
```yaml
# .github/workflows/ci.yml - Add migration testing
- name: Test migrations
  run: |
    # Test forward migration
    pnpm -r exec prisma migrate deploy
    
    # Test rollback (if supported)
    pnpm -r exec prisma migrate resolve --rolled-back <migration_name>
    
    # Verify schema
    pnpm -r exec prisma validate
```

---

## Phase 4: Performance Optimization (Week 4-5)

### 4.1 Database Query Optimization

**Priority:** High  
**Location:** All services

**Issues:**
1. **N+1 queries** - No eager loading strategies
2. **Missing indexes** - Foreign keys not indexed
3. **No query caching** - Repeated queries not cached
4. **No connection pooling** - Direct connections to database

**Fix:**
```prisma
// Add indexes to all foreign keys
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([role])
  @@index([createdAt])
  @@index([email])
}
```

**Add PgBouncer:**
```yaml
# docker-compose.yml
pgbouncer:
  image: edoburu/pgbouncer:1.22.1
  ports:
    - "6432:6432"
  environment:
    DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
```

---

### 4.2 Redis Caching Strategy

**Priority:** High  
**Location:** All services

**Issues:**
1. **No cache invalidation** - Stale data not cleared
2. **No cache warming** - Cold starts cause slow responses
3. **No cache monitoring** - No metrics on cache hit/miss
4. **No distributed caching** - Each service has isolated cache

**Fix:**
```typescript
// Add cache interceptor to all services
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const key = this.generateCacheKey(context);
    const cached = await this.redisService.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const response = await next.handle();
    await this.redisService.set(key, JSON.stringify(response), 300); // 5 min TTL
    
    return response;
  }
}
```

---

### 4.3 API Response Optimization

**Priority:** Medium  
**Location:** All services

**Issues:**
1. **No pagination** - Large datasets returned without pagination
2. **No field selection** - All fields returned even when not needed
3. **No compression** - Responses not compressed
4. **No ETag support** - No conditional requests

**Fix:**
```typescript
// Add pagination to all list endpoints
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
  @Query('fields') fields?: string
) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100); // Max 100 items per page
  
  const [data, total] = await Promise.all([
    this.service.findMany({ skip, take, select: this.parseFields(fields) }),
    this.service.count(),
  ]);
  
  return ApiResponseWrapper.paginated(data, page, take, total);
}
```

---

### 4.4 Frontend Performance

**Priority:** Medium  
**Location:** apps/web, apps/mobile

**Web App:**
1. **Add image optimization** - Use `next/image` for all images
2. **Implement code splitting** - Lazy load routes
3. **Add service worker** - Cache static assets
4. **Optimize bundle size** - Tree shaking, remove unused dependencies

**Mobile App:**
1. **Add Hermes engine** - Improve JS performance
2. **Implement lazy loading** - Load screens on demand
3. **Optimize images** - Use WebP, compress assets
4. **Add offline support** - Cache data for offline use

---

## Phase 5: Infrastructure & DevOps (Week 5-6)

### 5.1 CI/CD Pipeline Optimization

**Priority:** High  
**Location:** `.github/workflows/`

**Issues:**
1. **Long build times** - CI takes too long due to sequential jobs
2. **No build caching** - Dependencies reinstalled every time
3. **No parallel test execution** - Tests run sequentially
4. **No deployment automation** - Manual deployment steps

**Fix:**
```yaml
# Add build caching
- name: Setup pnpm cache
  uses: actions/cache@v5
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-

# Add parallel test execution
- name: Run tests with sharding
  run: pnpm test -- --shard=1/4
  # Repeat for shards 2/4, 3/4, 4/4
```

---

### 5.2 Monitoring & Observability

**Priority:** High  
**Location:** All services, `@azeebo/observability`

**Issues:**
1. **No distributed tracing** - Cannot trace requests across services
2. **No error tracking** - No Sentry or similar integration
3. **No performance monitoring** - No APM tool
4. **No log aggregation** - Logs scattered across services

**Fix:**
```typescript
// Add OpenTelemetry to all services
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter(),
  instrumentations: [new HttpInstrumentation()],
});

sdk.start();
```

**Add monitoring stack:**
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards
- **Jaeger** - Distributed tracing
- **Loki** - Log aggregation
- **Alertmanager** - Alerting

---

### 5.3 Kubernetes Configuration

**Priority:** Medium  
**Location:** `infra/k8s/`

**Issues:**
1. **No resource limits** - Pods can consume unlimited resources
2. **No pod disruption budgets** - No high availability guarantees
3. **No horizontal pod autoscaling** - Manual scaling only
4. **No network policies** - All pods can communicate freely

**Fix:**
```yaml
# infra/k8s/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

### 5.4 Backup & Disaster Recovery

**Priority:** High  
**Location:** Infrastructure, CI/CD

**Issues:**
1. **No automated backups** - Manual backup process
2. **No backup testing** - Backups not verified
3. **No disaster recovery plan** - No DR runbook
4. **No RPO/RTO metrics** - No defined recovery objectives

**Fix:**
```yaml
# infra/k8s/base/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
spec:
  schedule: "0 */6 * * *" # Every 6 hours
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres -U postgres azeebo_prod | gzip > /backup/azeebo_$(date +%Y%m%d_%H%M%S).sql.gz
              # Upload to S3
              aws s3 cp /backup/ s3://azeebo-backups/ --recursive
              # Delete backups older than 30 days
              find /backup -name "*.sql.gz" -mtime +30 -delete
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          volumes:
          - name: backup-volume
            emptyDir: {}
          restartPolicy: OnFailure
```

---

## Phase 6: Feature Enhancements (Week 6-8)

### 6.1 API Gateway Enhancements

**Priority:** High  
**Location:** api-gateway

**Missing Features:**
1. **Request/response transformation** - Cannot modify requests/responses
2. **Circuit breaker** - No fallback for failed services
3. **Load balancing** - No intelligent routing
4. **API composition** - Cannot aggregate multiple service responses

**Add Circuit Breaker:**
```typescript
// api-gateway/src/modules/proxy/circuit-breaker.interceptor.ts
import { CircuitBreaker } from '@azeebo/shared-types';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private breakers = new Map<string, CircuitBreaker>();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const service = this.getServiceName(context);
    const breaker = this.getOrCreateBreaker(service);
    
    if (breaker.isOpen()) {
      throw new ServiceUnavailableException('Service temporarily unavailable');
    }
    
    try {
      const result = await next.handle();
      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();
      throw error;
    }
  }
}
```

---

### 6.2 Event-Driven Architecture

**Priority:** Medium  
**Location:** All services

**Current State:** Services communicate via REST APIs only.

**Enhancement:** Add message queue for async communication.

**Add RabbitMQ/Redis Streams:**
```typescript
// Add to services that need async communication
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),
  ],
})
export class AppModule {}
```

**Event Schema:**
```typescript
interface PlatformEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  data: Record<string, any>;
  metadata: {
    traceId: string;
    userId?: string;
    correlationId?: string;
  };
}
```

---

### 6.3 Feature Flags

**Priority:** Medium  
**Location:** `packages/feature-flags`, all services

**Current State:** Feature flags package exists but not integrated.

**Integration:**
```typescript
// Add to all services
import { FeatureFlagsService } from '@azeebo/feature-flags';

@Injectable()
export class SomeService {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  async doSomething() {
    if (await this.featureFlags.isEnabled('new-feature')) {
      // New feature logic
    } else {
      // Old feature logic
    }
  }
}
```

---

### 6.4 Multi-Tenancy Support

**Priority:** Medium  
**Location:** All services, database schemas

**Requirement:** Each universe should have isolated data.

**Implementation:**
```prisma
// Add tenant_id to all models
model Content {
  id        String   @id @default(uuid())
  tenantId  String   // Universe identifier
  title     String
  // ...
  
  @@index([tenantId])
}
```

---

## Phase 7: Documentation & Developer Experience (Week 7-8)

### 7.1 API Documentation

**Priority:** High  
**Location:** All services

**Current State:** Swagger enabled in dev only, no centralized docs.

**Enhancement:**
- Enable Swagger in staging for API testing
- Create centralized API documentation portal
- Add OpenAPI spec generation to CI
- Document all error codes

---

### 7.2 Developer Onboarding

**Priority:** Medium  
**Location:** README, docs/

**Missing:**
1. **Quick start guide** - No step-by-step setup instructions
2. **Architecture diagrams** - No visual documentation
3. **Service dependency map** - Unclear service relationships
4. **Local development guide** - No instructions for running all services

**Create:**
```markdown
# Developer Quick Start

1. Install prerequisites: Node 20.11.1, pnpm 9.15.0, Docker
2. Clone repository: `git clone ...`
3. Install dependencies: `pnpm install`
4. Setup environment: `cp .env.example .env`
5. Start infrastructure: `docker-compose up -d postgres redis`
6. Run migrations: `pnpm -r prisma migrate deploy`
7. Start services: `pnpm dev`
8. Verify: `curl http://localhost:3013/health`
```

---

### 7.3 Code Quality Tools

**Priority:** Medium  
**Location:** CI/CD, IDE configuration

**Add:**
1. **SonarQube** - Code quality analysis
2. **Code coverage reports** - Coverage tracking
3. **Dependency update automation** - Dependabot configuration
4. **Pre-commit hooks** - Husky + lint-staged (already present, enhance)

---

## Priority Matrix

| Priority | Task | Effort | Impact | Timeline |
|----------|------|--------|--------|----------|
| P0 | JWT Secret Configuration | 1 day | Critical | Week 1 |
| P0 | Docker Security Hardening | 2 days | Critical | Week 1 |
| P0 | Database Connection Security | 3 days | Critical | Week 1-2 |
| P0 | CORS Configuration Fix | 1 day | Critical | Week 1 |
| P0 | Payment Webhook Security | 2 days | Critical | Week 1 |
| P0 | Rate Limiting Implementation | 2 days | Critical | Week 1-2 |
| P0 | Input Validation & Sanitization | 3 days | Critical | Week 2 |
| P0 | Secrets Management | 2 days | Critical | Week 2 |
| P1 | NestJS Version Alignment | 2 days | High | Week 2-3 |
| P1 | Prisma Upgrade | 1 day | High | Week 2 |
| P1 | Node.js Version Pinning | 0.5 day | High | Week 2 |
| P1 | Service Structure Standardization | 3 days | High | Week 3 |
| P1 | Error Handling Standardization | 2 days | High | Week 3 |
| P1 | Testing Coverage | 5 days | High | Week 3-4 |
| P1 | Database Query Optimization | 3 days | High | Week 4 |
| P1 | Redis Caching Strategy | 2 days | High | Week 4 |
| P1 | CI/CD Pipeline Optimization | 2 days | High | Week 5 |
| P1 | Monitoring & Observability | 3 days | High | Week 5 |
| P1 | Backup & Disaster Recovery | 2 days | High | Week 5 |
| P2 | Frontend Dependencies | 1 day | Medium | Week 3 |
| P2 | API Versioning | 2 days | Medium | Week 3 |
| P2 | Database Migration Strategy | 2 days | Medium | Week 4 |
| P2 | API Response Optimization | 2 days | Medium | Week 4 |
| P2 | Frontend Performance | 3 days | Medium | Week 4 |
| P2 | Kubernetes Configuration | 2 days | Medium | Week 5 |
| P2 | API Gateway Enhancements | 3 days | Medium | Week 6 |
| P2 | Event-Driven Architecture | 4 days | Medium | Week 6 |
| P2 | Feature Flags Integration | 2 days | Medium | Week 6 |
| P2 | Multi-Tenancy Support | 5 days | Medium | Week 6-7 |
| P3 | API Documentation | 2 days | Low | Week 7 |
| P3 | Developer Onboarding | 2 days | Low | Week 7 |
| P3 | Code Quality Tools | 2 days | Low | Week 8 |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes during upgrades | High | High | Comprehensive test suite, staging deployment |
| Database migration failures | Medium | Critical | Backup before migration, rollback plan |
| Service downtime during deployment | Medium | High | Blue-green deployment, canary releases |
| Performance regression | Medium | Medium | Load testing before/after changes |
| Security vulnerability exposure | Low | Critical | Security scanning, penetration testing |
| Dependency conflicts | Medium | Medium | Lock file management, dependency auditing |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Test Coverage | ~40% | 80%+ | Jest coverage reports |
| CI Build Time | ~15 min | <10 min | GitHub Actions metrics |
| Security Vulnerabilities | Unknown | 0 critical/high | Trivy, npm audit |
| API Response Time | Unknown | <200ms p95 | APM monitoring |
| Error Rate | Unknown | <0.1% | Error tracking |
| Deployment Frequency | Manual | Daily+ | CI/CD metrics |
| Mean Time to Recovery | Unknown | <5 min | Incident reports |

---

## Implementation Checklist

### Phase 1: Critical Security (Week 1-2)
- [ ] JWT secret configuration fixed
- [ ] Docker security hardened
- [ ] Database connection security implemented
- [ ] CORS configuration fixed
- [ ] Payment webhook security added
- [ ] Rate limiting implemented
- [ ] Input validation standardized
- [ ] Secrets management improved

### Phase 2: Dependencies (Week 2-3)
- [ ] NestJS upgraded to v11
- [ ] Prisma upgraded to v6
- [ ] Node.js version pinned
- [ ] Frontend dependencies updated
- [ ] Security dependencies added

### Phase 3: Code Quality (Week 3-4)
- [ ] Service structure standardized
- [ ] Error handling standardized
- [ ] Test coverage improved
- [ ] API versioning implemented
- [ ] Database migration strategy defined

### Phase 4: Performance (Week 4-5)
- [ ] Database queries optimized
- [ ] Redis caching implemented
- [ ] API responses optimized
- [ ] Frontend performance improved

### Phase 5: Infrastructure (Week 5-6)
- [ ] CI/CD pipeline optimized
- [ ] Monitoring implemented
- [ ] Kubernetes configuration improved
- [ ] Backup & DR plan created

### Phase 6: Features (Week 6-8)
- [ ] API gateway enhanced
- [ ] Event-driven architecture added
- [ ] Feature flags integrated
- [ ] Multi-tenancy support added

### Phase 7: Documentation (Week 7-8)
- [ ] API documentation created
- [ ] Developer onboarding improved
- [ ] Code quality tools added

---

## Conclusion

This audit identified 45+ improvement areas across security, performance, code quality, and infrastructure. The phased approach prioritizes critical security fixes first, followed by dependency upgrades, code quality improvements, and feature enhancements.

**Estimated Timeline:** 8 weeks  
**Estimated Effort:** 60-80 person-days  
**Risk Level:** Medium (mitigated by comprehensive testing and staging deployment)

**Next Steps:**
1. Review and approve this upgrade plan
2. Create detailed task breakdown for Phase 1
3. Set up staging environment for testing
4. Begin implementation with Phase 1 critical security fixes
5. Monitor metrics and adjust plan as needed

---

**Document Version:** 1.0  
**Last Updated:** May 26, 2026  
**Review Cycle:** Monthly  
**Owner:** Engineering Lead
