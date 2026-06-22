# Contributing to Azeebo+

> **Last Updated**: 2026-06-17
> **Version**: 1.0.0

Thank you for contributing to Azeebo+! This document outlines the process and guidelines for contributing to the platform.

## Code of Conduct

Be respectful, inclusive, and professional. We follow our internal code of conduct in all interactions.

## Getting Started

1. Read [CLAUDE.md](./CLAUDE.md) — our engineering rules
2. Read [Developer Onboarding](./docs/DEVELOPER-ONBOARDING.md) — setup guide
3. Check existing issues or create one for your contribution

## Development Workflow

### 1. Branch Naming
```bash
feature/<feature-name>     # New features
fix/<bug-description>      # Bug fixes
docs/<doc-name>            # Documentation
refactor/<area>            # Refactoring
test/<area>                # Test improvements
```

### 2. Implementation
- Follow all rules in [CLAUDE.md](./CLAUDE.md)
- Use TypeScript strict mode
- Write tests for all new code
- Ensure all required UI states are implemented
- Follow the analytics event naming convention

### 3. Quality Checks
Before submitting a PR, ensure all checks pass:
```bash
pnpm lint          # Linting
pnpm typecheck     # Type checking
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm build         # Build
```

### 4. Commit Messages
Use conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(auth): add biometric authentication

- Add fingerprint and face ID support
- Integrate with auth-service
- Add tests for all scenarios
```

### 5. Pull Request Process

1. **Create PR** with a clear title and description
2. **Complete the PR template**:
   - Summary of changes
   - Related issue
   - Testing instructions
   - Screenshots (if applicable)
3. **Complete the code review checklist** (see below)
4. **Request review** from 2+ engineers
5. **Address feedback** promptly
6. **Ensure CI passes** before merging
7. **Squash and merge** to main

## Code Review Checklist

Before requesting review, verify:

### Architecture
- [ ] Follows modular monorepo structure
- [ ] No duplicate core service logic
- [ ] Uses shared packages appropriately
- [ ] Service placed in correct category

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] Explicit interfaces for object shapes
- [ ] JSDoc for public APIs
- [ ] No linting errors

### Frontend
- [ ] All required UI states (loading, empty, error, success, unauthenticated, locked)
- [ ] Shared components reused from `/packages/ui`
- [ ] Mobile-first design
- [ ] Touch targets ≥ 44x44px
- [ ] Accessibility (ARIA, keyboard nav, screen reader)
- [ ] WCAG AA color contrast

### Backend
- [ ] Proper error handling
- [ ] Structured error responses
- [ ] Input validation with DTOs
- [ ] Pagination on list endpoints
- [ ] Rate limiting on public endpoints
- [ ] Database indexing
- [ ] Caching where appropriate

### Security
- [ ] Authentication checks
- [ ] Authorization checks
- [ ] No sensitive data in logs
- [ ] Input sanitization
- [ ] Secrets in environment variables

### Testing
- [ ] Unit tests for all new code
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical journeys
- [ ] Error paths tested
- [ ] Coverage > 80%

### Analytics
- [ ] Events use snake_case
- [ ] Events have universe prefix
- [ ] Required events tracked (view, submit, success, failure)
- [ ] User context included

### Performance
- [ ] No unnecessary database queries
- [ ] Pagination implemented
- [ ] Caching used where appropriate
- [ ] Lazy loading implemented
- [ ] Bundle size considered

## Testing Requirements

- **Unit tests**: All service methods, utility functions, components
- **Integration tests**: All API endpoints
- **E2E tests**: Critical user journeys
- **Coverage**: > 80% (90%+ for critical services)

See [Testing Strategy](./docs/TESTING-STRATEGY.md) for details.

## Reporting Issues

### Bug Reports
Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, device)
- Screenshots/logs

### Feature Requests
Include:
- Problem statement
- Proposed solution
- Alternatives considered
- Additional context

## Questions

1. Check the documentation
2. Search existing issues
3. Ask in the engineering Slack channel
4. Contact the Engineering Lead

## License

By contributing, you agree that your contributions will be licensed under the proprietary VMNL Entertainment license.
