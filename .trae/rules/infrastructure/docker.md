# Azeebo+ Docker Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines Docker standards and best practices for Azeebo+ containerization.

---

## Docker Overview

### Container Principles

- **Minimal images** - Use Alpine or distroless base images
- **Non-root user** - Run containers as non-root user
- **No secrets** - Never embed secrets in images
- **Multi-stage builds** - Reduce final image size
- **Immutable tags** - Use SHA256 for production

### Image Naming

```
registry/azeebo-plus/<service-name>:<version>-<environment>
registry/azeebo-plus/auth-service:1.0.0-prod
registry/azeebo-plus/user-service:1.0.0-staging
```

---

## Dockerfile Standards

### Multi-Stage Build

```dockerfile
# ✅ Good - Multi-stage build for Node.js
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
```

### Security Best Practices

```dockerfile
# ✅ Good - Secure Dockerfile
FROM node:20-alpine

# Set non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy only necessary files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs dist/ ./dist/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
```

### ❌ Bad Dockerfile

```dockerfile
# ❌ Bad - Never do this
FROM node:latest

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## Image Optimization

### Layer Optimization

```dockerfile
# ✅ Good - Optimized layers
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached)
COPY package*.json ./
RUN npm ci --only=production

# Copy source (changes frequently)
COPY . .

# Build (if needed)
RUN npm run build

CMD ["node", "dist/main.js"]
```

### Image Size Targets

| Environment | Max Size | Notes |
|-------------|----------|-------|
| Development | 500MB | Acceptable for debugging |
| Staging | 200MB | Should be optimized |
| Production | 100MB | Must be minimal |

---

## Docker Compose

### Development Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/azeebo_plus_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/auth-service:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/azeebo_plus_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/user-service:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=azeebo_plus_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  auth-service:
    image: registry/azeebo-plus/auth-service:1.0.0-prod
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    restart: unless-stopped

  user-service:
    image: registry/azeebo-plus/user-service:1.0.0-prod
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
```

---

## Security Standards

### Container Security

```dockerfile
# ✅ Good - Security hardening
FROM node:20-alpine

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy files with proper ownership
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs dist/ ./dist/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Set secure permissions
RUN chmod -R 550 /app && \
    chmod -R 440 /app/package*.json

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Non-root user
USER nodejs

# No exposed ports in base image
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

### Secrets Management

```yaml
# ✅ Good - Docker secrets
version: '3.8'

services:
  auth-service:
    image: registry/azeebo-plus/auth-service:1.0.0-prod
    secrets:
      - db_password
      - redis_password
      - jwt_secret

secrets:
  db_password:
    external: true
    name: azeebo_plus_db_password
  redis_password:
    external: true
    name: azeebo_plus_redis_password
  jwt_secret:
    external: true
    name: azeebo_plus_jwt_secret
```

---

## Health Checks

### Service Health Check

```dockerfile
# ✅ Good - Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
```

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2026-04-23T10:30:00.000Z",
  "service": "auth-service",
  "version": "1.0.0",
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "duration": 15
    },
    {
      "name": "redis",
      "status": "ok",
      "duration": 5
    }
  ]
}
```

---

## CI/CD Integration

### Build Pipeline

```yaml
# .github/workflows/build.yml
name: Build and Push Docker Image

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/auth-service/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: registry.example.com
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: registry.example.com/azeebo-plus/auth-service

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./services/auth-service
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Scan Pipeline

```yaml
# .github/workflows/scan.yml
name: Scan Docker Image

on:
  push:
    branches: [main]
    paths:
      - 'services/**/Dockerfile'

jobs:
  scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: registry.example.com/azeebo-plus/auth-service:latest
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Monitoring

### Container Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| CPU Usage | Container CPU usage | > 80% for 5 min |
| Memory Usage | Container memory usage | > 80% for 5 min |
| Restart Count | Container restart count | > 3 in 1 hour |
| Health Check Failures | Failed health checks | > 3 in 10 min |

### Logging

```json
{
  "timestamp": "2026-04-23T10:30:00.000Z",
  "level": "INFO",
  "container": {
    "id": "abc123",
    "name": "auth-service",
    "image": "registry/azeebo-plus/auth-service:1.0.0-prod"
  },
  "message": "Service started",
  "pid": 1,
  "ppid": 0
}
```

---

## Prohibited Actions

- No running as root
- No secrets in Dockerfile
- No using `latest` tag in production
- No exposing unnecessary ports
- No installing development dependencies in production
- No disabling health checks
- No using `--privileged` flag
- No sharing host network namespace