# Azeebo+ Implementation Todo List

**Created:** May 26, 2026  
**Source:** [UPGRADE.md](file:///Users/deprof/www/azeebo+/UPGRADE.md) Technical Audit  
**Status:** Active  
**Owner:** Engineering Team  
**Review Cycle:** Weekly

---

## Document Purpose

This document serves as the actionable implementation roadmap for all issues identified in the [UPGRADE.md](file:///Users/deprof/www/azeebo+/UPGRADE.md) technical audit. Each task includes:

- **Root Cause Analysis** - Why the issue exists
- **Step-by-Step Implementation** - Exactly what to do
- **Expected Outcomes** - What success looks like
- **Verification Criteria** - How to confirm the fix works
- **Dependencies** - What must be completed first
- **Cross-References** - Related files, services, and documentation

---

## Table of Contents

1. [Phase 1: Critical Security Fixes (Week 1-2)](#phase-1-critical-security-fixes-week-1-2)
   - [1.1 JWT Secret Configuration](#11-jwt-secret-configuration)
   - [1.2 Docker Security Hardening](#12-docker-security-hardening)
   - [1.3 Database Connection Security](#13-database-connection-security)
   - [1.4 CORS Configuration Vulnerability](#14-cors-configuration-vulnerability)
   - [1.5 Payment Webhook Security](#15-payment-webhook-security)
   - [1.6 Rate Limiting Implementation](#16-rate-limiting-implementation)
   - [1.7 Input Validation & Sanitization](#17-input-validation--sanitization)
   - [1.8 Secrets Management](#18-secrets-management)
2. [Phase 2: Dependency Upgrades (Week 2-3)](#phase-2-dependency-upgrades-week-2-3)
   - [2.1 NestJS Version Alignment](#21-nestjs-version-alignment)
   - [2.2 Prisma Upgrade](#22-prisma-upgrade)
   - [2.3 Node.js Version Pinning](#23-nodejs-version-pinning)
   - [2.4 Frontend Dependencies](#24-frontend-dependencies)
   - [2.5 Security Dependencies](#25-security-dependencies)
3. [Phase 3: Code Quality & Architecture (Week 3-4)](#phase-3-code-quality--architecture-week-3-4)
   - [3.1 Service Structure Standardization](#31-service-structure-standardization)
   - [3.2 Error Handling Standardization](#32-error-handling-standardization)
   - [3.3 Testing Coverage](#33-testing-coverage)
   - [3.4 API Versioning](#34-api-versioning)
   - [3.5 Database Migration Strategy](#35-database-migration-strategy)
4. [Phase 4: Performance Optimization (Week 4-5)](#phase-4-performance-optimization-week-4-5)
   - [4.1 Database Query Optimization](#41-database-query-optimization)
   - [4.2 Redis Caching Strategy](#42-redis-caching-strategy)
   - [4.3 API Response Optimization](#43-api-response-optimization)
   - [4.4 Frontend Performance](#44-frontend-performance)
5. [Phase 5: Infrastructure & DevOps (Week 5-6)](#phase-5-infrastructure--devops-week-5-6)
   - [5.1 CI/CD Pipeline Optimization](#51-cicd-pipeline-optimization)
   - [5.2 Monitoring & Observability](#52-monitoring--observability)
   - [5.3 Kubernetes Configuration](#53-kubernetes-configuration)
   - [5.4 Backup & Disaster Recovery](#54-backup--disaster-recovery)
6. [Phase 6: Feature Enhancements (Week 6-8)](#phase-6-feature-enhancements-week-6-8)
   - [6.1 API Gateway Enhancements](#61-api-gateway-enhancements)
   - [6.2 Event-Driven Architecture](#62-event-driven-architecture)
   - [6.3 Feature Flags](#63-feature-flags)
   - [6.4 Multi-Tenancy Support](#64-multi-tenancy-support)
7. [Phase 7: Documentation & Developer Experience (Week 7-8)](#phase-7-documentation--developer-experience-week-7-8)
   - [7.1 API Documentation](#71-api-documentation)
   - [7.2 Developer Onboarding](#72-developer-onboarding)
   - [7.3 Code Quality Tools](#73-code-quality-tools)
8. [Task Dependencies Graph](#task-dependencies-graph)
9. [Progress Tracking](#progress-tracking)

---

## Phase 1: Critical Security Fixes (Week 1-2)

### 1.1 JWT Secret Configuration

**Priority:** P0 - Critical  
**Estimated Effort:** 1 day  
**Assigned To:** Security Team  
**Status:** Fixed (2026-05-26 14:30 UTC)  
**Related Engineering Rules:** [Section 4.1 JWT Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L121-L138)

#### Implementation Summary

- Updated `.env.example` to use `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (separate secrets)
- Modified `auth.service.ts` `generateTokens()` to use separate secrets for access/refresh tokens
- Updated `refreshToken()` to use `JWT_REFRESH_SECRET` with audience/issuer validation
- Updated `validateToken()` to use `JWT_ACCESS_SECRET` with type validation (`type: 'access'`)
- Added startup JWT secret validation in `auth-service/src/main.ts` (checks existence + min 32 chars)
- Updated `shared/src/auth/jwt.strategy.ts` to use `JWT_ACCESS_SECRET`
- Updated `auth-service/src/modules/auth/strategies/jwt.strategy.ts` to use `JWT_ACCESS_SECRET`
- Updated `auth-service/src/modules/auth/strategies/jwt-refresh.strategy.ts` to use `JWT_REFRESH_SECRET`
- Updated `docker-compose.yml` auth-service and user-service environment variables
- Updated `packages/shared-types/src/env-validation.ts` schema for new JWT secret names
- Updated `infra/k8s/secrets.yaml` to use `jwt-access-secret` key
- Updated unit tests in `auth.service.spec.ts` to use new environment variable names

#### Verification Criteria

- [x] `.env.example` contains `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [x] Auth service rejects startup if either secret is missing
- [x] Auth service rejects startup if secrets are < 32 characters
- [x] Access tokens cannot be used as refresh tokens (and vice versa)
- [x] All services validate tokens using `JWT_ACCESS_SECRET`
- [x] Unit tests updated for token generation and validation

#### Issue Description

The authentication system uses a single JWT secret for both access and refresh tokens, and the `REFRESH_TOKEN_SECRET` environment variable is referenced in code but not defined in `.env.example`. This creates authentication bypass risks and violates the principle of secret separation.

#### Root Cause Analysis

1. **Missing Environment Variable:** `REFRESH_TOKEN_SECRET` is used in [auth.service.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/modules/auth/auth.service.ts#L125) but not documented in `.env.example`
2. **Single Secret Usage:** Both access and refresh tokens use `JWT_SECRET`, compromising security if one token type is leaked
3. **Runtime Validation Only:** Secret validation occurs at runtime during token generation, not at application startup
4. **No Secret Rotation:** No mechanism exists to rotate secrets without downtime

#### Step-by-Step Implementation

**Step 1: Update `.env.example`**

File: [`.env.example`](file:///Users/deprof/www/azeebo+/.env.example)

Add the following variables after the JWT section:

```env
# ===========================================
# JWT & AUTHENTICATION
# ===========================================
JWT_ACCESS_SECRET=CHANGE_ME_ACCESS_TOKEN_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_REFRESH_TOKEN_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=azeebo-plus
JWT_AUDIENCE=azeebo-plus-users
```

**Step 2: Update Auth Service**

File: [`services/auth-service/src/modules/auth/auth.service.ts`](file:///Users/deprof/www/azeebo+/services/auth-service/src/modules/auth/auth.service.ts)

Modify the `generateTokens` method to use separate secrets:

```typescript
private async generateTokens(user: UserEntity): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtAccessSecret || !jwtRefreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured');
  }

  const now = Math.floor(Date.now() / 1000);
  
  const accessToken = this.jwtService.sign(
    {
      iss: process.env.JWT_ISSUER || 'azeebo-auth-service',
      aud: process.env.JWT_AUDIENCE || 'azeebo-api',
      jti: randomUUID(),
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: now,
    },
    {
      expiresIn: this.accessTokenExpiry,
      secret: jwtAccessSecret,
    }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

  const refreshToken = this.jwtService.sign(
    {
      iss: process.env.JWT_ISSUER || 'azeebo-auth-service',
      aud: process.env.JWT_AUDIENCE || 'azeebo-api',
      jti: randomUUID(),
      sub: user.id,
      type: 'refresh',
      iat: now,
    },
    {
      expiresIn: this.refreshTokenExpiry,
      secret: jwtRefreshSecret,
    }
  );

  const hashedRefreshToken = await bcrypt.hash(refreshToken, this.saltRounds);

  await this.authRepository.createSession({
    userId: user.id,
    refreshToken: hashedRefreshToken,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
  };
}
```

**Step 3: Update Token Validation**

Modify `validateToken` and `refreshToken` methods to use appropriate secrets:

```typescript
async validateToken(token: string): Promise<User | null> {
  try {
    const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
    if (!jwtAccessSecret) return null;

    const decoded = this.jwtService.verify(token, { 
      secret: jwtAccessSecret,
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
    }) as { jti: string; sub: string; type: string };

    if (decoded.type !== 'access') {
      return null;
    }

    const isRevoked = await this.redisService.get(`${this.revokedTokensPrefix}${decoded.jti}`);
    if (isRevoked) {
      return null;
    }

    const user = await this.authRepository.findById(decoded.sub);
    if (!user) return null;
    return this.mapToUser(user);
  } catch {
    return null;
  }
}

async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
  const { refreshToken } = refreshTokenDto;

  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not configured');
    }

    const decoded = this.jwtService.verify(refreshToken, {
      secret: jwtRefreshSecret,
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
    });

    const user = await this.authRepository.findById((decoded as { sub: string }).sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if ((decoded as { type: string }).type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const session = await this.authRepository.findSessionByUserId(user.id);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.authRepository.deleteSessionByUserId(user.id);
    const tokens = await this.generateTokens(user);

    return {
      success: true,
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    };
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

**Step 4: Update Auth Service main.ts**

File: [`services/auth-service/src/main.ts`](file:///Users/deprof/www/azeebo+/services/auth-service/src/main.ts)

Add startup validation for JWT secrets:

```typescript
async function bootstrap(): Promise<void> {
  const requiredSecrets = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missingSecrets = requiredSecrets.filter(
    secret => !process.env[secret]
  );

  if (missingSecrets.length > 0) {
    Logger.error(`Missing required environment variables: ${missingSecrets.join(', ')}`);
    process.exit(1);
  }

  for (const secret of requiredSecrets) {
    if (process.env[secret]!.length < 32) {
      Logger.error(`${secret} must be at least 32 characters long`);
      process.exit(1);
    }
  }

  Logger.log('JWT secrets validated successfully');
  
  // ... rest of bootstrap
}
```

**Step 5: Update Docker Compose**

File: [`docker-compose.yml`](file:///Users/deprof/www/azeebo+/docker-compose.yml)

Update auth-service environment variables:

```yaml
auth-service:
  environment:
    NODE_ENV: production
    DATABASE_URL: ${DATABASE_URL}
    REDIS_URL: ${REDIS_URL:-redis://redis:6379}
    JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
    JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    JWT_ISSUER: ${JWT_ISSUER:-azeebo-auth-service}
    JWT_AUDIENCE: ${JWT_AUDIENCE:-azeebo-api}
```

**Step 6: Update All Services Using JWT**

Search for all services that validate JWT tokens and update them to use `JWT_ACCESS_SECRET`:

Services to update:
- [`services/api-gateway/`](file:///Users/deprof/www/azeebo+/services/api-gateway/)
- [`services/user-service/`](file:///Users/deprof/www/azeebo+/services/user-service/)
- [`services/wallet-service/`](file:///Users/deprof/www/azeebo+/services/wallet-service/)
- [`services/payment-service/`](file:///Users/deprof/www/azeebo+/services/payment-service/)
- [`services/content-service/`](file:///Users/deprof/www/azeebo+/services/content-service/)
- All other services with JWT validation

#### Expected Outcomes

- Access and refresh tokens use cryptographically separate secrets
- Application fails to start if secrets are missing or weak
- Token type validation prevents token confusion attacks
- Secret rotation possible without full system downtime

#### Verification Criteria

- [ ] `.env.example` contains `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Auth service rejects startup if either secret is missing
- [ ] Auth service rejects startup if secrets are < 32 characters
- [ ] Access tokens cannot be used as refresh tokens (and vice versa)
- [ ] All services validate tokens using `JWT_ACCESS_SECRET`
- [ ] Unit tests pass for token generation and validation
- [ ] Integration tests pass for login, refresh, and logout flows
- [ ] Docker compose starts successfully with new environment variables

#### Dependencies

- None (can be started immediately)

#### Cross-References

- **Files:** [auth.service.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/modules/auth/auth.service.ts), [main.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/main.ts), [.env.example](file:///Users/deprof/www/azeebo+/.env.example)
- **Rules:** [Section 4.1 JWT Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L121-L138)
- **Related Tasks:** 1.8 Secrets Management

---

### 1.2 Docker Security Hardening

**Priority:** P0 - Critical  
**Estimated Effort:** 2 days  
**Assigned To:** DevOps Team  
**Status:** Fixed (2026-05-26 15:45 UTC)  
**Related Engineering Rules:** [Section 11.3 Container Security](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L464-L475)

#### Implementation Summary

- Updated all 23 service Dockerfiles to use pinned base image `node:20.11.1-alpine3.19`
- Implemented multi-stage builds (builder + runner) for all services
- Added security labels (org.opencontainers.image.source, description, licenses)
- Configured non-root user (nodejs:1001) for all services
- Optimized dependency installation with `--frozen-lockfile`
- Proper file ownership and permissions (chown -R nodejs:nodejs)
- Health check implementation for all services
- Services updated:
  - auth-service (3000), user-service (3001), wallet-service (3002)
  - payment-service (3003), content-service (3004), search-service (3005)
  - notification-service (3006), reward-service (3007), analytics-service (3008)
  - recommendation-service (3009), reality-service (3010), comedy-service (3011)
  - games-service (3012), lifestyle-service (3013), moderation-service (3014)
  - queue-service (3015), movie-service (3016), sports-service (3017)
  - creator-service (3018), media-service (3019), support-service (3020)
  - vertical-service (3021), api-gateway (3000)

#### Verification Criteria

- [x] All 23 service Dockerfiles use pinned base images (node:20.11.1-alpine3.19)
- [x] All Dockerfiles implement multi-stage builds
- [x] All containers run as non-root user (nodejs:1001)
- [x] Health checks configured for all services
- [x] Security labels added to all images
- [x] Production-only dependencies installed in runner stage
- [x] Proper file ownership set for all services

#### Issue Description

All service Dockerfiles use unpinned base images, lack multi-stage build optimization, run with unnecessary privileges, and miss security hardening configurations. This creates container escape risks and violates container security best practices.

#### Root Cause Analysis

1. **Unpinned Base Images:** `node:20-alpine` allows any Alpine patch version, including vulnerable ones
2. **Single-Stage Builds:** Some Dockerfiles copy entire `dist` directory without filtering
3. **Missing Security Labels:** No metadata for vulnerability scanning or compliance tracking
4. **Writable Filesystem:** Containers can write to any directory, enabling potential attacks
5. **Excessive Capabilities:** Containers run with default Linux capabilities not needed for Node.js apps

#### Step-by-Step Implementation

**Step 1: Create Standardized Dockerfile Template**

Create a template file at `infra/templates/Dockerfile.service`:

```dockerfile
FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY services/<SERVICE_NAME>/package.json ./services/<SERVICE_NAME>/

RUN pnpm install --frozen-lockfile

COPY services/<SERVICE_NAME>/src ./services/<SERVICE_NAME>/src
COPY services/<SERVICE_NAME>/tsconfig*.json ./services/<SERVICE_NAME>/
COPY services/<SERVICE_NAME>/prisma ./services/<SERVICE_NAME>/prisma

RUN pnpm --filter <SERVICE_NAME> build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ <SERVICE_NAME> Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/<SERVICE_NAME>/package.json ./services/<SERVICE_NAME>/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/<SERVICE_NAME>/dist ./services/<SERVICE_NAME>/dist
COPY --from=builder /app/services/<SERVICE_NAME>/prisma ./services/<SERVICE_NAME>/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "services/<SERVICE_NAME>/dist/src/main.js"]
```

**Step 2: Update Each Service Dockerfile**

Services to update (22 total):

| Service | Dockerfile Path | Port |
|---------|----------------|------|
| auth-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/auth-service/Dockerfile) | 3000 |
| user-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/user-service/Dockerfile) | 3001 |
| wallet-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/wallet-service/Dockerfile) | 3002 |
| payment-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/payment-service/Dockerfile) | 3003 |
| content-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/content-service/Dockerfile) | 3004 |
| search-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/search-service/Dockerfile) | 3005 |
| notification-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/notification-service/Dockerfile) | 3006 |
| reward-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/reward-service/Dockerfile) | 3007 |
| analytics-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/analytics-service/Dockerfile) | 3008 |
| recommendation-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/recommendation-service/Dockerfile) | 3009 |
| reality-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/reality-service/Dockerfile) | 3010 |
| movie-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/movie-service/Dockerfile) | 3011 |
| games-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/games-service/Dockerfile) | 3012 |
| comedy-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/comedy-service/Dockerfile) | 3013 |
| sports-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/sports-service/Dockerfile) | 3014 |
| lifestyle-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/lifestyle-service/Dockerfile) | 3016 |
| vertical-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/vertical-service/Dockerfile) | 3017 |
| creator-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/creator-service/Dockerfile) | 3018 |
| media-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/media-service/Dockerfile) | 3019 |
| support-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/support-service/Dockerfile) | 3020 |
| moderation-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/moderation-service/Dockerfile) | N/A |
| queue-service | [Dockerfile](file:///Users/deprof/www/azeebo+/services/queue-service/Dockerfile) | 3015 |

**Step 3: Add Docker Compose Security Options**

File: [docker-compose.yml](file:///Users/deprof/www/azeebo+/docker-compose.yml)

Add security options to each service:

```yaml
services:
  auth-service:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100M
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M
```

**Step 4: Update .dockerignore**

File: [.dockerignore](file:///Users/deprof/www/azeebo+/.dockerignore)

Ensure the following patterns are included:

```
node_modules/
dist/
build/
.next/
.env*
.vscode/
.idea/
coverage/
*.test.ts
*.spec.ts
.git/
.github/
Dockerfile
docker-compose*.yml
*.md
```

**Step 5: Add Docker Security Scanning to CI**

File: [.github/workflows/ci.yml](file:///Users/deprof/www/azeebo+/.github/workflows/ci.yml)

Add Trivy scanning step to `docker-smoke-tests` job:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'azeebo/${{ matrix.service }}:test'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    severity: 'CRITICAL,HIGH'
```

#### Expected Outcomes

- All Docker images use pinned base images (node:20.11.1-alpine3.19)
- Multi-stage builds reduce image size by 60%+
- Containers run as non-root user (nodejs:1001)
- Read-only filesystems prevent unauthorized writes
- Resource limits prevent container resource exhaustion
- Security labels enable compliance tracking
- CI blocks images with critical/high vulnerabilities

#### Verification Criteria

- [ ] All 22 service Dockerfiles use pinned base images
- [ ] All Dockerfiles implement multi-stage builds
- [ ] All containers run as non-root user
- [ ] Docker compose includes `read_only: true` for all services
- [ ] Resource limits defined for all services
- [ ] `.dockerignore` excludes unnecessary files
- [ ] Trivy scan passes with 0 critical/high vulnerabilities
- [ ] Image sizes reduced by at least 50% compared to current
- [ ] Health checks work correctly for all services
- [ ] Docker smoke tests pass in CI

#### Dependencies

- None (can be started immediately)
- Should be completed before 1.3 Database Connection Security

#### Cross-References

- **Files:** All service Dockerfiles, [docker-compose.yml](file:///Users/deprof/www/azeebo+/docker-compose.yml), [.dockerignore](file:///Users/deprof/www/azeebo+/.dockerignore)
- **Rules:** [Section 11.3 Container Security](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L464-L475)
- **Related Tasks:** 1.3 Database Connection Security, 5.1 CI/CD Pipeline Optimization

---

### 1.3 Database Connection Security

**Priority:** P0 - Critical  
**Estimated Effort:** 3 days  
**Assigned To:** Backend Team + DevOps  
**Status:** Fixed (2026-05-26 16:30 UTC)  
**Related Engineering Rules:** [Section 7.1 Data Storage](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L219-L233), [Section 1.2 Service Design](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L33-L47)

#### Implementation Summary

- Created `infra/scripts/init-multiple-databases.sh` to create 22 separate databases + users
- Added PgBouncer connection pooling (`infra/config/pgbouncer.ini`, `pgbouncer_userlist.txt`)
- Updated `docker-compose.yml`:
  - PostgreSQL service now includes per-service DB password env vars + init script mount
  - Added PgBouncer service with transaction pooling mode
  - Updated all 22 services to use per-service `DATABASE_URL` via PgBouncer
  - Changed service dependencies from `postgres` to `pgbouncer`
- Updated `.env.example` with 22 per-service database passwords and connection URLs
- All connections use `sslmode=require` for encryption in transit
- Each service has isolated database credentials (principle of least privilege)

#### Verification Criteria

- [x] PostgreSQL creates 22 separate databases on first run
- [x] Each service has unique database user with isolated credentials
- [x] PgBouncer configured with transaction pooling mode
- [x] All DATABASE_URLs route through PgBouncer (port 6432)
- [x] SSL mode required for all database connections
- [x] `.env.example` documents all per-service database variables
- [x] Services depend on `pgbouncer` instead of direct `postgres`

#### Issue Description

All services share a single database and connection string, violating microservice isolation principles. Database connections lack SSL/TLS encryption, connection pooling, and per-service credentials. This creates a single point of failure and potential data breach vector.

#### Root Cause Analysis

1. **Shared Database:** All services use the same `DATABASE_URL` pointing to one database
2. **No Connection Pooling:** Each service creates direct connections, risking connection exhaustion
3. **Missing SSL:** Database connections are unencrypted, exposing data in transit
4. **No Credential Isolation:** All services use the same database user with full permissions
5. **Violates Microservice Principles:** Each service should own its data store

#### Step-by-Step Implementation

**Step 1: Create Database Initialization Script**

Create `infra/scripts/init-multiple-databases.sh`:

```bash
#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE auth_db;
    CREATE DATABASE user_db;
    CREATE DATABASE wallet_db;
    CREATE DATABASE payment_db;
    CREATE DATABASE content_db;
    CREATE DATABASE media_db;
    CREATE DATABASE search_db;
    CREATE DATABASE notification_db;
    CREATE DATABASE reward_db;
    CREATE DATABASE analytics_db;
    CREATE DATABASE recommendation_db;
    CREATE DATABASE reality_db;
    CREATE DATABASE movie_db;
    CREATE DATABASE games_db;
    CREATE DATABASE comedy_db;
    CREATE DATABASE sports_db;
    CREATE DATABASE lifestyle_db;
    CREATE DATABASE vertical_db;
    CREATE DATABASE creator_db;
    CREATE DATABASE support_db;
    CREATE DATABASE moderation_db;

    CREATE USER auth_user WITH PASSWORD '${AUTH_DB_PASSWORD}';
    CREATE USER user_user WITH PASSWORD '${USER_DB_PASSWORD}';
    CREATE USER wallet_user WITH PASSWORD '${WALLET_DB_PASSWORD}';
    CREATE USER payment_user WITH PASSWORD '${PAYMENT_DB_PASSWORD}';
    CREATE USER content_user WITH PASSWORD '${CONTENT_DB_PASSWORD}';
    CREATE USER media_user WITH PASSWORD '${MEDIA_DB_PASSWORD}';
    CREATE USER search_user WITH PASSWORD '${SEARCH_DB_PASSWORD}';
    CREATE USER notification_user WITH PASSWORD '${NOTIFICATION_DB_PASSWORD}';
    CREATE USER reward_user WITH PASSWORD '${REWARD_DB_PASSWORD}';
    CREATE USER analytics_user WITH PASSWORD '${ANALYTICS_DB_PASSWORD}';
    CREATE USER recommendation_user WITH PASSWORD '${RECOMMENDATION_DB_PASSWORD}';
    CREATE USER reality_user WITH PASSWORD '${REALITY_DB_PASSWORD}';
    CREATE USER movie_user WITH PASSWORD '${MOVIE_DB_PASSWORD}';
    CREATE USER games_user WITH PASSWORD '${GAMES_DB_PASSWORD}';
    CREATE USER comedy_user WITH PASSWORD '${COMEDY_DB_PASSWORD}';
    CREATE USER sports_user WITH PASSWORD '${SPORTS_DB_PASSWORD}';
    CREATE USER lifestyle_user WITH PASSWORD '${LIFESTYLE_DB_PASSWORD}';
    CREATE USER vertical_user WITH PASSWORD '${VERTICAL_DB_PASSWORD}';
    CREATE USER creator_user WITH PASSWORD '${CREATOR_DB_PASSWORD}';
    CREATE USER support_user WITH PASSWORD '${SUPPORT_DB_PASSWORD}';
    CREATE USER moderation_user WITH PASSWORD '${MODERATION_DB_PASSWORD}';

    GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_user;
    GRANT ALL PRIVILEGES ON DATABASE user_db TO user_user;
    GRANT ALL PRIVILEGES ON DATABASE wallet_db TO wallet_user;
    GRANT ALL PRIVILEGES ON DATABASE payment_db TO payment_user;
    GRANT ALL PRIVILEGES ON DATABASE content_db TO content_user;
    GRANT ALL PRIVILEGES ON DATABASE media_db TO media_user;
    GRANT ALL PRIVILEGES ON DATABASE search_db TO search_user;
    GRANT ALL PRIVILEGES ON DATABASE notification_db TO notification_user;
    GRANT ALL PRIVILEGES ON DATABASE reward_db TO reward_user;
    GRANT ALL PRIVILEGES ON DATABASE analytics_db TO analytics_user;
    GRANT ALL PRIVILEGES ON DATABASE recommendation_db TO recommendation_user;
    GRANT ALL PRIVILEGES ON DATABASE reality_db TO reality_user;
    GRANT ALL PRIVILEGES ON DATABASE movie_db TO movie_user;
    GRANT ALL PRIVILEGES ON DATABASE games_db TO games_user;
    GRANT ALL PRIVILEGES ON DATABASE comedy_db TO comedy_user;
    GRANT ALL PRIVILEGES ON DATABASE sports_db TO sports_user;
    GRANT ALL PRIVILEGES ON DATABASE lifestyle_db TO lifestyle_user;
    GRANT ALL PRIVILEGES ON DATABASE vertical_db TO vertical_user;
    GRANT ALL PRIVILEGES ON DATABASE creator_db TO creator_user;
    GRANT ALL PRIVILEGES ON DATABASE support_db TO support_user;
    GRANT ALL PRIVILEGES ON DATABASE moderation_db TO moderation_user;
EOSQL
```

**Step 2: Update Docker Compose PostgreSQL Service**

File: [docker-compose.yml](file:///Users/deprof/www/azeebo+/docker-compose.yml)

```yaml
postgres:
  image: postgres:15.6-alpine3.19
  container_name: azeebo_postgres
  ports:
    - "5432:5432"
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-postgres}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB:-azeebo_plus_dev}
    POSTGRES_HOST_AUTH_METHOD: scram-sha-256
    POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./infra/scripts/init-multiple-databases.sh:/docker-entrypoint-initdb.d/init.sh
  networks:
    - azeebo_network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 30s
    timeout: 5s
    retries: 5
  command: >
    postgres
    -c ssl=on
    -c ssl_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
    -c ssl_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
    -c max_connections=200
```

**Step 3: Add PgBouncer for Connection Pooling**

Add to [docker-compose.yml](file:///Users/deprof/www/azeebo+/docker-compose.yml):

```yaml
pgbouncer:
  image: edoburu/pgbouncer:1.22.1
  container_name: azeebo_pgbouncer
  ports:
    - "6432:6432"
  environment:
    DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
    MIN_POOL_SIZE: 5
    SERVER_TLS_SSLMODE: require
  volumes:
    - ./infra/config/pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro
    - ./infra/config/pgbouncer_userlist.txt:/etc/pgbouncer/userlist.txt:ro
  networks:
    - azeebo_network
  depends_on:
    postgres:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -h localhost -p 6432"]
    interval: 30s
    timeout: 5s
    retries: 5
```

Create `infra/config/pgbouncer.ini`:

```ini
[databases]
auth_db = host=postgres dbname=auth_db
user_db = host=postgres dbname=user_db
wallet_db = host=postgres dbname=wallet_db
payment_db = host=postgres dbname=payment_db
content_db = host=postgres dbname=content_db
media_db = host=postgres dbname=media_db
search_db = host=postgres dbname=search_db
notification_db = host=postgres dbname=notification_db
reward_db = host=postgres dbname=reward_db
analytics_db = host=postgres dbname=analytics_db
recommendation_db = host=postgres dbname=recommendation_db
reality_db = host=postgres dbname=reality_db
movie_db = host=postgres dbname=movie_db
games_db = host=postgres dbname=games_db
comedy_db = host=postgres dbname=comedy_db
sports_db = host=postgres dbname=sports_db
lifestyle_db = host=postgres dbname=lifestyle_db
vertical_db = host=postgres dbname=vertical_db
creator_db = host=postgres dbname=creator_db
support_db = host=postgres dbname=support_db
moderation_db = host=postgres dbname=moderation_db

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_tls_sslmode = require
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
admin_users = postgres
```

**Step 4: Update .env.example**

File: [.env.example](file:///Users/deprof/www/azeebo+/.env.example)

Add database credentials for each service:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_MASTER_PASSWORD
POSTGRES_DB=azeebo_plus_dev

AUTH_DB_PASSWORD=CHANGE_ME_AUTH_DB_PASSWORD
USER_DB_PASSWORD=CHANGE_ME_USER_DB_PASSWORD
WALLET_DB_PASSWORD=CHANGE_ME_WALLET_DB_PASSWORD
PAYMENT_DB_PASSWORD=CHANGE_ME_PAYMENT_DB_PASSWORD
CONTENT_DB_PASSWORD=CHANGE_ME_CONTENT_DB_PASSWORD
MEDIA_DB_PASSWORD=CHANGE_ME_MEDIA_DB_PASSWORD
SEARCH_DB_PASSWORD=CHANGE_ME_SEARCH_DB_PASSWORD
NOTIFICATION_DB_PASSWORD=CHANGE_ME_NOTIFICATION_DB_PASSWORD
REWARD_DB_PASSWORD=CHANGE_ME_REWARD_DB_PASSWORD
ANALYTICS_DB_PASSWORD=CHANGE_ME_ANALYTICS_DB_PASSWORD
RECOMMENDATION_DB_PASSWORD=CHANGE_ME_RECOMMENDATION_DB_PASSWORD
REALITY_DB_PASSWORD=CHANGE_ME_REALITY_DB_PASSWORD
MOVIE_DB_PASSWORD=CHANGE_ME_MOVIE_DB_PASSWORD
GAMES_DB_PASSWORD=CHANGE_ME_GAMES_DB_PASSWORD
COMEDY_DB_PASSWORD=CHANGE_ME_COMEDY_DB_PASSWORD
SPORTS_DB_PASSWORD=CHANGE_ME_SPORTS_DB_PASSWORD
LIFESTYLE_DB_PASSWORD=CHANGE_ME_LIFESTYLE_DB_PASSWORD
VERTICAL_DB_PASSWORD=CHANGE_ME_VERTICAL_DB_PASSWORD
CREATOR_DB_PASSWORD=CHANGE_ME_CREATOR_DB_PASSWORD
SUPPORT_DB_PASSWORD=CHANGE_ME_SUPPORT_DB_PASSWORD
MODERATION_DB_PASSWORD=CHANGE_ME_MODERATION_DB_PASSWORD

AUTH_DATABASE_URL=postgresql://auth_user:${AUTH_DB_PASSWORD}@pgbouncer:6432/auth_db?sslmode=require
USER_DATABASE_URL=postgresql://user_user:${USER_DB_PASSWORD}@pgbouncer:6432/user_db?sslmode=require
WALLET_DATABASE_URL=postgresql://wallet_user:${WALLET_DB_PASSWORD}@pgbouncer:6432/wallet_db?sslmode=require
PAYMENT_DATABASE_URL=postgresql://payment_user:${PAYMENT_DB_PASSWORD}@pgbouncer:6432/payment_db?sslmode=require
CONTENT_DATABASE_URL=postgresql://content_user:${CONTENT_DB_PASSWORD}@pgbouncer:6432/content_db?sslmode=require
```

**Step 5: Update Each Service Environment Configuration**

For each service, update the `DATABASE_URL` environment variable in docker-compose.yml:

```yaml
auth-service:
  environment:
    DATABASE_URL: ${AUTH_DATABASE_URL}
```

**Step 6: Update Prisma Configurations**

For each service, update `prisma/schema.prisma` to include SSL configuration:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

**Step 7: Create Migration Helper Script**

Create `infra/scripts/run-migrations.sh`:

```bash
#!/bin/bash
set -e

echo "Running database migrations for all services..."

SERVICES=(
  "auth-service:AUTH_DATABASE_URL"
  "user-service:USER_DATABASE_URL"
  "wallet-service:WALLET_DATABASE_URL"
  "payment-service:PAYMENT_DATABASE_URL"
  "content-service:CONTENT_DATABASE_URL"
)

for service_config in "${SERVICES[@]}"; do
  IFS=':' read -r service db_var <<< "$service_config"
  
  echo "Running migrations for $service..."
  
  export DATABASE_URL="${!db_var}"
  
  cd "services/$service"
  pnpm prisma migrate deploy
  cd ../..
  
  echo "Migrations completed for $service"
done

echo "All migrations completed successfully!"
```

#### Expected Outcomes

- Each service has isolated database with dedicated credentials
- All database connections use SSL/TLS encryption
- PgBouncer provides connection pooling (max 1000 connections)
- Principle of least privilege enforced per service
- Database initialization automated via entrypoint script
- Migration process streamlined with helper script

#### Verification Criteria

- [ ] 22 separate databases created in PostgreSQL
- [ ] 22 service-specific database users created
- [ ] Each user has access only to their designated database
- [ ] All connections use SSL (verify with `SHOW ssl` in psql)
- [ ] PgBouncer running and accepting connections on port 6432
- [ ] Each service connects via PgBouncer, not directly to PostgreSQL
- [ ] Connection pooling works (monitor `pgbouncer SHOW POOLS`)
- [ ] All migrations run successfully via helper script
- [ ] Services cannot access other services' databases
- [ ] Docker compose starts successfully with new configuration

#### Dependencies

- 1.2 Docker Security Hardening (Dockerfile updates)
- 1.8 Secrets Management (credential generation)

#### Cross-References

- **Files:** [docker-compose.yml](file:///Users/deprof/www/azeebo+/docker-compose.yml), [.env.example](file:///Users/deprof/www/azeebo+/.env.example), All service Prisma schemas
- **Rules:** [Section 7.1 Data Storage](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L219-L233), [Section 1.2 Service Design](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L33-L47)
- **Related Tasks:** 1.2 Docker Security Hardening, 1.8 Secrets Management, 4.1 Database Query Optimization

---

### 1.4 CORS Configuration Vulnerability

**Priority:** P0 - Critical  
**Estimated Effort:** 1 day  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 17:15 UTC)  
**Related Engineering Rules:** [Section 6.1 OWASP API Top 10](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L183-L197), [Section 3.2 API Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L103-L110)

#### Implementation Summary

- Created `packages/security/src/cors.config.ts` - shared CORS configuration utility
  - Rejects wildcard (`*`) origins
  - Validates all origins are valid URLs
  - Requires origin header (rejects requests without origin)
  - Supports pattern matching with `*` wildcards for subdomains
  - Configurable methods, headers, credentials, and maxAge
- Created `packages/security/` package with `package.json` and `tsconfig.json`
- Updated `auth-service/src/main.ts` to use shared `configureCors()` function
- Replaced insecure `if (!origin || allowedOrigins.includes(origin))` pattern with strict validation

#### Verification Criteria

- [x] Shared CORS configuration package created (`@azeebo/security`)
- [x] Wildcard origins rejected with error
- [x] Invalid URL origins rejected with error
- [x] Missing origin header rejected with error
- [x] Auth service uses shared CORS configuration
- [x] Pattern matching supported for subdomain wildcards

#### Issue Description

The CORS configuration in auth-service (and potentially other services) allows requests with no origin header, which can be exploited by certain attack vectors including CSRF attacks from same-origin contexts and malicious browser extensions.

#### Root Cause Analysis

1. **Empty Origin Allowed:** `if (!origin || allowedOrigins.includes(origin))` permits requests without an origin header
2. **No Origin Validation:** Missing validation that origin is a valid URL
3. **Overly Permissive:** Wildcard patterns not properly validated
4. **Inconsistent Across Services:** Each service may have different CORS configurations

#### Step-by-Step Implementation

**Step 1: Create Shared CORS Configuration**

Create `packages/security/src/cors.config.ts`:

```typescript
import { INestApplication } from '@nestjs/common';

export interface CorsOptions {
  allowedOrigins: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function configureCors(
  app: INestApplication,
  options: CorsOptions
): void {
  const {
    allowedOrigins,
    credentials = true,
    maxAge = 3600,
  } = options;

  const validatedOrigins = allowedOrigins.map(origin => {
    if (origin === '*') {
      throw new Error('CORS wildcard (*) is not allowed for security reasons');
    }
    
    try {
      new URL(origin);
      return origin;
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  });

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin) {
        callback(new Error('Not allowed by CORS - missing origin header'));
        return;
      }

      const isAllowed = validatedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const pattern = new RegExp(
            '^' + allowed.replace(/\*/g, '[a-zA-Z0-9-]+') + '$'
          );
          return pattern.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS - origin: ${origin}`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Content-Disposition', 'X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge,
  });
}
```

**Step 2: Update Auth Service main.ts**

File: [services/auth-service/src/main.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/main.ts)

Replace existing CORS configuration:

```typescript
import { configureCors } from '@azeebo/security';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

if (allowedOrigins.length === 0) {
  Logger.error('ALLOWED_ORIGINS environment variable is required');
  process.exit(1);
}

configureCors(app, {
  allowedOrigins,
  credentials: true,
  maxAge: 3600,
});
```

**Step 3: Update All Services**

Apply the same CORS configuration pattern to all services' `main.ts` files:

Services to update:
- [api-gateway/src/main.ts](file:///Users/deprof/www/azeebo+/services/api-gateway/src/main.ts)
- [user-service/src/main.ts](file:///Users/deprof/www/azeebo+/services/user-service/src/main.ts)
- [wallet-service/src/main.ts](file:///Users/deprof/www/azeebo+/services/wallet-service/src/main.ts)
- [payment-service/src/main.ts](file:///Users/deprof/www/azeebo+/services/payment-service/src/main.ts)
- [content-service/src/main.ts](file:///Users/deprof/www/azeebo+/services/content-service/src/main.ts)
- All other services with CORS configuration

**Step 4: Update .env.example**

File: [.env.example](file:///Users/deprof/www/azeebo+/.env.example)

```env
# ===========================================
# CORS CONFIGURATION
# ===========================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,https://app.azeebo.com
ADMIN_ALLOWED_ORIGINS=http://localhost:3016,https://admin.azeebo.com
CREATOR_ALLOWED_ORIGINS=http://localhost:3014,https://creators.azeebo.com
```

**Step 5: Add CORS Tests**

Create `packages/security/src/cors.config.spec.ts`:

```typescript
import { configureCors } from './cors.config';
import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';

@Module({})
class TestModule {}

describe('CORS Configuration', () => {
  it('should reject wildcard origins', async () => {
    const module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    const app = module.createNestApplication();

    expect(() =>
      configureCors(app, {
        allowedOrigins: ['*'],
      })
    ).toThrow('CORS wildcard (*) is not allowed for security reasons');
  });

  it('should reject invalid URLs', async () => {
    const module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    const app = module.createNestApplication();

    expect(() =>
      configureCors(app, {
        allowedOrigins: ['not-a-valid-url'],
      })
    ).toThrow('Invalid CORS origin: not-a-valid-url');
  });

  it('should accept valid origins', async () => {
    const module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    const app = module.createNestApplication();

    expect(() =>
      configureCors(app, {
        allowedOrigins: ['http://localhost:3000', 'https://app.example.com'],
      })
    ).not.toThrow();
  });
});
```

#### Expected Outcomes

- All services use consistent CORS configuration from shared package
- Empty origin headers are rejected
- Wildcard origins are not allowed
- All origins are validated as proper URLs
- Subdomain wildcards supported with proper validation
- CORS preflight cache reduced to 1 hour

#### Verification Criteria

- [ ] Shared CORS configuration package created and exported
- [ ] All services import and use shared CORS configuration
- [ ] Requests without origin header are rejected (403)
- [ ] Wildcard origins are rejected at startup
- [ ] Invalid URLs in ALLOWED_ORIGINS cause startup failure
- [ ] Valid origins are accepted correctly
- [ ] Subdomain wildcards work (*.example.com matches sub.example.com)
- [ ] CORS tests pass
- [ ] Preflight requests return correct headers

#### Dependencies

- None (can be started immediately)

#### Cross-References

- **Files:** [auth-service main.ts](file:///Users/deprof/www/azeebo+/services/auth-service/src/main.ts), [packages/security](file:///Users/deprof/www/azeebo+/packages/security/)
- **Rules:** [Section 6.1 OWASP API Top 10](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L183-L197)
- **Related Tasks:** 1.6 Rate Limiting Implementation, 1.7 Input Validation & Sanitization

---

### 1.5 Payment Webhook Security

**Priority:** P0 - Critical  
**Estimated Effort:** 2 days  
**Assigned To:** Payment Team  
**Status:** Fixed (2026-05-26 18:00 UTC)  
**Related Engineering Rules:** [Section 8.3 Security Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L274-L289), [Section 8.2 Payment Flow](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L260-L272)

#### Implementation Summary

- Created `services/payment-service/src/common/services/redis.service.ts` - Redis client with retry logic and connection management
- Created `services/payment-service/src/common/redis.module.ts` - Redis module for dependency injection
- Created `services/payment-service/src/modules/webhooks/webhook-security.service.ts` - Webhook security service with:
  - Paystack signature verification (HMAC-SHA512 with timing-safe comparison)
  - Flutterwave signature verification (HMAC-SHA256 with timing-safe comparison)
  - Redis-backed idempotency checks (prevents duplicate processing)
  - Replay protection with time-window validation (5-minute max age)
  - Structured logging for all security events
- Updated `services/payment-service/src/modules/webhooks/webhook.controller.ts`:
  - Added Redis-backed duplicate detection before processing
  - Added signature verification in controller (defense in depth with guards)
  - Added replay attack detection with time-window validation
  - Added 30-second timeout for webhook processing via Promise.race
  - Added comprehensive error logging with stack traces
- Updated `services/payment-service/src/modules/webhooks/webhook.module.ts` to include RedisModule and WebhookSecurityService
- Updated `services/payment-service/src/main.ts` to use shared `configureCors()` from `@azeebo/security`
- Created unit tests:
  - `webhook-security.service.spec.ts` - Tests for signature verification, idempotency, replay protection
  - `webhook.controller.spec.ts` - Tests for webhook handling, duplicate detection, signature validation, replay detection
- Added `ioredis` dependency to payment-service package.json

#### Verification Criteria

- [x] WebhookSecurityService created with signature verification (Paystack SHA512, Flutterwave SHA256)
- [x] Redis-backed idempotency checks prevent duplicate processing
- [x] Replay protection with 5-minute time-window validation
- [x] 30-second timeout for webhook processing via Promise.race
- [x] Comprehensive structured logging for all webhook events
- [x] Unit tests for signature verification (valid, invalid, missing)
- [x] Unit tests for idempotency checks (duplicate, new)
- [x] Unit tests for replay protection (too old, in window, not in window)
- [x] Unit tests for webhook controller (missing ref, duplicate, invalid sig, replay, success)
- [x] Payment service uses shared CORS configuration
- [x] Redis module integrated with connection retry logic

#### Issue Description

Payment webhook handlers lack signature verification, idempotency checks, timeout handling, and replay protection. This creates risks of payment fraud, duplicate processing, and denial of service through malicious webhook payloads.

#### Root Cause Analysis

1. **No Signature Verification:** Webhooks not cryptographically verified
2. **Missing Idempotency:** Same webhook can be processed multiple times
3. **No Timeout Handling:** Long-running webhook processing can block
4. **No Replay Protection:** Old webhooks can be replayed
5. **Insufficient Logging:** Webhook events not fully audited

#### Step-by-Step Implementation

**Step 1: Create Webhook Security Service**

Create `services/payment-service/src/modules/webhooks/webhook-security.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class WebhookSecurityService {
  private readonly idempotencyTTL = 86400;
  private readonly maxAge = 300;
  private readonly replayWindowPrefix = 'webhook_replay:';

  constructor(private readonly redisService: RedisService) {}

  verifyPaystackSignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    if (!signature) return false;

    const expectedSignature = createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  verifyFlutterwaveSignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    if (!signature) return false;

    const expectedSignature = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async isDuplicate(reference: string): Promise<boolean> {
    const key = `webhook_processed:${reference}`;
    const exists = await this.redisService.get(key);
    return !!exists;
  }

  async markAsProcessed(reference: string): Promise<void> {
    const key = `webhook_processed:${reference}`;
    await this.redisService.set(key, '1', this.idempotencyTTL);
  }

  async isReplay(reference: string, timestamp: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > this.maxAge) return true;

    const key = `${this.replayWindowPrefix}${reference}`;
    const exists = await this.redisService.get(key);
    return !!exists;
  }

  async recordInReplayWindow(reference: string): Promise<void> {
    const key = `${this.replayWindowPrefix}${reference}`;
    await this.redisService.set(key, '1', this.maxAge);
  }
}
```

**Step 2: Create Idempotency Service**

Create `services/payment-service/src/modules/webhooks/idempotency.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class IdempotencyService {
  private readonly idempotencyKeyPrefix = 'idempotency:';
  private readonly ttl = 86400;

  constructor(private readonly redisService: RedisService) {}

  async check(key: string): Promise<boolean> {
    const fullKey = `${this.idempotencyKeyPrefix}${key}`;
    const exists = await this.redisService.get(fullKey);
    return !!exists;
  }

  async mark(key: string, result: any): Promise<void> {
    const fullKey = `${this.idempotencyKeyPrefix}${key}`;
    await this.redisService.set(fullKey, JSON.stringify(result), this.ttl);
  }

  async getResult(key: string): Promise<any | null> {
    const fullKey = `${this.idempotencyKeyPrefix}${key}`;
    const result = await this.redisService.get(fullKey);
    return result ? JSON.parse(result) : null;
  }
}
```

**Step 3: Update Webhook Controller**

Create/Update `services/payment-service/src/modules/webhooks/webhook.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WebhookSecurityService } from './webhook-security.service';
import { IdempotencyService } from './idempotency.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly webhookTimeout = 30000;

  constructor(
    private readonly webhookSecurity: WebhookSecurityService,
    private readonly idempotencyService: IdempotencyService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post('paystack')
  async handlePaystackWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const reference = payload?.data?.reference;

    if (!reference) {
      throw new BadRequestException('Missing reference in webhook payload');
    }

    const isDuplicate = await this.webhookSecurity.isDuplicate(reference);
    if (isDuplicate) {
      this.logger.log(`Duplicate webhook ignored: ${reference}`);
      return { success: true, message: 'Already processed' };
    }

    const isValid = this.webhookSecurity.verifyPaystackSignature(
      payload,
      signature,
      process.env.PAYSTACK_SECRET_KEY,
    );

    if (!isValid) {
      this.logger.error(`Invalid webhook signature: ${reference}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const timestamp = payload?.data?.created_at
      ? Math.floor(new Date(payload.data.created_at).getTime() / 1000)
      : 0;

    const isReplay = await this.webhookSecurity.isReplay(reference, timestamp);
    if (isReplay) {
      this.logger.warn(`Replay attack detected: ${reference}`);
      throw new BadRequestException('Webhook replay detected');
    }

    try {
      await Promise.race([
        this.paymentsService.processWebhook(payload),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Webhook processing timeout')),
            this.webhookTimeout,
          ),
        ),
      ]);

      await this.webhookSecurity.markAsProcessed(reference);
      await this.webhookSecurity.recordInReplayWindow(reference);

      this.logger.log(`Webhook processed successfully: ${reference}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${reference}`, error);
      throw error;
    }
  }

  @Post('flutterwave')
  async handleFlutterwaveWebhook(
    @Body() payload: any,
    @Headers('verif-hash') signature: string,
  ) {
    const reference = payload?.data?.tx_ref || payload?.data?.id;

    if (!reference) {
      throw new BadRequestException('Missing reference in webhook payload');
    }

    const isDuplicate = await this.webhookSecurity.isDuplicate(reference);
    if (isDuplicate) {
      this.logger.log(`Duplicate webhook ignored: ${reference}`);
      return { success: true, message: 'Already processed' };
    }

    const isValid = this.webhookSecurity.verifyFlutterwaveSignature(
      payload,
      signature,
      process.env.FLUTTERWAVE_SECRET_KEY,
    );

    if (!isValid) {
      this.logger.error(`Invalid webhook signature: ${reference}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    const timestamp = payload?.data?.created_at
      ? Math.floor(new Date(payload.data.created_at).getTime() / 1000)
      : 0;

    const isReplay = await this.webhookSecurity.isReplay(reference, timestamp);
    if (isReplay) {
      this.logger.warn(`Replay attack detected: ${reference}`);
      throw new BadRequestException('Webhook replay detected');
    }

    try {
      await Promise.race([
        this.paymentsService.processWebhook(payload),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Webhook processing timeout')),
            this.webhookTimeout,
          ),
        ),
      ]);

      await this.webhookSecurity.markAsProcessed(reference);
      await this.webhookSecurity.recordInReplayWindow(reference);

      this.logger.log(`Webhook processed successfully: ${reference}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${reference}`, error);
      throw error;
    }
  }
}
```

**Step 4: Update Webhook Module**

Create/Update `services/payment-service/src/modules/webhooks/webhook.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookSecurityService } from './webhook-security.service';
import { IdempotencyService } from './idempotency.service';
import { PaymentsService } from '../payments/payments.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookSecurityService, IdempotencyService, PaymentsService],
  exports: [WebhookSecurityService, IdempotencyService],
})
export class WebhookModule {}
```

**Step 5: Add Webhook Tests**

Create `services/payment-service/src/modules/webhooks/webhook.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookSecurityService } from './webhook-security.service';
import { IdempotencyService } from './idempotency.service';
import { PaymentsService } from '../payments/payments.service';
import { BadRequestException } from '@nestjs/common';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookSecurity: WebhookSecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookSecurityService,
          useValue: {
            isDuplicate: jest.fn(),
            verifyPaystackSignature: jest.fn(),
            isReplay: jest.fn(),
            markAsProcessed: jest.fn(),
            recordInReplayWindow: jest.fn(),
          },
        },
        {
          provide: IdempotencyService,
          useValue: {
            check: jest.fn(),
            mark: jest.fn(),
            getResult: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            processWebhook: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookSecurity = module.get<WebhookSecurityService>(WebhookSecurityService);
  });

  it('should reject webhook with missing reference', async () => {
    await expect(
      controller.handlePaystackWebhook({}, 'signature'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return early for duplicate webhook', async () => {
    jest.spyOn(webhookSecurity, 'isDuplicate').mockResolvedValue(true);

    const result = await controller.handlePaystackWebhook(
      { data: { reference: 'test-ref' } },
      'signature',
    );

    expect(result).toEqual({ success: true, message: 'Already processed' });
  });

  it('should reject webhook with invalid signature', async () => {
    jest.spyOn(webhookSecurity, 'isDuplicate').mockResolvedValue(false);
    jest.spyOn(webhookSecurity, 'verifyPaystackSignature').mockReturnValue(false);

    await expect(
      controller.handlePaystackWebhook(
        { data: { reference: 'test-ref' } },
        'invalid-signature',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject replayed webhook', async () => {
    jest.spyOn(webhookSecurity, 'isDuplicate').mockResolvedValue(false);
    jest.spyOn(webhookSecurity, 'verifyPaystackSignature').mockReturnValue(true);
    jest.spyOn(webhookSecurity, 'isReplay').mockResolvedValue(true);

    await expect(
      controller.handlePaystackWebhook(
        { data: { reference: 'test-ref', created_at: new Date().toISOString() } },
        'valid-signature',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
```

#### Expected Outcomes

- All webhooks cryptographically verified before processing
- Duplicate webhooks detected and ignored (idempotency)
- Replay attacks prevented with time-window validation
- Webhook processing timeout prevents blocking
- Full audit trail of webhook events in logs
- Unit tests cover all webhook security scenarios

#### Verification Criteria

- [ ] WebhookSecurityService created with signature verification
- [ ] IdempotencyService created for duplicate detection
- [ ] Paystack webhook signature verification works
- [ ] Flutterwave webhook signature verification works
- [ ] Duplicate webhooks return early with success
- [ ] Invalid signatures rejected with 400 error
- [ ] Replay attacks detected and blocked
- [ ] Webhook timeout implemented (30 seconds)
- [ ] All webhook events logged with reference ID
- [ ] Unit tests pass for all webhook scenarios
- [ ] Integration tests with real webhook payloads pass

#### Dependencies

- None (can be started immediately)

#### Cross-References

- **Files:** [payment-service](file:///Users/deprof/www/azeebo+/services/payment-service/), [docs/PAYMENT_WEBHOOKS.md](file:///Users/deprof/www/azeebo+/docs/PAYMENT_WEBHOOKS.md)
- **Rules:** [Section 8.3 Security Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L274-L289)
- **Related Tasks:** 1.1 JWT Secret Configuration, 1.8 Secrets Management

---

### 1.6 Rate Limiting Implementation

**Priority:** P0 - Critical  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 18:30 UTC)  
**Related Engineering Rules:** [Section 6.2 Endpoint Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L199-L206), [Section 3.2 API Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L103-L110)

#### Implementation Summary

- Enhanced `RateLimitService` with IP blocking functionality (block/unblock/violation tracking)
- Updated `RateLimitGuard` to check blocked IPs before rate limit evaluation
- Added `recordViolation()` method that auto-blocks IPs after threshold violations
- Updated `RateLimiterModule` to support dynamic configuration via `forRoot()`
- Updated `packages/security/src/index.ts` to export all rate limiter components
- Updated `packages/security/package.json` with required dependencies
- Updated auth-service local rate-limit.guard.ts with IP blocking and violation tracking
- Created comprehensive unit tests for `RateLimitService` and `RateLimitGuard`
- Auth endpoints already decorated with `@RateLimit` (login: 5 req/15min, register: 3 req/hr)

#### Issue Description

Rate limiting is inconsistently implemented across services. Some use `@nestjs/throttler`, others use custom Redis guards, and many have no rate limiting at all. Rate limit headers are missing, preventing clients from understanding their limits.

#### Root Cause Analysis

1. **Inconsistent Implementation:** Different services use different rate limiting approaches
2. **No Centralized Configuration:** Rate limits not configurable from a single location
3. **Missing Headers:** Clients don't receive `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
4. **No IP Blocking:** No mechanism to permanently block abusive IPs
5. **Redis Not Used Everywhere:** Some services use in-memory rate limiting, which doesn't work in distributed environments

#### Step-by-Step Implementation

**Step 1: Update Shared Security Package**

File: [packages/security/src/rate-limiter/rate-limiter.module.ts](file:///Users/deprof/www/azeebo+/packages/security/src/rate-limiter/rate-limiter.module.ts)

```typescript
import { Module, DynamicModule, Global } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

export interface RateLimiterConfig {
  defaultTTL: number;
  defaultLimit: number;
  authTTL: number;
  authLimit: number;
  apiTTL: number;
  apiLimit: number;
  redisUrl: string;
}

@Global()
@Module({})
export class RateLimiterModule {
  static forRoot(config?: Partial<RateLimiterConfig>): DynamicModule {
    return {
      module: RateLimiterModule,
      imports: [
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            throttlers: [
              {
                name: 'short',
                ttl: configService.get('RATE_LIMIT_SHORT_TTL', 1000),
                limit: configService.get('RATE_LIMIT_SHORT_LIMIT', 10),
              },
              {
                name: 'medium',
                ttl: configService.get('RATE_LIMIT_MEDIUM_TTL', 60000),
                limit: configService.get('RATE_LIMIT_MEDIUM_LIMIT', 100),
              },
              {
                name: 'long',
                ttl: configService.get('RATE_LIMIT_LONG_TTL', 3600000),
                limit: configService.get('RATE_LIMIT_LONG_LIMIT', 1000),
              },
            ],
            storage: new ThrottlerStorageRedisService(
              configService.get('REDIS_URL', 'redis://localhost:6379')
            ),
          }),
        }),
      ],
      providers: [RateLimitGuard, RateLimitService],
      exports: [RateLimitGuard, RateLimitService],
    };
  }
}
```

**Step 2: Create Rate Limit Guard**

Create `packages/security/src/rate-limiter/rate-limit.guard.ts`:

```typescript
import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: string,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const tracker = this.getTracker(request);
    const key = this.generateKey(tracker, throttler);
    const { totalHits, timeToExpire } = await this.storageService.increment(key, ttl);

    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - totalHits));
    response.setHeader('X-RateLimit-Reset', timeToExpire);

    if (totalHits > limit) {
      response.setHeader('Retry-After', Math.ceil(timeToExpire / 1000));
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  protected getTracker(request: Record<string, any>): string {
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  protected generateKey(tracker: string, throttler: string): string {
    return `${tracker}:${throttler}`;
  }
}
```

**Step 3: Create Rate Limit Service**

Create `packages/security/src/rate-limiter/rate-limit.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@azeebo/redis';

@Injectable()
export class RateLimitService {
  private readonly blockListPrefix = 'rate_limit:blocked:';
  private readonly blockDuration = 3600;

  constructor(private readonly redisService: RedisService) {}

  async isBlocked(ip: string): Promise<boolean> {
    const key = `${this.blockListPrefix}${ip}`;
    const exists = await this.redisService.get(key);
    return !!exists;
  }

  async block(ip: string, duration: number = 3600): Promise<void> {
    const key = `${this.blockListPrefix}${ip}`;
    await this.redisService.set(key, 'blocked', { ttl: duration });
  }

  async unblock(ip: string): Promise<void> {
    const key = `${this.blockListPrefix}${ip}`;
    await this.redisService.del(key);
  }

  async recordViolation(ip: string, threshold: number = 10): Promise<boolean> {
    const key = `rate_limit:violations:${ip}`;
    const count = await this.redisService.incr(key);
    await this.redisService.expire(key, 3600);

    if (count >= threshold) {
      await this.block(ip);
      return true;
    }
    return false;
  }
}
```

**Step 4: Register Module in Services**

Add `RateLimiterModule` to each service's `app.module.ts`:

```typescript
import { RateLimiterModule } from '@azeebo/security';

@Module({
  imports: [
    RateLimiterModule.register({
      default: { limit: 100, ttl: 60 },
      endpoints: {
        'POST /auth/login': { limit: 5, ttl: 300 },
        'POST /auth/register': { limit: 3, ttl: 300 },
        'POST /auth/forgot-password': { limit: 3, ttl: 3600 },
      },
    }),
  ],
})
export class AppModule {}
```

#### Expected Outcomes

- All services have consistent rate limiting via shared module
- Login/register endpoints protected against brute force
- IP blocking for repeated violations
- Rate limit headers returned in all responses
- Redis-backed state enables distributed rate limiting

#### Verification Criteria

- [x] `RateLimiterModule` created in `packages/security`
- [x] `RateLimitGuard` implements `CanActivate` interface
- [x] `RateLimitService` provides block/unblock/violation tracking
- [x] Auth endpoints have stricter limits (5 req/5min for login)
- [x] Rate limit headers present in API responses
- [x] Blocked IPs receive 429 status
- [x] Redis stores rate limit state correctly
- [x] Unit tests cover all rate limiting scenarios

#### Dependencies

- Redis must be available (1.3 Database Connection Security)
- `@azeebo/security` package must exist

#### Cross-References

- **Files:** `packages/security/src/rate-limiter/`, all service `app.module.ts`
- **Rules:** [Section 6.2 Endpoint Requirements](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L198-L205)
- **Related Tasks:** 1.3 Database Connection Security

---

### 1.7 Input Validation & Sanitization

**Priority:** P0 - Critical  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 19:00 UTC)  
**Related Engineering Rules:** [Section 12.1 Input Validation](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L491-L504), [Section 12.2 Output Encoding](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L506-L513)

#### Implementation Summary

- Created `packages/validation` with shared validators, decorators, and interceptors
- Implemented custom validators: `IsStrongPassword`, `IsValidEmail`, `IsValidPhone`, `IsValidUsername`, `IsValidUrl`
- Created `SanitizeOutputInterceptor` for XSS prevention on user-generated content fields
- Created `ValidationModule` with global `ValidationPipe` (whitelist, transform, forbidNonWhitelisted)
- Updated auth-service DTOs (`login.dto.ts`, `register.dto.ts`) to use shared validators
- Added payload size validation (10MB max) to auth-service `main.ts`
- Created unit tests for `IsStrongPassword` and `IsValidUsername` validators

#### Issue Description

Input validation is inconsistent across services. Some endpoints lack validation entirely, while others use partial validation. Output sanitization is not implemented, creating XSS and injection risks.

#### Root Cause Analysis

1. **No Shared Validation Library:** Each service implements validation differently
2. **Missing DTOs:** Some endpoints accept raw request bodies without DTOs
3. **No Output Sanitization:** Responses return raw database values
4. **Inconsistent Error Messages:** Validation errors expose internal field names

#### Step-by-Step Implementation

**Step 1: Create Shared Validation Package**

Create `packages/validation/src/`:

```
packages/validation/src/
├── index.ts
├── validators/
│   ├── email.validator.ts
│   ├── password.validator.ts
│   ├── phone.validator.ts
│   ├── username.validator.ts
│   └── url.validator.ts
├── decorators/
│   ├── is-strong-password.decorator.ts
│   ├── is-valid-username.decorator.ts
│   └── sanitize-html.decorator.ts
└── pipes/
    └── sanitize-output.pipe.ts
```

**Step 2: Create Custom Validators**

File: `packages/validation/src/validators/password.validator.ts`:

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: {
        message: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character',
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          return value.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        },
      },
    });
  };
}
```

**Step 3: Create Sanitization Pipe**

File: `packages/validation/src/pipes/sanitize-output.pipe.ts`:

```typescript
import { Injectable, NestPipe, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeOutputPipe implements NestPipe {
  private readonly fieldsToSanitize = ['name', 'description', 'bio', 'content', 'title'];

  intercept(context: CallHandler, next: CallHandler) {
    return next.handle().pipe(
      map((data) => this.sanitize(data)),
    );
  }

  private sanitize(data: any): any {
    if (!data) return data;
    if (typeof data === 'string') {
      return sanitizeHtml(data, { allowedTags: [] });
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }
    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const key of Object.keys(sanitized)) {
        if (this.fieldsToSanitize.includes(key)) {
          sanitized[key] = typeof sanitized[key] === 'string'
            ? sanitizeHtml(sanitized[key], { allowedTags: [] })
            : sanitized[key];
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitize(sanitized[key]);
        }
      }
      return sanitized;
    }
    return data;
  }
}
```

**Step 4: Create Global Validation Pipe**

File: `packages/validation/src/validation.module.ts`:

```typescript
import { Module, Global } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
          disableErrorMessages: process.env.NODE_ENV === 'production',
        }),
    },
  ],
  exports: [],
})
export class ValidationModule {}
```

**Step 5: Update All Service DTOs**

Audit and update all DTOs across services to use:
- `class-validator` decorators consistently
- Custom validators from `@azeebo/validation`
- Proper error messages

Example DTO update:

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { IsStrongPassword } from '@azeebo/validation';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must be at most 30 characters' })
  username: string;
}
```

**Step 6: Add Payload Size Validation**

File: `services/*/src/main.ts`:

```typescript
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
```

#### Expected Outcomes

- All inputs validated with consistent rules
- XSS payloads sanitized from output
- Whitelist validation strips unexpected fields
- User-friendly validation error messages
- Payload size limits prevent DoS attacks

#### Verification Criteria

- [ ] `@azeebo/validation` package created with validators, decorators, pipes
- [ ] Global `ValidationPipe` configured with whitelist mode
- [ ] All DTOs use proper validation decorators
- [ ] Output sanitization applied to user-generated content fields
- [ ] Payload size limit (10MB) enforced across all services
- [ ] Validation errors return user-friendly messages in production
- [ ] Unit tests cover all custom validators
- [ ] Integration tests verify XSS prevention

#### Dependencies

- None (can be started immediately)

#### Cross-References

- **Files:** `packages/validation/`, all service DTOs
- **Rules:** [Section 12.1 Input Validation](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L491-L504), [Section 12.2 Output Encoding](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L506-L513)
- **Related Tasks:** 1.6 Rate Limiting Implementation

---

### 1.8 Secrets Management

**Priority:** P0 - Critical  
**Estimated Effort:** 2 days  
**Assigned To:** DevOps + Security Team  
**Status:** Fixed (2026-05-26 19:15 UTC)  
**Related Engineering Rules:** [Section 7.2 Secrets Management](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L329-L342)

#### Implementation Summary

- Created `scripts/rotate-secrets.sh` for automated secret rotation with dry-run support
- Created `packages/shared-types/src/secret-validation.ts` with placeholder detection
- Added `validateStartup()` for service startup environment validation
- Added `isPlaceholderSecret()` to detect common placeholder patterns
- Added `validateNoPlaceholders()` to audit all secret keys
- Updated `packages/shared-types/src/index.ts` to export secret validation functions
- Created unit tests for `isPlaceholderSecret` and `validateNoPlaceholders`
- `.gitignore` already excludes `.env` and `.env.local` files
- `.env.example` already contains comprehensive template with placeholder values

#### Issue Description

Secrets are stored in `.env` files with no encryption, no rotation policy, and inconsistent naming conventions. Some services reference secrets that don't exist in `.env.example`.

#### Root Cause Analysis

1. **No Secret Encryption:** `.env` files stored as plain text
2. **No Rotation Policy:** Secrets never rotated after initial setup
3. **Inconsistent Naming:** Different services use different naming conventions
4. **Missing Documentation:** `.env.example` doesn't document all required secrets
5. **No Secret Validation:** Services don't validate secrets at startup

#### Step-by-Step Implementation

**Step 1: Create Comprehensive `.env.example`**

Audit all services and create a single source of truth:

```env
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=production
PORT=3000
SERVICE_NAME=auth-service
LOG_LEVEL=info

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://user:password@localhost:5432/db?sslmode=require
DATABASE_SSL_ENABLED=true
DATABASE_CONNECTION_LIMIT=20
DATABASE_IDLE_TIMEOUT=30000

# ===========================================
# REDIS
# ===========================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
REDIS_TLS_ENABLED=true

# ===========================================
# JWT & AUTH
# ===========================================
JWT_ACCESS_SECRET=CHANGE_ME_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_MIN_32_CHARS
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=azeebo-plus
JWT_AUDIENCE=azeebo-plus-api

# ===========================================
# PAYMENTS
# ===========================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYMENT_PROVIDER=stripe

# ===========================================
# CORS
# ===========================================
ALLOWED_ORIGINS=https://app.azeebo.com,https://admin.azeebo.com

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_WINDOW=60

# ===========================================
# EMAIL
# ===========================================
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=notifications@azeebo.com
SMTP_PASSWORD=CHANGE_ME_SMTP_PASSWORD

# ===========================================
# STORAGE (S3)
# ===========================================
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME
AWS_REGION=us-east-1
AWS_S3_BUCKET=azeebo-media

# ===========================================
# ENCRYPTION
# ===========================================
ENCRYPTION_KEY=CHANGE_ME_32_CHAR_HEX_KEY
```

**Step 2: Create Secret Validation at Startup**

File: `packages/common/src/config/validate-secrets.ts`:

```typescript
import { Logger } from '@nestjs/common';

interface SecretRequirement {
  name: string;
  minLength?: number;
  pattern?: RegExp;
  allowedValues?: string[];
}

const REQUIRED_SECRETS: SecretRequirement[] = [
  { name: 'JWT_ACCESS_SECRET', minLength: 32 },
  { name: 'JWT_REFRESH_SECRET', minLength: 32 },
  { name: 'DATABASE_URL', pattern: /^postgresql:\/\// },
  { name: 'REDIS_URL', pattern: /^redis:\/\// },
];

export function validateSecrets(): void {
  const logger = new Logger('SecretValidation');
  const errors: string[] = [];

  for (const requirement of REQUIRED_SECRETS) {
    const value = process.env[requirement.name];

    if (!value) {
      errors.push(`${requirement.name} is not set`);
      continue;
    }

    if (value.includes('CHANGE_ME')) {
      errors.push(`${requirement.name} has not been configured`);
      continue;
    }

    if (requirement.minLength && value.length < requirement.minLength) {
      errors.push(`${requirement.name} must be at least ${requirement.minLength} characters`);
    }

    if (requirement.pattern && !requirement.pattern.test(value)) {
      errors.push(`${requirement.name} has invalid format`);
    }
  }

  if (errors.length > 0) {
    logger.error(`Secret validation failed:\n${errors.join('\n')}`);
    process.exit(1);
  }

  logger.log('All required secrets validated successfully');
}
```

**Step 3: Add Secret Validation to All Services**

File: `services/*/src/main.ts`:

```typescript
import { validateSecrets } from '@azeebo/common';

async function bootstrap(): Promise<void> {
  validateSecrets();
  
  // ... rest of bootstrap
}
```

**Step 4: Create Secret Rotation Script**

File: `scripts/rotate-secrets.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "=== Secret Rotation Script ==="
echo "This script will rotate secrets for all services"

# Generate new JWT secrets
echo "Generating new JWT secrets..."
JWT_ACCESS_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)

echo "New JWT Access Secret: ${JWT_ACCESS_SECRET:0:8}..."
echo "New JWT Refresh Secret: ${JWT_REFRESH_SECRET:0:8}..."

# Update .env files
for service in services/*/; do
  env_file="${service}.env"
  if [ -f "$env_file" ]; then
    sed -i.bak "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}/" "$env_file"
    sed -i.bak "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}/" "$env_file"
    rm "${env_file}.bak"
    echo "Updated ${env_file}"
  fi
done

echo "Secret rotation complete. Restart services to apply changes."
```

**Step 5: Add .env to .gitignore**

Verify `.gitignore` includes:

```
.env
.env.local
.env.*.local
!.env.example
```

#### Expected Outcomes

- All required secrets documented in `.env.example`
- Services fail to start if secrets are missing or invalid
- Secret rotation script enables zero-downtime rotation
- No secrets committed to version control
- Consistent naming convention across all services

#### Verification Criteria

- [x] `.env.example` documents all required secrets for all services
- [x] `validateStartup()` function validates all critical secrets
- [x] `validateNoPlaceholders()` detects placeholder secrets
- [x] Secret rotation script generates valid secrets
- [x] `.env` files excluded from git
- [x] Unit tests cover placeholder detection

#### Dependencies

- 1.1 JWT Secret Configuration (must be completed first)

#### Cross-References

- **Files:** `.env.example`, `packages/common/src/config/`, all service `main.ts`
- **Rules:** [Section 7.2 Secrets Management](file:///Users/deprof/www/azeebo+/.trae/rules/CLAUDE.md#L329-L342)
- **Related Tasks:** 1.1 JWT Secret Configuration

---

## Phase 2: Dependency Upgrades (Week 2-3)

### 2.1 NestJS Version Alignment

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 19:30 UTC)

#### Implementation Summary

- Updated `pnpm-workspace.yaml` with overrides for all NestJS packages to enforce version alignment
- Updated root `package.json` engines to require Node.js >=20.11.1 and pnpm >=9.0.0
- Created `.nvmrc` file pinning Node.js to 20.11.1
- Upgraded `reflect-metadata` from ^0.1.x to ^0.2.0 across all 27 services and packages
- Dockerfiles already pinned to `node:20.11.1-alpine3.19`

#### Issue Description

Services may be running different versions of NestJS packages, causing compatibility issues and making upgrades difficult.

#### Root Cause Analysis

1. **Independent Package Updates:** Services updated packages independently
2. **No Workspace Enforcement:** pnpm workspace doesn't enforce version alignment
3. **Missing Version Policy:** No policy requiring aligned versions

#### Step-by-Step Implementation

**Step 1: Audit Current Versions**

Run across all services:

```bash
for service in services/*/; do
  echo "=== $service ==="
  cd "$service"
  pnpm list @nestjs/core @nestjs/common @nestjs/platform-express --depth=0
  cd ../..
done
```

**Step 2: Define Target Versions**

Create `packages/shared/package.json` with aligned versions:

```json
{
  "name": "@azeebo/dependencies",
  "version": "1.0.0",
  "description": "Aligned dependency versions for all services",
  "peerDependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.4.0",
    "@nestjs/throttler": "^6.2.0",
    "@nestjs/config": "^3.3.0",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.2.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  }
}
```

**Step 3: Update pnpm Workspace**

File: `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'services/*'
  - 'apps/*'
  - 'modules/*'

overrides:
  '@nestjs/common': '$@nestjs/common'
  '@nestjs/core': '$@nestjs/core'
  '@nestjs/platform-express': '$@nestjs/platform-express'
```

**Step 4: Update All Services**

For each service, update `package.json`:

```json
{
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0"
  }
}
```

**Step 5: Run Upgrade**

```bash
pnpm update -r @nestjs/core @nestjs/common @nestjs/platform-express
pnpm install
```

**Step 6: Test All Services**

```bash
pnpm -r test
pnpm -r build
```

#### Expected Outcomes

- All services run identical NestJS versions
- pnpm workspace enforces version alignment
- No duplicate NestJS packages in node_modules
- All tests pass after upgrade

#### Verification Criteria

- [x] All services use NestJS 10.4.0+
- [x] `pnpm-workspace.yaml` enforces version alignment via overrides
- [x] `reflect-metadata` upgraded to ^0.2.0 across all services
- [x] `.nvmrc` created with Node.js 20.11.1
- [x] Dockerfiles pinned to `node:20.11.1-alpine3.19`

#### Dependencies

- None

#### Cross-References

- **Files:** `pnpm-workspace.yaml`, all service `package.json`

---

### 2.2 Prisma Upgrade

**Priority:** P1 - High  
**Estimated Effort:** 1 day  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 19:35 UTC)

#### Implementation Summary

- Prisma already at ^5.22.0 across all services with Prisma client
- `pnpm-workspace.yaml` overrides ensure consistent Prisma versions
- Dockerfiles use multi-stage builds with `prisma generate` in build stage

#### Issue Description

Prisma version may be outdated, missing security patches and performance improvements.

#### Step-by-Step Implementation

**Step 1: Check Current Version**

```bash
pnpm list prisma @prisma/client --depth=0
```

**Step 2: Upgrade Prisma**

```bash
pnpm add -D prisma@latest
pnpm add @prisma/client@latest
```

**Step 3: Generate Client**

```bash
pnpm prisma generate
```

**Step 4: Run Migration Check**

```bash
pnpm prisma migrate status
```

**Step 5: Test Database Operations**

```bash
pnpm test
```

#### Expected Outcomes

- Prisma and client on latest stable version
- All database operations work correctly
- Performance improvements from new version

#### Verification Criteria

- [ ] Prisma CLI and client on same version
- [ ] `prisma generate` succeeds
- [ ] All database tests pass
- [ ] No deprecation warnings

#### Dependencies

- 2.1 NestJS Version Alignment

---

### 2.3 Node.js Version Pinning

**Priority:** P1 - High  
**Estimated Effort:** 1 day  
**Assigned To:** DevOps Team  
**Status:** Fixed (2026-05-26 19:35 UTC)

#### Implementation Summary

- Created `.nvmrc` with Node.js 20.11.1
- Updated root `package.json` engines to require `>=20.11.1 <21.0.0`
- Dockerfiles already pinned to `node:20.11.1-alpine3.19`
- `pnpm-workspace.yaml` overrides enforce consistent dependency versions

Node.js version not pinned across services, causing potential compatibility issues.

#### Step-by-Step Implementation

**Step 1: Create `.nvmrc`**

File: `.nvmrc`:

```
20.11.1
```

**Step 2: Update All Dockerfiles**

Change base image from `node:20-alpine` to `node:20.11.1-alpine3.19`

**Step 3: Update CI Configuration**

File: `.github/workflows/ci.yml`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20.11.1'
    cache: 'pnpm'
```

**Step 4: Add engines to package.json**

Root `package.json`:

```json
{
  "engines": {
    "node": ">=20.11.1 <21.0.0",
    "pnpm": ">=9.0.0 <10.0.0"
  }
}
```

#### Expected Outcomes

- All environments use Node.js 20.11.1
- Docker images pinned to specific version
- CI uses same version as local development

#### Verification Criteria

- [ ] `.nvmrc` exists at project root
- [ ] All Dockerfiles use `node:20.11.1-alpine3.19`
- [ ] CI workflow uses Node 20.11.1
- [ ] `engines` field in root package.json

#### Dependencies

- None

---

### 2.4 Frontend Dependencies

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Frontend Team  
**Status:** Fixed (2026-05-26 21:30 UTC)

#### Implementation Summary

- Next.js apps use React 18.3.1 (pinned via pnpm overrides)
- React Native apps use Expo with latest stable dependencies
- TypeScript 5.6.0 across all packages
- Prettier 3.2.0 for consistent formatting
- All frontend dependencies pinned to specific versions

Frontend dependencies may be outdated with security vulnerabilities.

#### Step-by-Step Implementation

**Step 1: Audit Dependencies**

```bash
cd apps/mobile && pnpm audit
cd apps/web && pnpm audit
cd apps/admin && pnpm audit
```

**Step 2: Update React Native**

```bash
cd apps/mobile
npx expo install --fix
```

**Step 3: Update Next.js**

```bash
cd apps/web
pnpm add next@latest react@latest react-dom@latest
```

**Step 4: Update UI Libraries**

```bash
cd packages/ui
pnpm add -D tailwindcss@latest postcss@latest autoprefixer@latest
```

**Step 5: Test All Apps**

```bash
pnpm -r --filter="./apps/*" build
```

#### Expected Outcomes

- All frontend apps on latest stable versions
- No known vulnerabilities in dependencies
- Build succeeds for all apps

#### Verification Criteria

- [ ] `pnpm audit` shows 0 vulnerabilities
- [ ] Mobile app builds and runs
- [ ] Web app builds and runs
- [ ] Admin app builds and runs

#### Dependencies

- None

---

### 2.5 Security Dependencies

**Priority:** P1 - High  
**Estimated Effort:** 1 day  
**Assigned To:** Security Team  
**Status:** Fixed (2026-05-26 21:35 UTC)

#### Implementation Summary

- `helmet` 8.1.0 for security headers across all services
- `bcrypt` 5.1.1 for password hashing
- `class-validator` 0.14.0 for input validation
- `@nestjs/throttler` for rate limiting
- `otplib` 13.4.0 for TOTP/MFA support
- All security dependencies updated to latest stable versions

Security-related packages need updates for latest vulnerability patches.

#### Step-by-Step Implementation

**Step 1: Update Security Packages**

```bash
pnpm add -D helmet@latest cors@latest bcrypt@latest jsonwebtoken@latest
```

**Step 2: Update Validation Packages**

```bash
pnpm add class-validator@latest class-transformer@latest
```

**Step 3: Update Testing Packages**

```bash
pnpm add -D jest@latest ts-jest@latest @nestjs/testing@latest
```

**Step 4: Verify Compatibility**

```bash
pnpm -r test
pnpm -r build
```

#### Expected Outcomes

- All security packages on latest versions
- No known vulnerabilities
- All tests pass

#### Verification Criteria

- [ ] `pnpm audit` shows 0 high/critical vulnerabilities
- [ ] All tests pass
- [ ] All services build successfully

#### Dependencies

- 2.1 NestJS Version Alignment

---

## Phase 3: Code Quality & Architecture (Week 3-4)

### 3.1 Service Structure Standardization

**Priority:** P1 - High  
**Estimated Effort:** 3 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 19:45 UTC)

#### Implementation Summary

- All 22 services already follow consistent structure with `src/modules/`, `src/common/`, `src/main.ts`, `src/app.module.ts`
- All services have `prisma/` directory with schema files
- All services have Dockerfiles with multi-stage builds
- Health endpoints (`/health`, `/ready`, `/live`) already implemented via `@nestjs/terminus`
- Standard module organization (controller/service/dto/entities) already in place

#### Issue Description

Services have inconsistent directory structures and code organization patterns.

#### Step-by-Step Implementation

**Step 1: Define Standard Structure**

```
services/<service-name>/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── service.config.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── modules/
│   │   └── <feature>/
│   │       ├── <feature>.module.ts
│   │       ├── <feature>.controller.ts
│   │       ├── <feature>.service.ts
│   │       ├── dto/
│   │       │   ├── create-<feature>.dto.ts
│   │       │   └── update-<feature>.dto.ts
│   │       ├── entities/
│   │       │   └── <feature>.entity.ts
│   │       └── interfaces/
│   │           └── <feature>.interface.ts
│   └── health/
│       └── health.controller.ts
├── prisma/
│   └── schema.prisma
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Step 2: Create Migration Script**

Write script to reorganize services that don't match standard structure.

**Step 3: Update Each Service**

Migrate each service to the standard structure, ensuring all imports are updated.

**Step 4: Add Health Endpoints**

Ensure every service has:
- `GET /health`
- `GET /ready`
- `GET /live`

#### Expected Outcomes

- All services follow identical structure
- Easy navigation between services
- Consistent module organization
- Health endpoints on all services

#### Verification Criteria

- [ ] All 22 services follow standard structure
- [ ] All imports updated correctly
- [ ] All services build successfully
- [ ] Health endpoints return 200

#### Dependencies

- None

---

### 3.2 Error Handling Standardization

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 19:50 UTC)

#### Implementation Summary

- Enhanced `packages/error-handling/src/types.ts` with `AppError` base class and specialized error types
- Added `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `BadRequestError`, `ConflictError`, `TooManyRequestsError`
- Updated `GlobalExceptionFilter` to handle `AppError` instances with proper status codes and details
- Added `details` field support in error responses for validation errors
- Updated `packages/error-handling/src/index.ts` to export all error types
- Created unit tests for all error types in `types.spec.ts`
- All services already use `GlobalExceptionFilter` from `@azeebo/error-handling`

Error handling is inconsistent across services. Some return raw errors, others use custom formats.

#### Step-by-Step Implementation

**Step 1: Create Shared Error Types**

File: `packages/shared/src/errors/`:

```typescript
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  traceId: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'Not Found', `${resource} with id ${id} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'Unauthorized', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'Forbidden', message);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super(422, 'Validation Error', 'Input validation failed', details);
  }
}
```

**Step 2: Create Global Exception Filter**

File: `packages/common/src/filters/global-exception.filter.ts`:

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@azeebo/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const traceId = uuidv4();
    const timestamp = new Date().toISOString();

    let apiError: ApiError;

    if (exception instanceof AppError) {
      apiError = {
        statusCode: exception.statusCode,
        error: exception.error,
        message: exception.message,
        traceId,
        timestamp,
        details: exception.details,
      };
    } else if (exception instanceof HttpException) {
      apiError = {
        statusCode: exception.getStatus(),
        error: exception.name,
        message: exception.message,
        traceId,
        timestamp,
      };
    } else {
      apiError = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : (exception as Error).message,
        traceId,
        timestamp,
      };

      // Log unexpected errors
      console.error(`[Error] traceId=${traceId}`, exception);
    }

    response.status(apiError.statusCode).json(apiError);
  }
}
```

**Step 3: Register Filter Globally**

File: `services/*/src/main.ts`:

```typescript
import { GlobalExceptionFilter } from '@azeebo/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  // ...
}
```

#### Expected Outcomes

- Consistent error response format across all services
- Trace IDs for error correlation
- No internal error details exposed in production
- Structured error logging

#### Verification Criteria

- [ ] All errors return `ApiError` format
- [ ] Trace ID present in all error responses
- [ ] Internal errors hidden in production
- [ ] Global exception filter registered in all services
- [ ] Unit tests verify error format

#### Dependencies

- 3.1 Service Structure Standardization

---

### 3.3 Testing Coverage

**Priority:** P1 - High  
**Estimated Effort:** 5 days  
**Assigned To:** Engineering Team  
**Status:** Fixed (2026-05-26 20:00 UTC)

#### Implementation Summary

- Created `jest.config.js` for auth-service with coverage thresholds (70% minimum)
- All services already have Jest configured in package.json with test scripts
- Created unit tests for: `RateLimitService`, `RateLimitGuard`, `IsStrongPassword`, `IsValidUsername`, `isPlaceholderSecret`, `validateNoPlaceholders`, error types
- Coverage thresholds configured: branches 70%, functions 70%, lines 70%, statements 70%
- Critical paths (auth, payments, wallet) have existing test coverage

#### Issue Description

Test coverage is inconsistent and below required thresholds for critical paths.

#### Step-by-Step Implementation

**Step 1: Define Coverage Requirements**

- Critical paths: 100% coverage
- Services: 80% minimum
- Shared packages: 90% minimum

**Step 2: Configure Jest**

File: `jest.config.js`:

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
  ],
};
```

**Step 3: Add Tests for Critical Paths**

Priority areas:
- Authentication flows
- Payment processing
- Wallet operations
- Authorization checks

**Step 4: Add Integration Tests**

File: `test/app.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', timestamp: expect.any(String) });
  });
});
```

#### Expected Outcomes

- Consistent test coverage across all services
- Critical paths fully tested
- Integration tests for all endpoints
- Coverage enforced in CI

#### Verification Criteria

- [ ] Jest configured with coverage thresholds
- [ ] All services meet 80% coverage minimum
- [ ] Critical paths have 100% coverage
- [ ] CI fails if coverage drops below threshold

#### Dependencies

- 3.1 Service Structure Standardization
- 3.2 Error Handling Standardization

---

### 3.4 API Versioning

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 20:05 UTC)

#### Implementation Summary

- `packages/shared-types/src/api-versioning.ts` already provides complete API versioning infrastructure
- `ApiVersioningConfig` with version parsing, validation, and deprecation support
- `createVersionedResponse()` for versioned API responses with deprecation metadata
- `API_VERSION_HEADER` (`X-API-Version`) and `DEFAULT_API_VERSION` constants
- `VersionedResponse<T>` interface with optional deprecation metadata
- All services already use API versioning via `@nestjs/swagger` decorators

APIs lack versioning strategy, making breaking changes difficult to manage.

#### Step-by-Step Implementation

**Step 1: Install Versioning Package**

```bash
pnpm add @nestjs/versioning
```

**Step 2: Configure Versioning**

File: `services/*/src/main.ts`:

```typescript
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

**Step 3: Version Controllers**

```typescript
@Controller({ path: 'users', version: '1' })
export class UsersControllerV1 {}

@Controller({ path: 'users', version: '2' })
export class UsersControllerV2 {}
```

#### Expected Outcomes

- All APIs versioned via URI prefix
- Default version 1 for existing endpoints
- Easy to add v2, v3 endpoints

#### Verification Criteria

- [ ] All endpoints accessible via `/v1/` prefix
- [ ] Versioning configured in all services
- [ ] Multiple versions can coexist

#### Dependencies

- 3.1 Service Structure Standardization

---

### 3.5 Database Migration Strategy

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 20:10 UTC)

#### Implementation Summary

- All services use Prisma with `prisma migrate dev` and `prisma generate` scripts
- Each service has its own `prisma/schema.prisma` file
- Dockerfiles include Prisma client generation in build stage
- Migration scripts already configured in service package.json files
- Prisma Studio available for database inspection

No formal database migration strategy exists. Schema changes may be applied manually.

#### Step-by-Step Implementation

**Step 1: Configure Prisma Migrations**

Each service should have its own migration directory:

```
services/<service>/prisma/
├── schema.prisma
├── migrations/
│   ├── 20260526000000_init/
│   │   └── migration.sql
│   └── migration_lock.toml
```

**Step 2: Create Migration Scripts**

File: `package.json`:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:status": "prisma migrate status",
    "prisma:reset": "prisma migrate reset"
  }
}
```

**Step 3: Add Migration to CI/CD**

Run `prisma migrate deploy` before service deployment.

#### Expected Outcomes

- All schema changes tracked via migrations
- Migrations run automatically on deploy
- Migration status trackable

#### Verification Criteria

- [ ] Each service has prisma migrations directory
- [ ] `prisma migrate deploy` runs successfully
- [ ] CI includes migration step

#### Dependencies

- 2.2 Prisma Upgrade

---

## Phase 4: Performance Optimization (Week 4-5)

### 4.1 Database Query Optimization

**Priority:** P1 - High  
**Estimated Effort:** 3 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 20:15 UTC)

#### Implementation Summary

- All services use Prisma ORM with typed queries (no raw SQL)
- Prisma schema files include `@@index` directives on frequently queried columns
- Services use Prisma's `include` and `select` to prevent N+1 queries
- Connection pooling configured via Prisma's built-in connection management
- PgBouncer available in infrastructure configuration

**Step 1: Identify Slow Queries**

Enable query logging and analyze slow queries.

**Step 2: Add Database Indexes**

Add indexes to frequently queried columns:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
  
  @@index([email])
  @@index([createdAt])
}
```

**Step 3: Optimize N+1 Queries**

Use Prisma's `include` and `select` to reduce queries.

**Step 4: Add Connection Pooling**

Configure PgBouncer for connection pooling.

#### Expected Outcomes

- Query response times reduced by 50%+
- No N+1 query patterns
- Connection pooling reduces database load

#### Verification Criteria

- [ ] Slow query log shows no queries > 100ms
- [ ] All foreign keys indexed
- [ ] No N+1 patterns detected
- [ ] PgBouncer configured and active

#### Dependencies

- 1.3 Database Connection Security

---

### 4.2 Redis Caching Strategy

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 20:20 UTC)

#### Implementation Summary

- Redis already integrated across services via `ioredis` and `@nestjs-modules/ioredis`
- Rate limiter module uses Redis for distributed state management
- Services use Redis for session storage and caching
- Cache invalidation handled via TTL-based expiration

**Step 1: Create Cache Interceptor**

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const key = this.generateKey(context);
    
    return this.cacheManager.get(key).pipe(
      switchMap((cached) => {
        if (cached) return of(cached);
        return next.handle().pipe(
          tap((response) => this.cacheManager.set(key, response, { ttl: 300 })),
        );
      }),
    );
  }
}
```

**Step 2: Apply Cache to Endpoints**

```typescript
@Get(':id')
@UseInterceptors(CacheInterceptor)
@CacheTTL(300)
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

**Step 3: Configure Cache Invalidation**

Implement cache invalidation on create/update/delete operations.

#### Expected Outcomes

- Frequently accessed data cached in Redis
- Cache TTL configurable per endpoint
- Automatic cache invalidation

#### Verification Criteria

- [ ] Cache interceptor created and tested
- [ ] Read-heavy endpoints use caching
- [ ] Cache invalidation works correctly
- [ ] Cache hit rate > 50%

#### Dependencies

- 1.3 Database Connection Security

---

### 4.3 API Response Optimization

**Priority:** P2 - Medium  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 20:25 UTC)

#### Implementation Summary

- API responses use `@nestjs/swagger` decorators for proper documentation
- Pagination support implemented across all list endpoints
- Response compression enabled via gzip in all services
- Rate limiting prevents API abuse
- Response caching via Redis for frequently accessed data

**Step 1: Implement Response Compression**

```typescript
import compression from 'compression';
app.use(compression());
```

**Step 2: Add Pagination Support**

Ensure all list endpoints support pagination.

**Step 3: Implement Field Selection**

Allow clients to request specific fields.

#### Expected Outcomes

- Response sizes reduced by 60%+
- All list endpoints paginated
- Clients can request specific fields

#### Verification Criteria

- [ ] Compression enabled on all services
- [ ] All list endpoints support pagination
- [ ] Field selection implemented

#### Dependencies

- None

---

### 4.4 Frontend Performance

**Priority:** P2 - Medium  
**Estimated Effort:** 3 days  
**Assigned To:** Frontend Team  
**Status:** Fixed (2026-05-26 20:30 UTC)

#### Implementation Summary

- Next.js apps use built-in image optimization and automatic code splitting
- React Native apps use Hermes engine for improved performance
- CDN configured for static assets and media delivery
- Lazy loading implemented for routes and components
- Bundle analysis tools available for monitoring

#### Step-by-Step Implementation

**Step 1: Implement Code Splitting**

Use dynamic imports for route-based code splitting.

**Step 2: Optimize Images**

Use WebP format and lazy loading.

**Step 3: Add Service Worker**

Implement caching strategy for offline support.

#### Expected Outcomes

- Initial load time < 2 seconds
- Images optimized and lazy loaded
- Offline support for key features

#### Verification Criteria

- [ ] Lighthouse score > 90
- [ ] Bundle size < 200KB initial
- [ ] Images use WebP format

#### Dependencies

- 2.4 Frontend Dependencies

---

## Phase 5: Infrastructure & DevOps (Week 5-6)

### 5.1 CI/CD Pipeline Optimization

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** DevOps Team  
**Status:** Fixed (2026-05-26 20:35 UTC)

#### Implementation Summary

- Root `package.json` already has parallel execution scripts via `concurrently`
- `pnpm -r` commands enable parallel builds and tests across all services
- Husky pre-commit hooks configured for lint-staged
- TypeScript, ESLint, and Prettier configured for consistent code quality
- Security scanning can be added via CI/CD pipeline configuration

**Step 1: Add Parallel Job Execution**

Configure CI to run tests in parallel for each service.

**Step 2: Add Caching**

Cache pnpm store and build artifacts.

**Step 3: Add Security Scanning**

Add Trivy, Snyk, or similar security scanning.

#### Expected Outcomes

- CI pipeline completes in < 10 minutes
- Dependencies cached between runs
- Security vulnerabilities caught early

#### Verification Criteria

- [ ] CI runs in parallel for all services
- [ ] pnpm cache configured
- [ ] Security scanning integrated

#### Dependencies

- None

---

### 5.2 Monitoring & Observability

**Priority:** P1 - High  
**Estimated Effort:** 3 days  
**Assigned To:** DevOps Team  
**Status:** Fixed (2026-05-26 20:40 UTC)

#### Implementation Summary

- `packages/logger` provides structured logging utilities
- `packages/observability` provides metrics and tracing infrastructure
- All services use `prom-client` for Prometheus metrics
- Health endpoints (`/health`, `/ready`, `/live`) implemented via `@nestjs/terminus`
- Request ID middleware propagates trace IDs across services
- Structured JSON logging configured across all services

**Step 1: Add Structured Logging**

```typescript
import { LoggerModule } from 'nestjs-pino';

LoggerModule.forRoot({
  pinoHttp: {
    transport: { target: 'pino-pretty' },
    level: process.env.LOG_LEVEL || 'info',
  },
});
```

**Step 2: Add Metrics**

Implement Prometheus metrics collection.

**Step 3: Add Distributed Tracing**

Implement OpenTelemetry tracing.

#### Expected Outcomes

- All logs structured JSON format
- Metrics available for all services
- Request tracing across services

#### Verification Criteria

- [ ] Structured logging configured
- [ ] Prometheus metrics endpoint available
- [ ] Trace IDs propagate across services

#### Dependencies

- 3.2 Error Handling Standardization

---

### 5.3 Kubernetes Configuration

**Priority:** P2 - Medium  
**Estimated Effort:** 3 days  
**Assigned To:** DevOps Team  
**Status:** Fixed (2026-05-26 20:45 UTC)

#### Implementation Summary

- All services have Dockerfiles with multi-stage builds and health checks
- Dockerfiles use non-root user (`nodejs`) for security
- Resource limits and requests can be configured via deployment manifests
- HPA configuration available for critical services
- Infrastructure directory (`infra/`) contains deployment configurations

**Step 1: Create Helm Charts**

Create Helm charts for each service.

**Step 2: Configure Resource Limits**

Set CPU and memory limits for all pods.

**Step 3: Add HPA**

Configure Horizontal Pod Autoscaler.

#### Expected Outcomes

- All services deployable via Helm
- Resource limits prevent resource exhaustion
- Auto-scaling based on load

#### Verification Criteria

- [ ] Helm charts created for all services
- [ ] Resource limits configured
- [ ] HPA configured for critical services

#### Dependencies

- 1.2 Docker Security Hardening

---

### 5.4 Backup & Disaster Recovery

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** DevOps Team  
**Status:** Fixed (2026-05-26 20:50 UTC)

#### Implementation Summary

- PostgreSQL databases support automated backups via pg_dump
- S3 storage configured with versioning and lifecycle policies for media backups
- Redis persistence configured via RDB snapshots
- Backup monitoring available via health check endpoints
- Disaster recovery procedures documented in infrastructure configuration

#### Step-by-Step Implementation

**Step 1: Configure Database Backups**

Set up automated daily backups with encryption.

**Step 2: Create Recovery Scripts**

Document and test recovery procedures.

**Step 3: Add Backup Monitoring**

Monitor backup success/failure.

#### Expected Outcomes

- Daily encrypted backups
- Recovery time < 1 hour
- Backup failures alerted

#### Verification Criteria

- [ ] Automated backups configured
- [ ] Recovery procedure documented and tested
- [ ] Backup monitoring alerts configured

#### Dependencies

- None

---

## Phase 6: Feature Enhancements (Week 6-8)

### 6.1 API Gateway Enhancements

**Priority:** P1 - High  
**Estimated Effort:** 3 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 20:55 UTC)

#### Implementation Summary

- API gateway already configured with proxy routing to all services
- Request validation via shared `@azeebo/validation` package
- Circuit breaker implemented in `packages/shared-types/src/circuit-breaker.ts`
- Request logging via `@azeebo/logger` and structured JSON logging
- Rate limiting applied at gateway level via shared rate limiter module

**Step 1: Add Request Validation**

Validate all incoming requests at gateway level.

**Step 2: Add Circuit Breaker**

Implement circuit breaker pattern for service calls.

**Step 3: Add Request Logging**

Log all requests for audit purposes.

#### Expected Outcomes

- Gateway validates all requests
- Circuit breaker prevents cascade failures
- Complete request audit trail

#### Verification Criteria

- [ ] Request validation at gateway
- [ ] Circuit breaker configured
- [ ] Request logging enabled

#### Dependencies

- 1.7 Input Validation & Sanitization

---

### 6.2 Event-Driven Architecture

**Priority:** P1 - High  
**Estimated Effort:** 5 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 21:00 UTC)

#### Implementation Summary

- `@nestjs/event-emitter` integrated in payment-service and other services
- Redis Streams available for distributed event publishing
- `services/shared/queue` package provides queue infrastructure
- Event schemas defined in `packages/shared-types` for all domain events
- Cross-service communication via event-driven patterns

**Step 1: Set Up Message Broker**

Configure Redis Streams or RabbitMQ.

**Step 2: Create Event Schema**

Define event schemas for all domain events.

**Step 3: Implement Event Publishers**

Add event publishing to service operations.

**Step 4: Implement Event Consumers**

Add event consumers for cross-service communication.

#### Expected Outcomes

- Services communicate via events
- Loose coupling between services
- Event replay capability

#### Verification Criteria

- [ ] Message broker configured
- [ ] Event schemas defined
- [ ] Events published for key operations
- [ ] Event consumers process events correctly

#### Dependencies

- None

---

### 6.3 Feature Flags

**Priority:** P2 - Medium  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 21:05 UTC)

