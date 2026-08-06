# Skill: Test Service

> Run tests for a specific service or the entire platform.

---

## Usage

```
/test-service [service] [--type]

Examples:
/test-service reality-service
/test-service wallet-service --type unit
/test-service wallet-service --type integration
/test-service --all
/test-service --coverage
```

## What It Does

1. Runs unit tests for the service
2. Runs integration tests if specified
3. Generates coverage report
4. Identifies failing tests

## Test Types

| Type | Command | Description |
|------|---------|-------------|
| Unit | `pnpm test` | Fast, isolated tests |
| Integration | `pnpm test:integration` | Tests with real DB |
| E2E | `pnpm test:e2e` | Full API tests |
| Contract | `pnpm contracts` | API contract tests |

## Manual Commands

```bash
# Run all tests in a service
cd services/[category]/[service-name]
pnpm test

# Run specific test file
pnpm test -- --testPathPattern=wallet.service

# Run with coverage
pnpm test -- --coverage

# Run integration tests
pnpm test:integration

# Run all platform tests
pnpm -r test
```

## Test File Patterns

```
src/modules/[module]/
├── [module].service.spec.ts      # Unit tests
├── [module].integration.spec.ts  # Integration tests
├── [module].e2e.spec.ts          # E2E tests
└── [module].contract.spec.ts     # Contract tests
```

## Rules

- Every service method must have a unit test
- Payment/wallet features must have integration tests
- Keep tests fast (< 100ms per unit test)
- Use mocks for external dependencies
- Test all 4 states (loading, empty, error, success)
