# @azeebo/contract-tests

Contract tests for Azeebo+ microservice APIs.

## Purpose

Validates that service APIs conform to their OpenAPI specifications. Run these tests after schema changes to catch breaking API changes before deployment.

## Usage

```bash
# Run all contract tests
pnpm test

# Run specific service contract tests
pnpm test -- --testPathPattern=content-service
```
