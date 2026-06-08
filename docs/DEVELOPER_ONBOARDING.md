# Developer Onboarding Guide

**Last Updated:** June 2, 2026  
**Version:** 1.0  
**Audience:** New developers joining the Azeebo+ team  

---

## 1. Welcome to Azeebo+!

This guide will help you get up and running with the Azeebo+ codebase quickly. We'll cover everything from initial setup to making your first contribution.

---

## 2. Prerequisites

### 2.1 Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x+ | Runtime environment |
| pnpm | 9.x+ | Package manager |
| Docker | 24.x+ | Containerization |
| PostgreSQL | 15+ | Database |
| Redis | 7.x+ | Cache/Session storage |
| Git | 2.40+ | Version control |

### 2.2 Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code | IDE |
| Postman/Insomnia | API testing |
| pgAdmin/DBeaver | Database management |
| Redis Commander | Redis management |
| k9s | Kubernetes management |

---

## 3. Initial Setup

### 3.1 Clone the Repository

```bash
git clone git@github.com:azeebo/azeebo-plus.git
cd azeebo-plus
```

### 3.2 Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 3.3 Environment Configuration

```bash
# Copy example environment files
cp .env.example .env.local

# Edit environment variables
# At minimum, configure:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
```

### 3.4 Start Infrastructure

```bash
# Start PostgreSQL and Redis via Docker
docker compose up -d postgres redis

# Verify services are running
docker ps
```

### 3.5 Database Setup

```bash
# Run migrations for all services
pnpm run migrate:all

# Seed development data
pnpm run seed:all
```

### 3.6 Start Development Servers

```bash
# Start all services
pnpm run dev

# Or start individual services
pnpm --filter auth-service dev
pnpm --filter content-service dev
pnpm --filter wallet-service dev
```

---

## 4. Project Structure

```
azeebo-plus/
├── apps/                    # Frontend applications
│   ├── mobile/              # React Native + Expo app
│   ├── web/                 # Next.js web app
│   └── admin/               # Admin dashboard
├── services/                # Backend microservices
│   ├── auth-service/        # Authentication & user management
│   ├── content-service/     # Content management
│   ├── wallet-service/      # Wallet & financial operations
│   ├── payment-service/     # Payment processing
│   ├── engagement-service/  # Likes, shares, bookmarks
│   ├── lifestyle-service/   # Challenges, polls, quizzes
│   ├── referral-service/    # Referral program
│   └── messaging-service/   # Messaging & notifications
├── packages/                # Shared packages
│   ├── ui/                  # Shared UI components
│   ├── shared/              # Shared types & utilities
│   └── config/              # Shared configuration
├── infrastructure/          # Infrastructure as code
│   ├── k8s/                 # Kubernetes manifests
│   ├── docker/              # Docker configurations
│   └── monitoring/          # Prometheus/Grafana configs
└── docs/                    # Documentation
```

---

## 5. Architecture Overview

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Mobile  │  │   Web    │  │  Admin   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
              ┌───────▼───────┐
              │  API Gateway  │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
  │   Auth    │ │ Content │ │  Wallet   │
  │  Service  │ │ Service │ │  Service  │
  └───────────┘ └─────────┘ └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
              ┌───────▼───────┐
              │   PostgreSQL  │
              │     Redis     │
              └───────────────┘
```

### 5.2 Service Communication

- **Synchronous:** REST APIs via API Gateway
- **Asynchronous:** Event-driven via message queue (future)
- **Shared State:** Redis for caching and sessions

---

## 6. Development Workflow

### 6.1 Branch Strategy

```
main (production)
  └── staging (pre-production)
        └── feature/* (development)
        └── fix/* (bug fixes)
        └── release/* (release preparation)
```

### 6.2 Creating a Feature Branch

```bash
# Create and checkout feature branch
git checkout -b feature/my-new-feature staging

# Make changes and commit
git add .
git commit -m "feat: add my new feature"

# Push to remote
git push origin feature/my-new-feature
```

### 6.3 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/dependency changes

**Examples:**
```
feat(wallet): add withdrawal endpoint
fix(auth): resolve JWT refresh token rotation
docs(api): update payment webhook documentation
```

### 6.4 Pull Request Process

1. **Create PR** from feature branch to `staging`
2. **Fill PR template** with description, testing notes, screenshots
3. **Request review** from at least 1 team member
4. **Address feedback** and update PR
5. **Merge** after approval and CI passes

---

## 7. Testing

### 7.1 Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm --filter auth-service test

# Run tests in watch mode
pnpm test:watch

# Run integration tests
pnpm test:integration
```

### 7.2 Writing Tests

```typescript
// Unit test example
describe('WalletService', () => {
  it('should return wallet balance', async () => {
    const service = new WalletService(mockPrisma);
    const result = await service.getBalance('user-123');
    expect(result.balance).toBe(1000);
  });
});

// Integration test example
describe('WalletController (e2e)', () => {
  it('GET /wallet should return balance', async () => {
    const response = await request(app)
      .get('/wallet')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.balance).toBeDefined();
  });
});
```

---

## 8. Code Style

### 8.1 TypeScript Configuration

- Strict mode enabled
- No implicit any
- ES2022 target

### 8.2 ESLint Rules

```bash
# Lint all code
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

### 8.3 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userId`, `walletBalance` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Classes | PascalCase | `WalletService`, `ContentController` |
| Interfaces | PascalCase | `UserResponse`, `PaymentDto` |
| Files | kebab-case | `wallet.service.ts`, `content.controller.ts` |
| Folders | kebab-case | `auth-service`, `content-service` |

---

## 9. Database Development

### 9.1 Prisma Workflow

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### 9.2 Writing Queries

```typescript
// Good: Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
  },
  where: { isActive: true },
  take: 10,
});

// Bad: Fetching all fields
const users = await prisma.user.findMany();
```

---

## 10. API Development

### 10.1 Creating a New Endpoint

```typescript
// 1. Create DTO
export class CreateWalletDto {
  @IsNumber()
  initialBalance: number;
}

// 2. Add service method
async createWallet(userId: string, dto: CreateWalletDto) {
  return this.prisma.wallet.create({
    data: {
      userId,
      balance: dto.initialBalance,
    },
  });
}

// 3. Add controller endpoint
@Post()
@UseGuards(AuthGuard('jwt'))
async createWallet(
  @Request() req,
  @Body() dto: CreateWalletDto
) {
  return this.walletService.createWallet(req.user.sub, dto);
}
```

### 10.2 API Documentation

All endpoints must be documented with Swagger:

```typescript
@ApiOperation({ summary: 'Create a new wallet' })
@ApiBody({ type: CreateWalletDto })
@ApiResponse({ status: 201, description: 'Wallet created' })
@ApiResponse({ status: 400, description: 'Invalid input' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
```

### 10.3 Testing APIs

```bash
# View Swagger docs
open http://localhost:3000/api

# Test with curl
curl -X POST http://localhost:3000/wallet \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"initialBalance": 1000}'
```

---

## 11. Debugging

### 11.1 VS Code Debug Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Auth Service",
      "program": "${workspaceFolder}/services/auth-service/src/main.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/services/auth-service/dist/**/*.js"]
    }
  ]
}
```

### 11.2 Common Debugging Commands

```bash
# View service logs
docker logs -f <service-container>

