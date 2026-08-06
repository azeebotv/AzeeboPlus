# Skill: Refactor Shared

> Find and consolidate duplicated logic into shared packages.

---

## Usage

```
/refactor-shared [scope]

Example:
/refactor-shared services/universes    # Check all universe services
/refactor-shared apps/mobile/src       # Check all mobile screens
/refactor-shared --target wallet       # Find wallet duplication specifically
```

## What It Does

1. Scans the target scope for duplicated patterns
2. Identifies logic that belongs in shared packages
3. Generates a consolidation plan
4. Moves code to the appropriate shared package
5. Updates all imports
6. Runs type check to verify

## Common Duplications to Find

| Pattern | Should Live In |
|---------|---------------|
| Wallet balance check | `wallet-service` |
| Payment processing | `payment-service` |
| Auth token validation | `auth-service` via `AuthGuard` |
| Loading/error states | `/packages/ui` |
| Date formatting | `/packages/utils` |
| API client calls | `/packages/api-client` |
| Analytics tracking | `/packages/analytics-sdk` |
| Validation schemas | `/packages/validation` |
| Error classes | `/packages/error-handling` |
| Logger calls | `/packages/logger` |

## Output

```markdown
## Refactor Report: [scope]

### Duplications Found

| # | Pattern | Files | Target Package |
|---|---------|-------|---------------|
| 1 | Custom wallet check | reality-service, games-service | wallet-service |
| 2 | Date formatter | 5 files | /packages/utils |
| 3 | Loading spinner | 12 screens | /packages/ui |

### Consolidation Plan

1. Move `checkBalance()` from reality-service → wallet-service HTTP call
2. Move `formatDate()` to `/packages/utils/src/date.ts`
3. Reuse `<LoadingSpinner />` from `/packages/ui`

### Files to Modify
- [ ] services/universes/reality-service/src/vote/vote.service.ts
- [ ] services/universes/games-service/src/challenge/challenge.service.ts
- [ ] (and others)

### Risk Assessment
- Low: Moving utility functions
- Medium: Changing service-to-service calls
- High: Modifying payment flows (review carefully)
```

## Rules

- Never refactor payment/wallet logic without explicit approval
- Run type check after refactoring
- Ensure backward compatibility
- Update all imports atomically
- Add tests for moved code
