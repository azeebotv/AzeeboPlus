# Contributing to Azeebo+

Thanks for contributing to Azeebo+. This guide covers the standards and workflows for all contributors.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/azeebotv/azeebo-plus.git
cd azeebo-plus
cp .env.example .env
pnpm install

# Start services
docker compose up -d postgres redis
pnpm run db:migrate
pnpm run seed
pnpm run dev
```

---

## Branch Strategy

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| `main` | Production-ready code | Production (Coolify) |
| `develop` | Integration branch | Staging |
| `feature/*` | New features | — |
| `fix/*` | Bug fixes | — |
| `hotfix/*` | Urgent production fixes | Production |

### Branch Naming

```
feature/REAL-001-reality-vote-flow
fix/REAL-045-vote-count-mismatch
feature/CREATOR-012-upload-drafts
```

---

## Commit Messages

Use conventional commits:

```
feat(reality): add supervote flow with quantity selector
fix(wallet): resolve race condition in concurrent debit
docs(api): update vote endpoint documentation
refactor(content): extract shared media upload logic
test(reality): add vote endpoint unit tests
chore(ci): update deployment workflow
```

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`

---

## Pull Requests

### Before Opening a PR

1. Your code compiles (`pnpm run typecheck` passes)
2. Lint passes (`pnpm run lint`)
3. Tests pass (`pnpm run test`)
4. You've added tests for new functionality
5. PR is under 400 lines (split if larger)

### PR Template

Use the template in `.github/PULL_REQUEST_TEMPLATE.md`. Every PR should include:

- **What** changed and **why**
- Related issue/task number
- Type of change (feature, fix, refactor, docs, test)
- Checklist (tests, types, lint, states, analytics)

### PR Title Format

```
feat(reality): add vote confirmation screen [REAL-001]
fix(wallet): prevent double-spend on rapid taps [WALLET-023]
```

### Review Process

1. Create PR from feature branch → `develop` (or `main` for hotfixes)
2. CI runs lint, type check, and tests automatically
3. At least 1 approval required
4. Address all review comments
5. Squash and merge

---

## Code Standards

### TypeScript

- Strict mode — no `any` types
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutable data
- Export types separately from implementations

```typescript
// Good
interface VoteRequest {
  readonly showId: string;
  readonly contestantId: string;
  readonly quantity: number;
  readonly idempotencyKey: string;
}

// Bad
function vote(data: any) { ... }
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case` | `vote.controller.ts` |
| Classes | `PascalCase` | `VoteService` |
| Functions | `camelCase` | `processVote` |
| Variables | `camelCase` | `voteCount` |
| Constants | `UPPER_SNAKE` | `MAX_VOTE_QUANTITY` |
| DB tables | `snake_case` | `votes`, `user_wallets` |
| API endpoints | `kebab-case` | `/api/v1/reality/vote` |
| Analytics events | `snake_case` | `reality_vote_created` |
| Environment vars | `UPPER_SNAKE` | `DATABASE_URL` |

### Error Handling

```typescript
// Use the shared error classes
import { AppError, NotFoundError, ValidationError } from '@azeebo/error-handling';

throw new NotFoundError('Show not found', 'SHOW_NOT_FOUND');
throw new ValidationError('Invalid vote quantity', 'INVALID_QUANTITY');
```

### Logging

```typescript
// Use the shared logger — never console.log
import { logger } from '@azeebo/logger';

logger.info('Vote processed', { userId, showId, quantity, amount });
logger.error('Vote failed', { userId, error: err.message });
```

---

## Testing

### Unit Tests

- One test file per service/controller
- Test happy path + error cases
- Mock external dependencies

```bash
# Run all tests
pnpm run test

# Run specific service tests
pnpm --filter @azeebo/reality-service run test

# Watch mode
pnpm run test:watch
```

### Test Structure

```typescript
describe('VoteService', () => {
  describe('processVote', () => {
    it('should debit wallet and record vote', async () => { ... });
    it('should reject if insufficient balance', async () => { ... });
    it('should handle concurrent votes atomically', async () => { ... });
    it('should be idempotent for same idempotencyKey', async () => { ... });
  });
});
```

### Coverage Targets

| Area | Target |
|------|--------|
| Wallet/Payment | 90%+ |
| Auth/Security | 90%+ |
| Core Services | 80%+ |
| Universe Services | 70%+ |

---

## Database

### Migrations

```bash
# Create migration
cd services/core/wallet-service
pnpm exec prisma migrate dev --name add_vote_table

# Apply migrations
pnpm run db:migrate

# Reset (dev only)
pnpm run db:reset
```

### Rules

- Every migration must be reversible
- Never modify production data in migrations
- Use `azeebo_` prefix for all table names
- Add indexes for frequently queried columns
- Use UUIDs for primary keys

### Schema Location

Each service owns its own Prisma schema:
```
services/core/wallet-service/prisma/schema.prisma
services/universes/reality-service/prisma/schema.prisma
```

---

## Environment Variables

Never commit secrets. Use `.env.example` as the template.

```bash
# Required for all services
DATABASE_URL=postgresql://azeebo:azeebo_dev@localhost:5432/azeebo_core
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here
INTERNAL_API_KEY=your-internal-key

# Service-specific
PORT=3001
NODE_ENV=development
```

---

## Project Structure

When adding a new feature, follow this decision tree:

1. **Is it shared UI?** → `/packages/ui`
2. **Is it shared types?** → `/packages/shared-types`
3. **Is it shared utility?** → `/packages/utils`
4. **Is it platform-wide (auth, wallet, etc.)?** → `/services/core/<service>`
5. **Is it universe-specific?** → `/services/universes/<universe>`
6. **Is it engagement (notifications, rewards)?** → `/services/engagement/<service>`
7. **Is it client-side?** → `/apps/<app>`

---

## Common Pitfalls

| Don't | Do Instead |
|-------|-----------|
| Duplicate wallet logic in a universe service | Call `wallet-service` via HTTP |
| Hardcode prices | Read from database/config |
| Use `console.log` | Use `@azeebo/logger` |
| Skip loading/error states | Always implement all 4 states |
| Add `any` types | Define proper interfaces |
| Build entire universe in one PR | Break into <400 line PRs |
| Skip tests for payment features | 90%+ coverage required |
| Query another service's database | Use inter-service HTTP calls |

---

## Getting Help

- **Architecture questions:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Service details:** See [SERVICES.md](./SERVICES.md)
- **Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Product specs:** See `doc/` directory
