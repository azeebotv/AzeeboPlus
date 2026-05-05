# Azeebo+ Developer Onboarding Guide

**Version:** 1.0
**Last Updated:** April 24, 2026

---

## Overview

This guide helps new developers get up to speed with the Azeebo+ platform.

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 7+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### First Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/azeebo/azeebo-plus.git
   cd azeebo-plus
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start local development**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations**
   ```bash
   cd services/auth-service
   pnpm prisma:migrate
   ```

6. **Start the service**
   ```bash
   pnpm run start:dev
   ```

---

## Project Structure

```
azeebo-plus/
├── services/          # Backend services (NestJS)
├── modules/           # Universe-specific services
├── apps/              # Frontend applications
├── packages/          # Shared packages
├── infra/             # Infrastructure code
└── .kiro/             # Kiro configuration
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, TypeScript |
| Frontend | React, Next.js, React Native |
| Database | PostgreSQL, Prisma ORM |
| Cache | Redis |
| Container | Docker, Kubernetes |
| IaC | Terraform |

---

## Development Workflow

### Branching Strategy

```
main          # Production-ready code
├── develop   # Integration branch
│   └── feature/*  # Feature branches
│   └── fix/*      # Bug fix branches
```

### Commit Messages

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests
chore: update dependencies
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Create a PR to `develop`
6. Get approval from at least 1 reviewer
7. Merge after CI checks pass

---

## Services Overview

### Backend Services

| Service | Port | Purpose |
|---------|------|---------|
| auth-service | 3001 | Authentication |
| user-service | 3002 | User management |
| wallet-service | 3003 | Wallet & payments |
| payment-service | 3004 | Payment processing |
| content-service | 3005 | Content management |
| notification-service | 3006 | Notifications |

### Universe Services

| Service | Purpose |
|---------|---------|
| reality-service | Reality shows, voting |
| creator-service | Creator features |
| movie-service | Movie catalog |
| games-service | Games & challenges |
| comedy-service | Comedy content |
| sports-service | Sports & predictions |

---

## Environment Variables

### Common Variables

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Service-Specific Variables

Each service has its own `.env.example` file. Copy and customize as needed.

---

## Running Services

### Start All Services

```bash
docker-compose up -d
```

### Start Individual Service

```bash
cd services/auth-service
pnpm run start:dev
```

### Run Tests

```bash
pnpm test
```

### Run Linting

```bash
pnpm lint
```

---

## Database

### Run Migrations

```bash
cd services/auth-service
pnpm prisma:migrate
```

### Open Prisma Studio

```bash
pnpm prisma:studio
```

---

## Debugging

### VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auth Service",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/services/auth-service/src/main.ts",
      "outFiles": ["${workspaceFolder}/services/auth-service/dist/**/*.js"]
    }
  ]
}
```

---

## Common Tasks

### Add a New Environment Variable

1. Add to `.env.example`
2. Update service configuration
3. Update documentation

### Add a New API Endpoint

1. Create DTO in `dto/` folder
2. Add controller method
3. Add service method
4. Update Swagger documentation
5. Add tests

---

## Resources

- [Backend Steering](./backend.md)
- [API Design](./api-design.md)
- [Coding Standards](./coding-standards.md)
- [Security](./security.md)
- [Testing](./testing.md)

---

## Getting Help

- Check the documentation first
- Search existing issues
- Ask in the development channel
- Review code examples in other services