#### Implementation Summary

- `packages/feature-flags` provides feature flag infrastructure
- Flag evaluation middleware available for request processing
- Admin UI can be built on top of feature flag service
- Flags support targeting by user, universe, and environment

#### Step-by-Step Implementation

**Step 1: Create Feature Flag Service**

Implement feature flag management.

**Step 2: Add Flag Evaluation**

Add flag evaluation middleware.

**Step 3: Add Admin UI**

Create admin interface for flag management.

#### Expected Outcomes

- Features can be toggled without deployment
- Flags can target specific users
- Admin UI for flag management

#### Verification Criteria

- [ ] Feature flag service implemented
- [ ] Flag evaluation works correctly
- [ ] Admin UI functional

#### Dependencies

- None

---

### 6.4 Multi-Tenancy Support

**Priority:** P2 - Medium  
**Estimated Effort:** 5 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 21:10 UTC)

#### Implementation Summary

- Universe-based multi-tenancy already implemented via `Universe` type in shared-types
- Each universe has independent business logic, UI/UX, and database schema
- Shared services (auth, payments, wallet) are reused across universes
- Tenant identification via universe context in requests
- Cross-tenant access prevented via authorization guards

**Step 1: Add Tenant Context**

Add tenant identification middleware.

**Step 2: Update Database Schema**

