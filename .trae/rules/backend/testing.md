# Azeebo+ Testing Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Testing Overview

Azeebo+ follows a comprehensive testing strategy with multiple test types to ensure quality and reliability.

---

## Test Types

### Unit Tests

- Test individual functions/methods
- Mock external dependencies
- Fast execution
- High coverage target: 80%

### Integration Tests

- Test service interactions
- Use test databases
- Test API endpoints
- Verify data flow

### E2E Tests

- Test complete user flows
- Use real browser/device
- Critical path coverage
- Smoke tests for releases

---

## Testing Framework

| Type | Tool |
|------|------|
| Unit/Integration | Jest / Vitest |
| E2E | Playwright / Cypress |
| Component | React Testing Library |
| Load | k6 / Artillery |

---

## Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── helpers/
│   ├── integration/
│   │   ├── api/
│   │   └── services/
│   └── e2e/
│       ├── flows/
│       └── critical/
```

---

## Naming Conventions

```
# Unit tests
user.service.test.ts
user.service.spec.ts

# Integration tests
auth.api.test.ts
user.api.spec.ts

# E2E tests
login.flow.spec.ts
payment.flow.spec.ts
```

---

## Test Coverage Requirements

### Critical Paths (100%)

- Authentication
- Payment processing
- Wallet operations
- Authorization checks

### Business Logic (80%)

- Services
- Utilities
- Business rules

### General (70%)

- Components
- Helpers
- Edge cases

---

## Best Practices

### AAA Pattern

```typescript
describe('calculatePoints', () => {
  it('should calculate correct points for win', () => {
    // Arrange
    const gameResult = { outcome: 'win', multiplier: 1 };
    
    // Act
    const points = calculatePoints(gameResult);
    
    // Assert
    expect(points).toBe(100);
  });
});
```

### Test Data

- Use factories/fixtures
- Avoid magic numbers
- Clear, descriptive names
- Reset state between tests

### Assertions

- One expectation per test when possible
- Clear error messages
- Test both positive and negative cases

---

## CI Integration

### Pre-Merge

- All unit tests must pass
- Integration tests must pass
- Coverage threshold met

### Pre-Deploy

- E2E tests must pass
- Smoke tests must pass

---

## Prohibited Actions

- No skipping tests
- No weakening assertions
- No testing implementation details
- No hardcoding test data