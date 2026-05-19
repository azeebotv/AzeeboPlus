# Developer Onboarding Guide

**Version:** 1.0
**Last Updated:** May 15, 2026

---

## Overview

Welcome to the Azeebo+ engineering team! This guide will help you get started with local development, understand our codebase, and follow our development practices.

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x LTS | JavaScript runtime |
| pnpm | 8.x | Package manager |
| Docker | 24.x | Containerization |
| Docker Compose | 2.x | Multi-container orchestration |
| Git | 2.40+ | Version control |
| kubectl | 1.28+ | Kubernetes CLI |
| Helm | 3.13+ | Kubernetes package manager |

### Recommended IDE Setup

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript Hero
  - Prisma
  - Jest Runner

---

## Repository Structure

```
azeebo+/
├── apps/
│   ├── mobile/          # React Native + Expo mobile app
│   └── web/             # Next.js web application
├── packages/
│   ├── ui/              # Shared UI components
│   ├── design-tokens/    # Design tokens (colors, typography)
│   ├── shared-types/     # Shared TypeScript types
│   ├── api-client/       # API client library
│   ├── analytics-sdk/    # Analytics SDK
│   └── ...
├── services/
│   ├── auth-service/     # Authentication & authorization
│   ├── user-service/     # User management
│   ├── content-service/  # Content management
│   ├── payment-service/  # Payment processing
│   ├── wallet-service/   # Wallet & transactions
│   └── ...
├── infra/
│   ├── k8s/             # Kubernetes configurations
│   ├── terraform/        # Infrastructure as code
│   └── scripts/          # Deployment & utility scripts
└── .trae/
    └── rules/            # Engineering standards & runbooks
```

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/azeebo/azeebo-plus.git
cd azeebo-plus
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Install dependencies for a specific service
cd services/auth-service && pnpm install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# For services
cp services/auth-service/.env.example services/auth-service/.env
```

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/azeebo

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
CLOUDINARY_URL=cloudinary://...

# Feature Flags
ENABLE_FEATURE_X=false
```

### 4. Start Infrastructure

```bash
# Start all infrastructure services (PostgreSQL, Redis, etc.)
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 5. Database Setup

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database with test data
pnpm prisma:seed
```

### 6. Start Development Server

```bash
# Start all services in development mode
pnpm dev

# Or start specific services
pnpm --filter @azeebo/auth-service dev
pnpm --filter @azeebo/api-gateway dev
```

### 7. Run Mobile App

```bash
cd apps/mobile

# Start Expo development server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
```

---

## Development Workflow

### Branch Naming Convention

```
<type>/<ticket-id>-<short-description>

Examples:
- feature/APP-123-user-authentication
- bugfix/PAY-456-payment-timeout
- hotfix/SEC-789-sql-injection
- chore/DEV-101-update-dependencies
```

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding/updating tests
- chore: Maintenance tasks

Examples:
feat(auth): add MFA support for admin users

feat(payment): implement wallet funding flow

fix(content): resolve video playback issue on iOS
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/APP-123-my-feature
   ```

2. **Make Changes**
   - Write code
   - Add/update tests
   - Update documentation

3. **Run Checks**
   ```bash
   pnpm lint          # Lint code
   pnpm typecheck     # Type check
   pnpm test          # Run tests
   pnpm test:e2e      # Run E2E tests
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/APP-123-my-feature
   ```

6. **Code Review**
   - Minimum 1 approval required
   - Address review feedback
   - Squash commits if needed

7. **Merge**
   - Squash and merge preferred
   - Delete branch after merge

---

## Testing Guidelines

### Unit Tests

```bash
# Run unit tests for all packages
pnpm test

# Run tests for specific package
pnpm --filter @azeebo/auth-service test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Run with detailed output
pnpm test:integration --verbose
```

### E2E Tests

```bash
# Start infrastructure
docker-compose up -d

# Run E2E tests
pnpm test:e2e

# Run specific E2E test file
pnpm playwright test tests/auth.spec.ts
```

### Test Coverage Requirements

| Type | Minimum Coverage |
|------|-----------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## Debugging

### Backend Services

#### VS Code Debugger Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["exec", "nest", "start"],
      "args": ["--debug", "--watch"],
      "cwd": "${workspaceFolder}/services/auth-service",
      "console": "integratedTerminal"
    }
  ]
}
```

#### View Logs

