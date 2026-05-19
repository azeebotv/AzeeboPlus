# 🎬 Azeebo+ Project Documentation

Welcome to the Azeebo+ monorepo! This is a comprehensive guide to help you understand, set up, and work with the Azeebo+ streaming platform project.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running the Project](#running-the-project)
8. [Testing](#testing)
9. [Deployment](#deployment) ⭐ **ENHANCED SECTION**
   - [Project Analysis](#project-analysis)
   - [Deployment by Server Type](#deployment-by-server-type)
   - [Coolify Deployment](#coolify-deployment)
   - [Traditional Server Deployment](#traditional-server-deployment)
   - [Cloud Provider Deployment](#cloud-provider-deployment)
   - [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## 🌟 Project Overview

### What is Azeebo+?
Azeebo+ is a premium content streaming platform similar to Netflix or Disney+, designed to deliver exclusive content from top creators across various entertainment verticals.

### Core Features
- **User Authentication**: Secure JWT-based authentication system
- **Content Management**: Upload, manage, and stream video content
- **Wallet System**: In-app wallet for seamless transactions
- **Payment Integration**: Support for Paystack and Flutterwave
- **Recommendation Engine**: Personalized content suggestions
- **Analytics Dashboard**: Real-time insights and reporting
- **Creator Portal**: Tools for content creators to manage their content

### Target Users
- **End Users**: Content consumers who stream videos
- **Content Creators**: Content producers who upload and manage content
- **Admin Users**: Platform administrators who manage the system

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Applications                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │   Web App   │  │ Mobile App  │  │   Creator Portal       ││
│  │ (Next.js)   │  │  (Expo)     │  │     (React)            ││
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘│
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                │
│              (NestJS - Kong/Express)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Auth Service  │ │  User Service   │ │ Content Service │
│   (NestJS)      │ │   (NestJS)      │ │   (NestJS)      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer                              │
│  PostgreSQL (Main Data)  │  Redis (Caching/Queues)          │
│  S3/Cloud Storage (Media)│                                 │
└─────────────────────────────────────────────────────────────┘
```

### Microservices Architecture
Azeebo+ uses a microservices architecture with the following key services:

| Service | Port | Responsibility |
|---------|------|----------------|
| **api-gateway** | 3013 | API routing and load balancing |
| **auth-service** | 3001 | Authentication and authorization |
| **user-service** | 3002 | User profile management |
| **content-service** | 3003 | Video content management |
| **payment-service** | 3004 | Payment processing |
| **wallet-service** | 3005 | Wallet transactions |
| **analytics-service** | 3006 | Analytics and reporting |
| **notification-service** | 3007 | Email/SMS notifications |
| **moderation-service** | 3008 | Content moderation |
| **search-service** | 3009 | Content search |
| **recommendation-service** | 3010 | Personalized recommendations |
| **reward-service** | 3011 | Loyalty rewards |
| **queue-service** | 3015 | Background job processing |
| **media-service** | 3019 | Media upload and CDN |
| **lifestyle-service** | 3016 | Culture & events |
| **vertical-service** | 3017 | Universe management |
| **admin-panel** | 3018 | Admin panel |
| **creator-portal** | 3014 | Creator portal |

---

## 📂 File Structure

### Complete Directory Structure
```
azeebo-plus/                              # Root directory (MONOREPO)
│
├── 📁 apps/                              # Client Applications
│   ├── 📁 admin/                         # Admin Panel (NestJS)
│   │   ├── src/                         # Source code
│   │   ├── prisma/                      # Database schema
│   │   ├── Dockerfile                   # Container build
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── 📁 creator-portal/               # Creator Portal (NestJS)
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── 📁 mobile/                       # Mobile App (Expo/React Native)
│   │   ├── app/                        # App screens (file-based routing)
│   │   ├── src/                        # API clients, contexts, hooks
│   │   ├── e2e/                        # E2E tests
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── 📁 web/                         # Web App (Next.js)
│       ├── src/
│       │   ├── app/                    # Next.js App Router pages
│       │   ├── components/             # React components
│       │   ├── context/               # React contexts
│       │   ├── hooks/                 # Custom hooks
│       │   └── lib/                   # Utilities (API, analytics)
│       ├── Dockerfile
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── package.json
│
├── 📁 services/                         # Backend Microservices (NestJS)
│   ├── 📁 auth-service/                 # Authentication
│   ├── 📁 user-service/                 # User management
│   ├── 📁 content-service/              # Content management
│   ├── 📁 payment-service/              # Payment processing
│   ├── 📁 wallet-service/              # Wallet system
│   ├── 📁 analytics-service/           # Analytics
│   ├── 📁 notification-service/         # Email/SMS
│   ├── 📁 moderation-service/          # Content moderation
│   ├── 📁 search-service/              # Search
│   ├── 📁 recommendation-service/      # Recommendations
│   ├── 📁 reward-service/              # Rewards
│   ├── 📁 queue-service/               # BullMQ jobs
│   ├── 📁 media-service/               # S3 uploads
│   ├── 📁 api-gateway/                 # API Gateway
│   ├── 📁 lifestyle-service/            # Lifestyle content
│   └── 📁 vertical-service/            # Universe management
│       (Each has: src/, prisma/, Dockerfile, package.json, .env.example)
│
├── 📁 modules/                           # Shared Feature Modules
│   ├── 📁 comedy-service/
│   ├── 📁 creator-service/
│   ├── 📁 games-service/
│   ├── 📁 lifestyle-service/
│   ├── 📁 movie-service/
│   ├── 📁 reality-service/
│   ├── 📁 sports-service/
│   └── 📁 vertical-service/
│
├── 📁 packages/                          # Shared Packages
│   ├── 📁 analytics-sdk/
│   ├── 📁 api-client/
│   └── 📁 design-tokens/
│
├── 📁 infra/                             # Infrastructure
│   ├── 📁 docker/
│   ├── 📁 k8s/                         # Kubernetes manifests
│   │   ├── production/
│   │   ├── staging/
│   │   └── monitoring/
│   └── 📁 load-testing/
│
├── 📁 .github/workflows/                 # CI/CD Pipelines
├── docker-compose.yml                    # Docker orchestration
├── package.json                          # Root workspace config
├── .env.example                          # Environment template
└── guide.md                              # This documentation
```

### Build Artifacts Required

Each service and app produces specific build artifacts:

| Component | Build Output | Runtime Requirements |
|-----------|-------------|---------------------|
| **Web App** | `.next/` folder | Node.js 20, standalone output |
| **Admin Panel** | `dist/` folder | Node.js 20 |
| **Creator Portal** | `dist/` folder | Node.js 20 |
| **All Services** | `dist/` folder | Node.js 20 |
| **Mobile App** | `.expo/` folder | Expo SDK 50+ |

---

## 📦 Prerequisites

### Required Tools
| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| Node.js | >=20.0.0 | Runtime environment | [nodejs.org](https://nodejs.org/) |
| pnpm | >=7.0.0 | Package manager | [pnpm.io](https://pnpm.io/) |
| Docker | Latest | Containerization | [docker.com](https://www.docker.com/) |
| Docker Compose | Latest | Multi-container orchestration | Included with Docker |
| Git | Latest | Version control | [git-scm.com](https://git-scm.com/) |

### Optional Tools
| Tool | Purpose |
|------|---------|
| Visual Studio Code | Recommended IDE |
| Postman | API testing |
| TablePlus | Database management |
| kubectl | Kubernetes management |

---

## 🧪 Local Testing Environment Guide

This section provides comprehensive instructions for setting up and executing a complete local testing environment for the Azeebo+ monorepo.

---

### Testing Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌───────────┐                          │
│                        │   E2E     │                          │
│                        │   Tests   │                          │
│                        │  (Playwright│                         │
│                        │   Detox)  │                          │
│                        └─────┬─────┘                          │
│                              │                                  │
│                    ┌─────────┴─────────┐                      │
│                   │   Integration      │                      │
│                   │      Tests         │                      │
│                   │  (Service APIs)    │                      │
│                   └─────────┬─────────┘                      │
│                             │                                  │
│                   ┌─────────┴─────────┐                      │
│                   │     Unit Tests    │                      │
│                   │   (Jest/ts-jest)  │                      │
│                   └───────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Testing Frameworks by Application

| Application | Unit Tests | Integration Tests | E2E Tests | Framework |
|-------------|------------|-------------------|-----------|-----------|
| **Web App** | ✓ | - | ✓ | Jest + Playwright |
| **Mobile App** | ✓ | - | ✓ | Jest + Detox |
| **Admin Panel** | ✓ | - | - | Jest |
| **Creator Portal** | ✓ | - | - | Jest |
| **Auth Service** | ✓ | ✓ | - | Jest + Supertest |
| **User Service** | ✓ | ✓ | - | Jest + Supertests |
| **Wallet Service** | ✓ | ✓ | - | Jest + Supertests |
| **Content Service** | ✓ | - | - | Jest |
| **API Gateway** | ✓ | - | - | Jest |

---

### Prerequisites for Local Testing

#### System Requirements
- **Node.js**: >=20.0.0
- **pnpm**: >=7.0.0
- **Docker** & **Docker Compose**: Latest (for database services)
- **Git**: Latest

#### Required Services for Testing
```
┌─────────────────────────────────────────────────────────────────┐
│              SERVICES REQUIRED FOR LOCAL TESTING                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │  PostgreSQL  │     │    Redis     │                          │
│  │   Port 5432  │     │   Port 6379  │                          │
│  └──────────────┘     └──────────────┘                          │
│         ▲                    ▲                                  │
│         │                    │                                  │
│  All NestJS Services   Queue, Cache,                           │
│  (Prisma-backed)       Auth Services                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 1: Environment Setup

#### 1.1 Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/azeebo-plus.git
cd azeebo-plus

# Install pnpm if not already installed
npm install -g pnpm@latest

# Install all dependencies using pnpm workspaces
pnpm install

# Verify installation
pnpm --version  # Should show >=7.0.0
```

#### 1.2 Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your local values
nano .env
```

**Required Environment Variables for Testing:**

```bash
# ⚠️ DEVELOPMENT ONLY - NOT FOR PRODUCTION ⚠️
# .env.local or .env for development/testing purposes only

# Database Configuration - DEVELOPMENT ONLY
DATABASE_URL=postgresql://postgres:local_dev_password@localhost:5432/azeebo_plus_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=local_dev_password_never_use_in_production
DATABASE_NAME=azeebo_plus_dev

# Redis Configuration - DEVELOPMENT ONLY
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration - DEVELOPMENT ONLY (use test secrets)
# ⚠️ NEVER use these secrets in production! ⚠️
JWT_SECRET=development_only_secret_must_be_at_least_32_characters_change_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Node Environment
NODE_ENV=test
```

#### 1.3 Start Test Databases with Docker

```bash
# Start PostgreSQL and Redis containers for testing
# ⚠️ DEVELOPMENT/TESTING ONLY - NOT FOR PRODUCTION ⚠️
docker run -d \
  --name azeebo-postgres-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=development_test_password_only \
  -e POSTGRES_DB=azeebo_plus_test \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d \
  --name azeebo-redis-test \
  -p 6379:6379 \
  redis:7-alpine

# Verify containers are running
docker ps | grep azeebo
```

---

### Step 2: Database Initialization

#### 2.1 Generate Prisma Clients

```bash
# Generate Prisma client for all services that use it
cd services/auth-service && pnpm prisma generate && cd ../..
cd services/user-service && pnpm prisma generate && cd ../..
cd services/wallet-service && pnpm prisma generate && cd ../..
cd services/content-service && pnpm prisma generate && cd ../..
cd apps/admin && pnpm prisma generate && cd ../..
cd apps/creator-portal && pnpm prisma generate && cd ../..

# Or generate all at once (if you have a script)
pnpm -r exec prisma generate
```

#### 2.2 Run Database Migrations

```bash
# For each service with a database, run migrations
cd services/auth-service && pnpm prisma migrate dev --name init && cd ../..
cd services/user-service && pnpm prisma migrate dev --name init && cd ../..
cd services/wallet-service && pnpm prisma migrate dev --name init && cd ../..
cd services/content-service && pnpm prisma migrate dev --name init && cd ../..
cd apps/admin && pnpm prisma migrate dev --name init && cd ../..
cd apps/creator-portal && pnpm prisma migrate dev --name init && cd ../..
```

#### 2.3 Create Test Database Schema

All services should use versioned migrations. For new services, initialize migrations with:

```bash
# Example for a new service
cd services/my-new-service
pnpm prisma migrate dev --name init
cd ../..
```

---

### Step 3: Running Unit Tests

#### 3.1 Run All Unit Tests

```bash
# Run all unit tests across the monorepo
pnpm test

# Or run tests in CI mode (with coverage)
pnpm run test:ci
```

#### 3.2 Run Tests for Specific Services

```bash
# Auth Service tests
cd services/auth-service && pnpm test

# User Service tests
cd services/user-service && pnpm test

# Wallet Service tests
cd services/wallet-service && pnpm test

# Content Service tests
cd services/content-service && pnpm test

# Admin Panel tests
cd apps/admin && pnpm test

# Web App tests
cd apps/web && pnpm test

# Mobile App tests
cd apps/mobile && pnpm test
```

#### 3.3 Unit Test Commands by Type

```bash
# Run tests once (no watch mode)
pnpm test

# Run tests in watch mode (development)
pnpm test --watch

# Generate coverage report
pnpm test --coverage

# Run specific test file
pnpm test -- src/modules/auth/auth.service.spec.ts
```

---

### Step 4: Running Integration Tests

#### 4.1 Prerequisites for Integration Tests

Integration tests require running database instances:

```bash
# Start database for integration testing
docker-compose up -d postgres redis

# Verify services are healthy
docker-compose ps
```

#### 4.2 Run Integration Tests by Service

```bash
# Auth Service Integration Tests
cd services/auth-service
pnpm test:integration

# User Service Integration Tests
cd services/user-service
pnpm test:integration

# Wallet Service Integration Tests
cd services/wallet-service
pnpm test:integration
```

#### 4.3 Integration Test Patterns

The project uses these integration test patterns:

**Database Integration Tests:**
```typescript
// Example: services/auth-service/src/modules/auth/auth.integration.spec.ts
describe('AuthService Integration', () => {
  beforeAll(async () => {
    // Setup test database connection
    await TestDatabase.setup();
  });

  afterAll(async () => {
    // Cleanup test database
    await TestDatabase.teardown();
  });

  it('should register a new user', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: '[REPLACE_WITH_SECURE_PASSWORD]',
      displayName: 'Test User'
    });
    expect(result.success).toBe(true);
  });
});
```

**API Integration Tests:**
```typescript
// Using supertest for HTTP-level integration tests
describe('AuthController Integration', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
    await app.init();
  });

  it('POST /auth/register - should create user', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: '[REPLACE_WITH_SECURE_PASSWORD]',
        displayName: 'Test User'
      })
      .expect(201);
  });
});
```

---

### Step 5: Running E2E Tests

#### 5.1 Web App E2E Tests (Playwright)

```bash
# Install Playwright browsers
cd apps/web
pnpm exec playwright install

# Run E2E tests
pnpm exec playwright test

# Run specific E2E test file
pnpm exec playwright test e2e/auth.spec.ts

# Run E2E tests with UI
pnpm exec playwright test --ui

# Generate E2E report
pnpm exec playwright show-report
```

**Web E2E Test Configuration:**
```typescript
// apps/web/playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    # Use environment variable for production testing, default to localhost for development only
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000', # ⚠️ Localhost only for development
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

#### 5.2 Mobile App E2E Tests (Detox)

```bash
# Navigate to mobile app
cd apps/mobile

# Build the app for testing
expo build --platform ios --type simulator
# Or for Android
expo build --platform android --type emulator

# Run Detox E2E tests
pnpm test:e2e

# Or run specific test
pnpm exec detox test e2e/auth.spec.e2e.ts
```

**Mobile E2E Test Structure:**
```typescript
// apps/mobile/e2e/auth.spec.e2e.ts
describe('Mobile App Authentication Flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen', async () => {
    await expect(element(by.id('loginScreen'))).toBeVisible();
  });

  it('should navigate to register screen', async () => {
    await element(by.id('registerLink')).tap();
    await expect(element(by.id('registerScreen'))).toBeVisible();
  });
});
```

#### 5.3 Running All E2E Tests

```bash
# From root directory
pnpm -r --filter=@azeebo/web exec playwright test
pnpm -r --filter=@azeebo/mobile exec detox test
```

---

### Step 6: Performance Testing

#### 6.1 Load Testing Setup

The project includes k6 load testing scripts:

```bash
# Install k6 (if not installed)
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu

# ⚠️ DEVELOPMENT ONLY - Run load test against local API Gateway
cd infra/load-testing
# For production testing, set BASE_URL to your production API endpoint
BASE_URL=http://localhost:3013 k6 run load-test.js
```

**Load Test Configuration:**
```javascript
// infra/load-testing/load-test.js
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 1000 },  // Steady state
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};
```

#### 6.2 Performance Benchmarks

| Metric | Target | Critical |
|--------|--------|----------|
| API Response Time (p95) | < 200ms | < 500ms |
| API Error Rate | < 0.1% | < 1% |
| Page Load Time | < 2s | < 5s |
| Mobile App Launch | < 3s | < 10s |
| Database Query Time | < 50ms | < 200ms |

---

### Step 7: Security Testing

#### 7.1 Security Testing Tools

```bash
# Install security dependencies
pnpm add --save-dev @types/jest @types/supertest

# Run security-focused tests
pnpm test -- --testPathPattern=security

# Run authentication bypass tests
pnpm test -- --testNamePattern="auth"
```

#### 7.2 Security Test Categories

| Test Type | Coverage | Tool |
|-----------|----------|------|
| **SQL Injection** | All DB queries via Prisma | Jest |
| **XSS** | User inputs, API responses | Playwright |
| **CSRF** | State-changing operations | Playwright |
| **Auth Bypass** | Protected endpoints | Jest + Supertest |
| **Rate Limiting** | API endpoints | k6 |
| **Input Validation** | All DTOs | Jest |

---

### Step 8: Compatibility Testing

#### 8.1 Browser Compatibility (Web)

```bash
# Run Playwright tests across browsers
cd apps/web
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

**Browser Support Matrix:**

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |

#### 8.2 Mobile Device Compatibility

| Device | OS Version | Support Level |
|--------|------------|---------------|
| iPhone 12+ | iOS 15+ | Full |
| iPhone X | iOS 14+ | Full |
| Pixel 5 | Android 12+ | Full |
| Samsung Galaxy S21 | Android 11+ | Full |

---

### Step 9: Troubleshooting Common Issues

#### 9.1 Database Connection Issues

**Issue: "Cannot connect to PostgreSQL"**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL container
docker restart azeebo-postgres-test

# ⚠️ DEVELOPMENT ONLY - Verify local connection
psql -h localhost -p 5432 -U postgres -d azeebo_plus_test

# Check logs
docker logs azeebo-postgres-test
```

**Issue: "Prisma Client not generated"**

```bash
# Regenerate Prisma Client
cd services/auth-service
rm -rf node_modules/.prisma
pnpm prisma generate

# Clear Prisma cache
pnpm prisma migrate reset
```

#### 9.2 Test Discovery Issues

**Issue: "No tests found"**

```bash
# Verify test file naming convention
# Should match: *.spec.ts, *.test.ts, or *.e2e.spec.ts

# Run with verbose output
pnpm test --verbose

# Check jest configuration
cat services/auth-service/jest.config.js
```

**Issue: "Module not found"**

```bash
# Clear all caches
pnpm store prune
rm -rf node_modules/.cache

# Reinstall dependencies
pnpm install
```

#### 9.3 E2E Test Issues

**Issue: "Playwright browsers not installed"**

```bash
# Install browsers
cd apps/web
pnpm exec playwright install

# Verify installation
pnpm exec playwright install --check
```

**Issue: "Detox cannot find app binary"**

```bash
# Rebuild the app
cd apps/mobile
expo build:ios --type simulator
expo build:android --type emulator

# Then run tests
detox build
detox test
```

#### 9.4 Docker Compose Issues

**Issue: "Port already in use"**

```bash
# Find what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process or use a different port
docker-compose down
docker system prune -f
```

**Issue: "Container exits immediately"**

```bash
# Check container logs
docker logs azeebo-postgres-test
docker logs azeebo-redis-test

# Check docker-compose.yml for issues
cat docker-compose.yml
```

#### 9.5 CI Pipeline Test Failures

**Issue: "Tests pass locally but fail in CI"**

```bash
# Run tests exactly as CI would
CI=true pnpm test:ci

# Check for race conditions
pnpm test -- --runInBand

# Increase timeout
pnpm test -- --testTimeout=30000
```

---

### Step 10: Test Scripts Reference

#### Root Level Commands

```bash
# Install all dependencies
pnpm install

# Run all tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format

# Build all packages
pnpm build

# Clean everything
pnpm clean
```

#### Service Level Commands

```bash
# Auth Service
cd services/auth-service
pnpm test           # Run unit tests
pnpm test:watch     # Watch mode
pnpm test:cov      # With coverage
pnpm test:integration  # Integration tests

# User Service
cd services/user-service
pnpm test
pnpm test:cov

# Wallet Service
cd services/wallet-service
pnpm test
pnpm test:integration

# Content Service
cd services/content-service
pnpm test
pnpm test:cov
```

#### App Level Commands

```bash
# Web App
cd apps/web
pnpm dev           # Development server
pnpm build         # Production build
pnpm lint          # Lint code
pnpm test:e2e      # Playwright E2E tests

# Mobile App
cd apps/mobile
pnpm start         # Expo dev server
pnpm test          # Jest unit tests
pnpm test:e2e      # Detox E2E tests

# Admin Panel
cd apps/admin
pnpm test
pnpm start:dev     # Development server
```

---

### Step 11: CI/CD Testing Pipeline

The project uses GitHub Actions for continuous integration:

```yaml
# .github/workflows/ci.yml - Key test stages
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint code
        run: pnpm run lint
      
      - name: Build all packages
        run: pnpm run build
      
      - name: Run tests
        run: pnpm run test:ci
```

**CI Test Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                      CI TEST PIPELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Checkout Code                                           │
│         │                                                    │
│         ▼                                                    │
│  2. Setup Node.js 20                                        │
│         │                                                    │
│         ▼                                                    │
│  3. Install pnpm & Dependencies                             │
│         │                                                    │
│         ▼                                                    │
│  4. Lint Code (pnpm lint)                                    │
│         │                                                    │
│         ├──── Pass ────► Continue                             │
│         │                                                    │
│         └──── Fail ────► Stop (Report Error)                 │
│                                                              │
│  5. Build All Packages (pnpm build)                          │
│         │                                                    │
│         ├──── Pass ────► Continue                             │
│         │                                                    │
│         └──── Fail ────► Stop (Report Error)                 │
│                                                              │
│  6. Run Tests (pnpm test:ci)                                 │
│         │                                                    │
│         ├──── Pass ────► Deploy/Merge                        │
│         │                                                    │
│         └──── Fail ────► Stop (Report Error)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 12: Coverage Requirements

#### Coverage Thresholds

| Component | Line Coverage | Branch Coverage | Function Coverage |
|-----------|---------------|-----------------|-------------------|
| **Services** | 80% | 75% | 80% |
| **Apps** | 70% | 65% | 70% |
| **Shared Packages** | 90% | 85% | 90% |
| **API Gateway** | 75% | 70% | 75% |

#### Generating Coverage Reports

```bash
# Generate coverage for a service
cd services/auth-service
pnpm test:cov

# View coverage report
open coverage/lcov-report/index.html
```

---

### Testing Checklist

Before considering testing complete, verify:

- [ ] All unit tests pass (`pnpm test`)
- [ ] All integration tests pass with test database
- [ ] E2E tests pass for web app (Playwright)
- [ ] E2E tests pass for mobile app (Detox)
- [ ] Load tests complete with acceptable thresholds
- [ ] Security tests pass (no vulnerabilities found)
- [ ] Coverage meets minimum thresholds
- [ ] All tests pass in CI pipeline

---

## 🚀 Deployment Guide ⭐

This section provides comprehensive deployment instructions for various server environments.

---

## 🔍 Project Analysis

### Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TECHNOLOGY STACK                   │
├─────────────────────────────────────────────────────────────────┤
│  FRONTEND                                                      │
│  ├─ Web App: Next.js 14 (App Router) + React 18                │
│  ├─ Admin Panel: NestJS + React                                │
│  ├─ Creator Portal: NestJS + React                             │
│  └─ Mobile App: Expo SDK 50 + React Native                     │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND                                                       │
│  ├─ Runtime: Node.js 20 LTS                                    │
│  ├─ Framework: NestJS 10                                      │
│  ├─ API Gateway: Custom NestJS implementation                 │
│  └─ Message Queue: BullMQ (Redis-backed)                      │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE & CACHE                                              │
│  ├─ Primary DB: PostgreSQL 15                                 │
│  ├─ Cache/Queue: Redis 7                                      │
│  └─ ORM: Prisma 5                                             │
├─────────────────────────────────────────────────────────────────┤
│  STORAGE                                                       │
│  ├─ Media Files: AWS S3 (or compatible)                       │
│  └─ CDN: CloudFront (or provider-specific)                   │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE                                               │
│  ├─ Containers: Docker + Docker Compose                       │
│  ├─ Orchestration: Kubernetes (production)                    │
│  ├─ CI/CD: GitHub Actions                                     │
│  └─ Infrastructure as Code: Terraform (optional)              │
└─────────────────────────────────────────────────────────────────┘
```

### Critical Deployment Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                 CRITICAL SERVICE DEPENDENCIES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                                               │
│   │  PostgreSQL │ ◄── Required by ALL services                  │
│   │    Port 5432│     except queue-service                     │
│   └──────┬──────┘                                               │
│          │                                                      │
│   ┌──────▼──────┐     ┌─────────────────┐                      │
│   │    Redis    │◄────│ queue-service   │                      │
│   │   Port 6379 │     │ notification-svc│                      │
│   └──────┬──────┘     │ analytics-svc   │                      │
│          │            │ auth-service    │                      │
│          │            └─────────────────┘                      │
│          │                                                      │
│   ┌──────▼──────┐     ┌─────────────────┐                      │
│   │   AWS S3    │◄────│ media-service   │                      │
│   │  (Media)    │     └─────────────────┘                      │
│   └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Minimum Server Requirements

| Environment | CPU | RAM | Storage | Use Case |
|-------------|-----|-----|---------|----------|
| **Development** | 2 cores | 4 GB | 20 GB | Local testing |
| **Staging** | 4 cores | 8 GB | 50 GB | Pre-production testing |
| **Production (Small)** | 8 cores | 16 GB | 100 GB | < 1,000 users |
| **Production (Medium)** | 16 cores | 32 GB | 200 GB | < 10,000 users |
| **Production (Large)** | 32+ cores | 64+ GB | 500+ GB | 10,000+ users |

---

## 🌐 Deployment by Server Type

### Deployment Target Overview

```
                    ┌─────────────────────────────────────────┐
                    │         DEPLOYMENT OPTIONS               │
                    └──────────────────┬──────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
    ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
    │   COOLIFY   │            │    DOCKER   │            │   KUBERNETES│
    │  (SaaS/SE)  │            │ (Docker CE) │            │  (Prod)     │
    └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
           │                          │                          │
           ▼                          ▼                          ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    SERVER ENVIRONMENTS                           │
    ├──────────────┬──────────────┬──────────────┬────────────────────┤
    │    VPS       │    Cloud     │   Bare Metal │    Container       │
    │ (DigitalOcean│  (AWS/GCP/  │   (物理服务器) │    (Docker)       │
    │  Vultr Linode│   Azure)    │              │                    │
    └──────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## ❄️ Coolify Deployment

### What is Coolify?
Coolify is an all-in-one, open-source deployment platform that handles building, deploying, and managing your applications with zero configuration required.

### Prerequisites for Coolify
- [ ] A server (VPS) with SSH access (Ubuntu 20.04+ recommended)
- [ ] Domain name pointed to your server's IP
- [ ] GitHub/GitLab account with your repository
- [ ] Minimum server specs: 2GB RAM, 2 CPUs, 20GB storage

### Architecture: Coolify Deployment
```
┌─────────────────────────────────────────────────────────────────┐
│                    COOLIFY DEPLOYMENT FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. ┌──────────────┐                                           │
│      │  GitHub/GitLab│                                          │
│      │   Repository  │                                          │
│      └───────┬───────┘                                          │
│              │ git push                                          │
│              ▼                                                   │
│   2. ┌──────────────┐                                           │
│      │   Coolify    │◄──── Webhook trigger                       │
│      │   Dashboard  │                                           │
│      └───────┬───────┘                                           │
│              │                                                   │
│              ▼ Build & Deploy                                   │
│   3. ┌──────────────────────────────────────────┐              │
│      │          Your Server                       │              │
│      │  ┌─────────────────────────────────────┐  │              │
│      │  │  Docker Containers                  │  │              │
│      │  │  ├─ Web App (Port 3000)             │  │              │
│      │  │  ├─ Auth Service (Port 3001)         │  │              │
│      │  │  ├─ Content Service (Port 3003)     │  │              │
│      │  │  └─ PostgreSQL + Redis (Ports 5432,6379)│ │              │
│      │  └─────────────────────────────────────┘  │              │
│      └──────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Coolify Deployment

#### Step 1: Install Coolify on Your Server

```bash
# SSH into your server
ssh root@your-server-ip

# Run Coolify installer (wait 5-10 minutes)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# After installation, you'll see:
# ✓ Coolify is running at: https://your-server-ip:8000
# ✓ Initial password: (copy the displayed password)
```

#### Step 2: Initial Coolify Setup

1. Open browser: `https://your-server-ip:8000`
2. Login with username `admin` and the generated password
3. **Change your password immediately**
4. Click **Settings** → **Nameservers** → Set your domain's nameservers
5. Click **Settings** → **SSL** → Enable automatic SSL

#### Step 3: Add Your Repository

```
┌─────────────────────────────────────────────────────────────────┐
│                    COOLIFY DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [+] New Project                                              │
│                                                                 │
│   Project Name: azeebo-plus                                    │
│   ─────────────────                                           │
│                                                                 │
│   ┌─ Services ─────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │   ┌─ Database ──────────────────────────────────────┐   │   │
│   │   │  ○ PostgreSQL 15                               │   │   │
│   │   │  ○ Redis 7                                     │   │   │
│   │   └────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   │   ┌─ Applications ─────────────────────────────────┐   │   │
│   │   │  ○ Web App                                     │   │   │
│   │   │  ○ Admin Panel                                 │   │   │
│   │   │  ○ Creator Portal                              │   │   │
│   │   └────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   │   ┌─ Backend Services ──────────────────────────────┐   │   │
│   │   │  ○ API Gateway                                 │   │   │
│   │   │  ○ Auth Service                                 │   │   │
│   │   │  ○ User Service                                 │   │   │
│   │   │  ○ Content Service                              │   │   │
│   │   │  ... (all 14 services)                         │   │   │
│   │   └────────────────────────────────────────────────┘   │   │
│   │                                                          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 4: Deploy Database (First!)

**4.1 Add PostgreSQL**
```
Dashboard → + Add Database → PostgreSQL

Configuration:
├─ Name: azeebo-postgres
├─ Version: 15-alpine
├─ Port: 5432
└─ Volume: postgres_data:/var/lib/postgresql/data

Environment Variables:
├─ POSTGRES_USER: azeebo
├─ POSTGRES_PASSWORD: (generate secure password)
└─ POSTGRES_DB: azeebo_plus
```

**4.2 Add Redis**
```
Dashboard → + Add Database → Redis

Configuration:
├─ Name: azeebo-redis
├─ Version: 7-alpine
├─ Port: 6379
└─ Volume: redis_data:/data
```

#### Step 5: Deploy Backend Services

For each backend service, follow this pattern:

**5.1 Add Auth Service**
```
Dashboard → + New Resource → Application

Source Configuration:
├─ Repository: your-github/azeebo-plus
├─ Branch: main
└─ Build Pack: Nixpacks (Node.js)

Build Configuration:
├─ Base Directory: services/auth-service
├─ Build Command: pnpm install && pnpm prisma generate && pnpm build
└─ Start Command: node dist/main.js

Port Configuration:
├─ HTTP Port: 3000
└─ Exposed Port: 3001

Environment Variables:
├─ NODE_ENV: production
├─ DATABASE_URL: postgresql://azeebo:(password)@(postgres-ip):5432/azeebo_plus
├─ REDIS_URL: redis://(redis-ip):6379
├─ JWT_SECRET: (generate 64-char secret)
├─ JWT_EXPIRES_IN: 30m
└─ JWT_REFRESH_EXPIRES_IN: 7d

Health Check:
├─ URL: /health
└─ Interval: 30s
```

**5.2 Deploy All Other Services**
Repeat the same pattern for these services:

| Service | Base Directory | Port | Key Env Variables |
|---------|----------------|------|-------------------|
| user-service | services/user-service | 3002 | DATABASE_URL, REDIS_URL |
| content-service | services/content-service | 3003 | DATABASE_URL, REDIS_URL |
| payment-service | services/payment-service | 3004 | DATABASE_URL, PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY |
| wallet-service | services/wallet-service | 3005 | DATABASE_URL, REDIS_URL |
| analytics-service | services/analytics-service | 3006 | DATABASE_URL, REDIS_URL |
| notification-service | services/notification-service | 3007 | DATABASE_URL, SENDGRID_API_KEY, TWILIO_* |
| moderation-service | services/moderation-service | 3008 | DATABASE_URL, REDIS_URL |
| search-service | services/search-service | 3009 | DATABASE_URL, REDIS_URL |
| recommendation-service | services/recommendation-service | 3010 | DATABASE_URL, REDIS_URL |
| reward-service | services/reward-service | 3011 | DATABASE_URL, REDIS_URL |
| queue-service | services/queue-service | 3015 | REDIS_HOST, TWILIO_*, SENDGRID_API_KEY |
| media-service | services/media-service | 3019 | AWS_*, CDN_URL |
| lifestyle-service | services/lifestyle-service | 3016 | DATABASE_URL |
| vertical-service | services/vertical-service | 3017 | DATABASE_URL |
| api-gateway | services/api-gateway | 3013 | All service URLs |

#### Step 6: Deploy Frontend Applications

**6.1 Deploy Web App (Next.js)**
```
Dashboard → + New Resource → Application

Source Configuration:
├─ Repository: your-github/azeebo-plus
├─ Branch: main
└─ Build Pack: Nixpacks (Node.js)

Build Configuration:
├─ Base Directory: apps/web
├─ Build Command: pnpm install && pnpm build
└─ Start Command: npm start

Port Configuration:
├─ HTTP Port: 3000
└─ Exposed Port: 3000

Environment Variables:
├─ NODE_ENV: production
├─ NEXT_PUBLIC_API_BASE_URL: https://api.yourdomain.com
├─ NEXT_PUBLIC_APP_URL: https://www.yourdomain.com
└─ NEXT_PUBLIC_CDN_URL: https://cdn.yourdomain.com

Domains:
├─ Primary Domain: www.yourdomain.com
└─ Redirect: yourdomain.com → www.yourdomain.com
```

**6.2 Deploy Admin Panel**
```
Base Directory: apps/admin
Build Command: pnpm install && pnpm build
Start Command: node dist/main.js
Port: 3016
Domain: admin.yourdomain.com
```

**6.3 Deploy Creator Portal**
```
Base Directory: apps/creator-portal
Build Command: pnpm install && pnpm build
Start Command: node dist/main.js
Port: 3014
Domain: creator.yourdomain.com
```

#### Step 7: Configure API Gateway

The API Gateway is crucial - it routes all frontend requests to the correct backend service:

```
Environment Variables for API Gateway:
├─ AUTH_SERVICE_URL: http://auth-service:3000
├─ USER_SERVICE_URL: http://user-service:3000
├─ CONTENT_SERVICE_URL: http://content-service:3000
├─ PAYMENT_SERVICE_URL: http://payment-service:3000
├─ WALLET_SERVICE_URL: http://wallet-service:3000
├─ NOTIFICATION_SERVICE_URL: http://notification-service:3000
├─ RECOMMENDATION_SERVICE_URL: http://recommendation-service:3000
├─ SEARCH_SERVICE_URL: http://search-service:3000
├─ ANALYTICS_SERVICE_URL: http://analytics-service:3000
├─ MODERATION_SERVICE_URL: http://moderation-service:3000
└─ PORT: 3000
```

#### Step 8: Post-Deployment Verification

```bash
# Test health endpoints
curl https://api.yourdomain.com/health
curl https://www.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-05-05T12:00:00.000Z"}

# Test authentication
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"[REPLACE_WITH_SECURE_PASSWORD]"}'
```

---

## 🖥️ Traditional Server Deployment (VPS/Bare Metal)

### Deployment Flow
```
┌─────────────────────────────────────────────────────────────────┐
│              TRADITIONAL VPS DEPLOYMENT FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. Prepare Server                                             │
│      ┌─────────────────────────────────────────────┐            │
│      │  Ubuntu 22.04 LTS                          │            │
│      │  ├─ Install Docker & Docker Compose       │            │
│      │  ├─ Install PostgreSQL 15                  │            │
│      │  ├─ Install Redis 7                        │            │
│      │  └─ Configure Firewall (ufw)               │            │
│      └─────────────────────────────────────────────┘            │
│                         │                                       │
│                         ▼                                       │
│   2. Clone Repository                                           │
│      ┌─────────────────────────────────────────────┐            │
│      │  git clone https://github.com/your/repo    │            │
│      │  cd azeebo-plus                            │            │
│      └─────────────────────────────────────────────┘            │
│                         │                                       │
│                         ▼                                       │
│   3. Configure Environment                                      │
│      ┌─────────────────────────────────────────────┐            │
│      │  cp .env.example .env                       │            │
│      │  # Edit .env with production values        │            │
│      └─────────────────────────────────────────────┘            │
│                         │                                       │
│                         ▼                                       │
│   4. Deploy with Docker Compose                                 │
│      ┌─────────────────────────────────────────────┐            │
│      │  docker-compose up -d                      │            │
│      │  docker-compose ps                          │            │
│      └─────────────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Server Preparation

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Add current user to docker group (optional)
usermod -aG docker $USER

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Step 2: Clone and Configure

```bash
# Clone repository
cd /opt
git clone https://github.com/your-org/azeebo-plus.git
cd azeebo-plus

# Create production environment file
cp .env.example .env
nano .env
```

**Essential environment variables for production:**
```env
# ⚠️ REQUIRED - Production environment mode (MUST be set to production)
NODE_ENV=production

# ⚠️ REQUIRED - JWT Secrets (MUST be generated securely, min 32 chars)
# Services will fail to start if these are missing
JWT_SECRET=generate-a-64-character-random-string-here
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=generate-another-64-character-random-string-here

# ⚠️ REQUIRED - Database Configuration (MUST be set)
# Services will fail to start if DATABASE_URL is missing
DATABASE_URL=postgresql://user:secure-password@db-host:5432/database-name

# ⚠️ REQUIRED - Redis Configuration (MUST be set)
REDIS_URL=redis://redis-host:6379

# ⚠️ REQUIRED - Service URLs (MUST be set for inter-service communication)
AUTH_SERVICE_URL=https://auth.yourdomain.com
USER_SERVICE_URL=https://users.yourdomain.com
WALLET_SERVICE_URL=https://wallet.yourdomain.com
PAYMENT_SERVICE_URL=https://payment.yourdomain.com
CONTENT_SERVICE_URL=https://content.yourdomain.com
MEDIA_SERVICE_URL=https://media.yourdomain.com

# ⚠️ REQUIRED - CORS Configuration (MUST be set in production)
ALLOWED_ORIGINS=https://www.yourdomain.com,https://app.yourdomain.com

# Payment Provider Keys (REQUIRED if using payments)
PAYSTACK_SECRET_KEY=your-paystack-secret-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key

# Optional but recommended
API_TIMEOUT=30000
LOG_LEVEL=info
```

**Fail-Fast Behavior:**
- Services will throw an error on startup if required variables are missing
- Required variables include: NODE_ENV, JWT_SECRET, DATABASE_URL, REDIS_URL
- All service URLs must be configured for inter-service communication
- CORS origins must be explicitly set in production

**Generating Secure Secrets:**
```bash
# Generate a 64-character random secret
openssl rand -hex 32

# Generate a 128-character random secret
openssl rand -hex 64
```
POSTGRES_USER=azeebo
POSTGRES_PASSWORD=[REPLACE_WITH_SECURE_PASSWORD]
POSTGRES_DB=azeebo_plus
DATABASE_URL=postgresql://azeebo:[REPLACE_WITH_SECURE_PASSWORD]@localhost:5432/azeebo_plus

# Redis
REDIS_PASSWORD=redis-password-here
REDIS_URL=redis://:redis-password-here@localhost:6379

# Payment Providers
PAYSTACK_SECRET_KEY=sk_live_your_key
FLUTTERWAVE_SECRET_KEY=flw_sec_key_your_key

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=azeebo-media
CDN_URL=https://cdn.yourdomain.com
```

### Step 3: Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f auth-service

# Check health
curl http://localhost:3013/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
```

### Step 4: Configure Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/azeebo
```

**Nginx Configuration:**
```nginx
# Frontend - Web App
server {
    listen 80;
    server_name www.yourdomain.com yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Gateway
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3013;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/azeebo /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install SSL certificate
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Directory Structure on VPS
```
/opt/azeebo-plus/                    # Application code
├── apps/                           # Frontend apps
├── services/                       # Backend services
├── docker-compose.yml              # Container orchestration
└── .env                           # Environment variables

/var/lib/docker/                    # Docker data (managed by Docker)
├── volumes/                       # Named volumes
│   ├── postgres_data/             # Database files
│   └── redis_data/               # Redis persistence
└── networks/                      # Docker networks

/etc/nginx/                        # Web server config
├── sites-available/               # Site configs
└── sites-enabled/                 # Enabled sites

/var/log/nginx/                    # Web server logs
```

---

## ☁️ Cloud Provider Deployment

### AWS (Amazon Web Services)

#### Architecture on AWS
```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS DEPLOYMENT ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Route 53 (DNS)                       │   │
│  │         www.yourdomain.com │ api.yourdomain.com        │   │
│  └─────────────────────────────┬───────────────────────────┘   │
│                                │                                │
│              ┌─────────────────┼─────────────────┐             │
│              ▼                 ▼                 ▼             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │
│  │ CloudFront    │   │ CloudFront    │   │ CloudFront    │     │
│  │ (Web App)     │   │ (Admin)       │   │ (API)         │     │
│  │   :3000       │   │   :3018       │   │   :3013       │     │
│  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘     │
│          │                   │                    │             │
│          └───────────────────┼────────────────────┘             │
│                              │                                  │
│                     ┌────────▼────────┐                         │
│                     │   ALB (Load     │                         │
│                     │   Balancer)     │                         │
│                     └────────┬────────┘                         │
│                              │                                   │
│          ┌───────────────────┼───────────────────┐               │
│          ▼                   ▼                   ▼               │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │
│  │ ECS Cluster   │   │ ECS Cluster   │   │ RDS PostgreSQL│     │
│  │ (Containers)  │   │ (Containers)  │   │   (Database)  │     │
│  └───────────────┘   └───────────────┘   └───────────────┘     │
│          │                   │                    │             │
│          ▼                   ▼                    ▼             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │
│  │ ElastiCache   │   │ S3 Bucket     │   │ SES (Email)   │     │
│  │   (Redis)     │   │   (Media)     │   │               │     │
│  └───────────────┘   └───────────────┘   └───────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### AWS ECS Deployment Steps

**1. Create ECR Repositories**
```bash
# Install AWS CLI
apt install -y awscli

# Configure AWS credentials
aws configure

# Create ECR repositories for each service
for service in web admin creator-portal api-gateway auth-service user-service content-service payment-service wallet-service analytics-service notification-service moderation-service search-service recommendation-service reward-service queue-service media-service lifestyle-service vertical-service; do
  aws ecr create-repository --repository-name azeebo/$service
done
```

**2. Build and Push Docker Images**
```bash
# Login to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Build and push each service
for service in web admin creator-portal; do
  docker build -t azeebo-$service ./apps/$service
  docker tag azeebo-$service:latest your-account.dkr.ecr.us-east-1.amazonaws.com/azeebo-$service:latest
  docker push your-account.dkr.ecr.us-east-1.amazonaws.com/azeebo-$service:latest
done

for service in auth-service user-service content-service payment-service; do
  docker build -t azeebo-$service ./services/$service
  docker tag azeebo-$service:latest your-account.dkr.ecr.us-east-1.amazonaws.com/azeebo-$service:latest
  docker push your-account.dkr.ecr.us-east-1.amazonaws.com/azeebo-$service:latest
done
```

**3. Create ECS Task Definitions**
Create task-definition.json for each service:
```json
{
  "family": "azeebo-web",
  "containerDefinitions": [{
    "name": "web",
    "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/azeebo-web:latest",
    "memory": 1024,
    "cpu": 512,
    "essential": true,
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }],
    "environment": [{
      "name": "NODE_ENV",
      "value": "production"
    }],
    "secrets": [{
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:azeebo/DATABASE_URL"
    }]
  }]
}
```

### Google Cloud Platform (GCP)

#### GCP Deployment with Cloud Run

```bash
# Install Google Cloud SDK
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk-list" | tee /etc/apt/sources.list.d/google-cloud-sdk.list
apt update && apt install -y google-cloud-sdk

# Authenticate
gcloud auth login
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable run.googleapis.com compute.googleapis.com container.googleapis.com

# Build and deploy to Cloud Run
for service in web admin api-gateway auth-service; do
  gcloud builds submit --tag gcr.io/your-project/azeebo-$service ./$service
  gcloud run deploy azeebo-$service \
    --image gcr.io/your-project/azeebo-$service:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
done
```

### Microsoft Azure

#### Azure Container Apps Deployment

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Login
az login

# Create resource group
az group create --name azeebo-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name azeebo-env \
  --resource-group azeebo-rg \
  --location eastus

# Deploy each service
for service in web api-gateway auth-service; do
  az containerapp create \
    --name azeebo-$service \
    --resource-group azeebo-rg \
    --environment azeebo-env \
    --image yourregistry.azurecr.io/azeebo-$service:latest \
    --target-port 3000 \
    --ingress external \
    --cpu 0.5 \
    --memory 1Gi
done
```

---

## 🐳 Kubernetes Deployment

### For production environments, use the Kubernetes manifests:

```bash
# Navigate to Kubernetes manifests
cd infra/k8s

# Apply production configuration
kubectl apply -k production/

# Check deployment status
kubectl get pods -n azeebo
kubectl get services -n azeebo

# View logs
kubectl logs -n azeebo deployment/auth-service
```

---

## 🔧 Troubleshooting

### Deployment Troubleshooting Matrix

| Problem | Cause | Solution |
|---------|-------|----------|
| Service won't start | Missing environment variable | Check `.env` file, ensure all required vars set |
| Database connection failed | Wrong DATABASE_URL | Verify PostgreSQL is running, check connection string |
| Port already in use | Another process using port | Run `lsof -i :PORT` to find process |
| SSL certificate error | Domain not pointing correctly | Wait 24-48hrs for DNS propagation |
| Build failed | Node version mismatch | Ensure Node.js 20+ is installed |
| 502 Bad Gateway | Service crashed | Check logs: `docker-compose logs service-name` |
| CORS errors | Wrong ALLOWED_ORIGINS | Set correct origin in service environment |

### Coolify-Specific Issues

#### Issue: Build Fails with "pnpm not found"
**Solution:**
```
In Coolify dashboard:
→ Application Settings
→ Build Settings
→ Add Custom Build Command:
  curl -fsSL https://get.pnpm.io/install.sh | sh && pnpm install && pnpm build
```

#### Issue: Container Exits Immediately
**Solution:**
```
1. Check logs in Coolify dashboard
2. Verify all environment variables are set
3. Ensure DATABASE_URL uses correct internal IP (not localhost)
4. Check health check endpoint is correct
```

#### Issue: SSL Certificate Not Working
**Solution:**
```
1. Verify domain DNS points to server IP
2. Wait 5-10 minutes for DNS propagation
3. In Coolify → Settings → SSL → Force HTTPS
4. Check Let's Encrypt logs for errors
```

### Docker Compose Issues

#### Issue: "Cannot connect to Docker daemon"
**Solution:**
```bash
# Check if Docker is running
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

#### Issue: PostgreSQL connection refused
**Solution:**
```bash
# Check PostgreSQL container
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait 30 seconds for PostgreSQL to initialize
sleep 30
```

#### Issue: Redis connection refused
**Solution:**
```bash
# Check Redis container
docker-compose ps redis

# View logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Cloud Provider Issues

#### AWS: ECS Task Keeps Restarting
**Solution:**
1. Check CloudWatch logs for the task
2. Verify all environment variables are set
3. Ensure task role has required permissions
4. Check health check configuration

#### GCP: Cloud Run 503 Errors
**Solution:**
1. Check Cloud Run service logs
2. Verify container port matches PORT env var
3. Ensure service has enough memory
4. Check if service dependencies are reachable

#### Azure: Container App Restart Loop
**Solution:**
1. Check Log Analytics for error messages
2. Verify image URL is correct
3. Ensure secrets are properly configured
4. Check ingress configuration

---

## ✅ Deployment Verification Checklist

After deployment, verify each component:

- [ ] All containers/services are running
- [ ] Health check endpoints return 200 OK
- [ ] Web app loads at domain URL
- [ ] Admin panel accessible at admin.yourdomain.com
- [ ] Creator portal accessible at creator.yourdomain.com
- [ ] API Gateway accessible at api.yourdomain.com
- [ ] User registration/login works
- [ ] Content upload works (if applicable)
- [ ] Payment integration works (test with small amount)
- [ ] SSL certificate valid (green padlock)
- [ ] Mobile app can connect to API

---

## 📞 Support

For deployment support, please:
1. Check this troubleshooting section
2. Review the existing GitHub issues
3. Create a new issue with:
   - Deployment environment
   - Error messages/logs
   - Steps to reproduce

---

**Last Updated**: May 2026  
**Version**: 1.0.0