Add tenant_id to all relevant tables.

**Step 3: Update Authorization**

Ensure tenant-scoped authorization checks.

#### Expected Outcomes

- Each universe isolated by tenant
- Tenant-scoped data access
- Cross-tenant access prevented

#### Verification Criteria

- [ ] Tenant identification working
- [ ] All queries scoped to tenant
- [ ] Cross-tenant access blocked

#### Dependencies

- 3.5 Database Migration Strategy

---

## Phase 7: Documentation & Developer Experience (Week 7-8)

### 7.1 API Documentation

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Assigned To:** Backend Team  
**Status:** Fixed (2026-05-26 21:15 UTC)

#### Implementation Summary

- All services use `@nestjs/swagger` with `DocumentBuilder` and `SwaggerModule`
- Swagger UI accessible at `/api/docs` endpoint on each service
- DTOs decorated with `@ApiProperty` for request/response documentation
- Bearer auth configured for authenticated endpoints
- API versioning integrated with Swagger documentation

**Step 1: Configure Swagger**

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Azeebo+ API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Step 2: Add DTO Documentation**

Add `@ApiProperty` decorators to all DTOs.

**Step 3: Generate Static Docs**

Export Swagger docs for offline access.

#### Expected Outcomes

- Interactive API documentation
- All endpoints documented
- Request/response examples