```bash
# View logs for a service
kubectl logs -f deployment/auth-service -n azeebo

# View logs with labels
kubectl logs -f -l app=auth-service -n azeebo

# Export logs to file
kubectl logs deployment/auth-service -n azeebo > auth-logs.txt
```

### Mobile App

#### React Native Debugger

```bash
# Start with debugging enabled
pnpm start --reset-cache

# Open Chrome DevTools
# Cmd+Opt+J (Mac) or Ctrl+Shift+J (Windows)
```

#### Network Requests

```bash
# Enable Network Inspect in Expo
# Settings > Enable Network Inspect

# View requests in Charles Proxy
# Enable HTTPS proxying for *.azeebo.com
```

### Database Debugging

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# View active connections
SELECT * FROM pg_stat_activity;

# Kill long-running queries
SELECT pg_cancel_backend(pid);

# Explain query
EXPLAIN ANALYZE SELECT * FROM users WHERE id = '123';
```

---

## Common Issues & Solutions

### Database Connection Issues

**Problem:** `ECONNREFUSED` when connecting to database

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection string
psql $DATABASE_URL
```

### Port Conflicts

**Problem:** `EADDRINUSE` error

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Node Module Issues

**Problem:** Unexpected behavior after dependency updates

**Solution:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear cache
pnpm store prune
pnpm cache clean --all
```

### Docker Issues

**Problem:** Container won't start

**Solution:**
```bash
# View container logs
docker-compose logs <service>

# Rebuild container
docker-compose up -d --force-recreate

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Authentication Issues

**Problem:** JWT token validation fails

**Solution:**
1. Verify `JWT_SECRET` matches across services
2. Check token expiration
3. Clear browser cookies and retry
4. Check if clock skew exists between services

### Prisma Issues

**Problem:** Migration errors

**Solution:**
```bash
# Reset migrations (dev only!)
pnpm prisma:migrate reset

# Create new migration
pnpm prisma:migrate dev --name describe_change

# Manually apply migrations
pnpm prisma:migrate deploy
```

---

## Code Quality

### Linting

```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Check types
pnpm typecheck

# Format code
pnpm format
```

### Pre-commit Hooks

We use Husky for pre-commit hooks:

```bash
# Skip hooks (not recommended)
git commit --no-verify -m "message"

# The following checks run on commit:
# - ESLint
# - Prettier
# - TypeScript compilation
# - Unit tests (affected files)
```

---

## Architecture Guidelines

### Service Communication

- **Synchronous:** Use HTTP/REST for request-response
- **Asynchronous:** Use message queue (RabbitMQ) for events
- **Do not** create circular dependencies between services

### API Design

- Version all APIs: `/v1/`, `/v2/`
- Use REST conventions
- Always validate input
- Return appropriate HTTP status codes

### Database Access

- Use Prisma ORM
- Do not write raw SQL unless absolutely necessary
- Always use transactions for multi-table operations
- Implement soft deletes where appropriate

### Security

- Never commit secrets
- Use environment variables
- Validate all user input
- Use parameterized queries
- Implement rate limiting

---

## Getting Help

### Internal Resources

| Resource | Description |
|----------|-------------|
| Engineering Slack | `#engineering`, `#backend`, `#frontend` |
| This Documentation | `.trae/rules/` |
| Service READMEs | Each service directory |
| API Documentation | `api.azeebo.com/docs` |

### External Resources

| Resource | URL |
|----------|-----|
| NestJS Docs | https://docs.nestjs.com |
| React Native | https://reactnative.dev |
| Prisma | https://prisma.io/docs |
| Kubernetes | https://kubernetes.io/docs |

---

## Contribution Guidelines

### Code of Conduct

- Be respectful and inclusive
- Ask questions freely
- Share knowledge
- Help others succeed

### Review Expectations

- Reviews within 24 hours
- Be constructive and specific
- Approve when ready
- Request changes when necessary

### Dependency Updates

```bash
# Check for outdated dependencies
pnpm outdated

# Update minor/patch versions
pnpm update

# Update major versions (requires testing)
pnpm update --interactive
```

### Performance Guidelines

- Monitor bundle size
- Optimize images
- Implement lazy loading
- Use virtual lists for long lists
- Cache appropriately

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-call Engineer | PagerDuty |
| Security Issues | security@azeebo.com |
| Infrastructure | infra-team@azeebo.com |

---

**Last Updated:** May 15, 2026
**Next Review:** August 15, 2026