# View Kubernetes logs
kubectl logs -f deployment/<service-name> -n staging

# Check database queries
# Enable Prisma query logging
export DEBUG=prisma:query
```

---

## 12. Deployment

### 12.1 Local Deployment

```bash
# Build all services
pnpm build

# Start with Docker Compose
docker compose up -d
```

### 12.2 Staging Deployment

Push to `staging` branch to trigger automatic deployment:

```bash
git push origin feature/my-feature:staging
```

### 12.3 Production Deployment

Production deployments require:
- PR approval
- All tests passing
- Security scan passed
- Manual trigger via GitHub Actions

---

## 13. Monitoring & Observability

### 13.1 Grafana Dashboards

- **Service Overview:** http://grafana.azeebo.com/d/services
- **Database Metrics:** http://grafana.azeebo.com/d/database
- **Payment Metrics:** http://grafana.azeebo.com/d/payments

### 13.2 Error Tracking

- **Sentry:** http://sentry.azeebo.com
- All errors are automatically captured with stack traces

### 13.3 Log Aggregation

- **Loki:** http://loki.azeebo.com
- Search logs by service, trace ID, or user ID

---

## 14. Security Best Practices

### 14.1 Never Commit Secrets

```bash
# Bad: Hardcoded secret
const API_KEY = 'sk_live_123456';

# Good: Environment variable
const API_KEY = process.env.PAYSTACK_SECRET_KEY;
```

### 14.2 Validate All Inputs

```typescript
// Use DTOs with class-validator
export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

### 14.3 Use Parameterized Queries

```typescript
// Good: Prisma handles parameterization
const user = await prisma.user.findUnique({
  where: { email },
});

// Bad: Raw query with string interpolation
const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = '${email}'`;
```

---

## 15. Common Tasks

### 15.1 Adding a New Service

1. Copy service template: `cp -r services/template-service services/my-service`
2. Update package.json name
3. Update Prisma schema
4. Add to workspace configuration
5. Create Dockerfile
6. Add to docker-compose.yml

### 15.2 Adding a New Environment Variable

1. Add to `.env.example`
2. Add to Kubernetes secrets
3. Update service configuration
4. Document in service README

### 15.3 Adding a New Database Table

1. Update Prisma schema
2. Create migration: `npx prisma migrate dev --name add_table`
3. Generate client: `npx prisma generate`
4. Update service/repository

---

## 16. Getting Help

### 16.1 Resources

- **Documentation:** `/docs` folder
- **API Docs:** Swagger UI at `/api`
- **Database Schema:** Prisma Studio
- **Architecture:** `/docs/DATABASE_SCHEMA.md`

### 16.2 Communication

- **Slack:** #engineering channel
- **Issues:** GitHub Issues
- **Code Review:** GitHub Pull Requests

### 16.3 Escalation

| Issue Type | Contact | Channel |
|------------|---------|---------|
| Technical | Team Lead | #engineering |
| Infrastructure | DevOps | #devops |
| Security | Security Team | #security |
| Product | Product Manager | #product |

---

## 17. First Week Checklist

- [ ] Complete initial setup
- [ ] Run all services locally
- [ ] Make first code change
- [ ] Write and run tests
- [ ] Create first PR
- [ ] Deploy to staging
- [ ] Review architecture documentation
- [ ] Set up monitoring access
- [ ] Join team meetings
- [ ] Schedule 1:1 with team lead

---

## 18. First Month Goals

1. **Understand the codebase** - Review key services and patterns
2. **Make meaningful contributions** - Fix bugs, add small features
3. **Participate in code reviews** - Learn from others' code
4. **Understand deployment process** - Deploy at least one change to production
5. **Build relationships** - Meet team members, understand roles

---

**Document Owner:** Engineering Team  
**Review Frequency:** Quarterly  
**Next Review:** September 2, 2026