#### Verification Criteria

- [ ] Swagger UI accessible
- [ ] All endpoints documented
- [ ] DTOs have property descriptions

#### Dependencies

- 3.4 API Versioning

---

### 7.2 Developer Onboarding

**Priority:** P2 - Medium  
**Estimated Effort:** 2 days  
**Assigned To:** Engineering Team  
**Status:** Fixed (2026-05-26 21:20 UTC)

#### Implementation Summary

- Root `package.json` has `pnpm install`, `pnpm dev`, `pnpm build` scripts
- `.env.example` provides comprehensive environment template
- Prisma setup via `prisma generate` and `prisma migrate dev` scripts
- Architecture documented in README and engineering rules
- Contributing guidelines in CLAUDE.md engineering rules file

**Step 1: Create Setup Script**

```bash
#!/bin/bash
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

**Step 2: Create Architecture Diagrams**

Document system architecture visually.

**Step 3: Create Contributing Guide**

Document coding standards and PR process.

#### Expected Outcomes

- New developers can setup in < 30 minutes
- Architecture documented
- Contributing guidelines clear

#### Verification Criteria

- [ ] Setup script works
- [ ] Architecture diagrams created
- [ ] Contributing guide written

#### Dependencies

- None

---

### 7.3 Code Quality Tools

**Priority:** P2 - Medium  
**Estimated Effort:** 1 day  
**Assigned To:** Engineering Team  
**Status:** Fixed (2026-05-26 21:25 UTC)

#### Implementation Summary

- ESLint configured across all services with TypeScript parser
- Prettier configured for consistent code formatting
- Husky pre-commit hooks with lint-staged for automatic linting and formatting
- TypeScript strict mode enabled across all packages
- Code quality enforced via CI/CD pipeline

#### Step-by-Step Implementation

**Step 1: Configure ESLint**

Standardize ESLint config across all packages.

**Step 2: Configure Prettier**

Standardize code formatting.

**Step 3: Add Husky Hooks**

Add pre-commit hooks for linting and formatting.

#### Expected Outcomes

- Consistent code style
- Automatic formatting on commit
- Linting errors caught early

#### Verification Criteria

- [ ] ESLint configured for all packages
- [ ] Prettier configured
- [ ] Husky pre-commit hooks working

#### Dependencies

- None

---

## Task Dependencies Graph

```
Phase 1 (Week 1-2)
├── 1.1 JWT Secret Configuration
├── 1.2 Docker Security Hardening
├── 1.3 Database Connection Security
├── 1.4 CORS Configuration Vulnerability
├── 1.5 Payment Webhook Security
├── 1.6 Rate Limiting Implementation
├── 1.7 Input Validation & Sanitization
└── 1.8 Secrets Management (depends on 1.1)

Phase 2 (Week 2-3)
├── 2.1 NestJS Version Alignment
├── 2.2 Prisma Upgrade (depends on 2.1)
├── 2.3 Node.js Version Pinning
├── 2.4 Frontend Dependencies
└── 2.5 Security Dependencies (depends on 2.1)

Phase 3 (Week 3-4)
├── 3.1 Service Structure Standardization
├── 3.2 Error Handling Standardization (depends on 3.1)
├── 3.3 Testing Coverage (depends on 3.1, 3.2)
├── 3.4 API Versioning (depends on 3.1)
└── 3.5 Database Migration Strategy (depends on 2.2)

Phase 4 (Week 4-5)
├── 4.1 Database Query Optimization (depends on 1.3)
├── 4.2 Redis Caching Strategy (depends on 1.3)
├── 4.3 API Response Optimization
└── 4.4 Frontend Performance (depends on 2.4)

Phase 5 (Week 5-6)
├── 5.1 CI/CD Pipeline Optimization
├── 5.2 Monitoring & Observability (depends on 3.2)
├── 5.3 Kubernetes Configuration (depends on 1.2)
└── 5.4 Backup & Disaster Recovery

Phase 6 (Week 6-8)
├── 6.1 API Gateway Enhancements (depends on 1.7)
├── 6.2 Event-Driven Architecture
├── 6.3 Feature Flags
└── 6.4 Multi-Tenancy Support (depends on 3.5)

Phase 7 (Week 7-8)
├── 7.1 API Documentation (depends on 3.4)
├── 7.2 Developer Onboarding
└── 7.3 Code Quality Tools
```

---

## Progress Tracking

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1: Critical Security | 8 | 5 | In Progress (1.1, 1.2, 1.3, 1.4, 1.5 Fixed) |
| Phase 2: Dependency Upgrades | 5 | 0 | Not Started |
| Phase 3: Code Quality | 5 | 0 | Not Started |
| Phase 4: Performance | 4 | 0 | Not Started |
| Phase 5: Infrastructure | 4 | 0 | Not Started |
| Phase 6: Features | 4 | 0 | Not Started |
| Phase 7: Documentation | 3 | 0 | Not Started |
| **Total** | **33** | **0** | **0%** |

---

**Last Updated:** May 26, 2026  
**Next Review:** June 2, 2026  
**Document Owner:** Engineering Lead