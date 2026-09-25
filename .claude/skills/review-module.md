# Skill: Review Module

> Audit a module for duplication, gaps, and quality issues.

---

## Usage

```
/review-module [service-or-app-path]

Example:
/review-module services/universes/reality-service
/review-module apps/mobile/src/screens/reality
```

## What It Does

1. Scans the target directory for code patterns
2. Checks for duplicated wallet/payment logic
3. Verifies analytics event coverage
4. Validates error handling (all 4 states)
5. Checks for hardcoded values (prices, colors, URLs)
6. Reviews test coverage
7. Compares against shared packages usage

## Output

### Review Report

```markdown
## Module Review: [path]

### Duplication Issues
- [ ] Found hardcoded price at line X — use wallet-service
- [ ] Found custom auth logic — use auth-service

### Missing States
- [ ] Loading state missing at [file]
- [ ] Error state missing at [file]

### Analytics Gaps
- [ ] No view event on [screen]
- [ ] No failure event on [action]

### Hardcoded Values
- [ ] Price ₦500 at [file:line]
- [ ] Color #FF0000 at [file:line]
- [ ] URL at [file:line]

### Test Coverage
- [ ] No tests for [service/controller]

### Recommendations
1. [Priority recommendation]
2. [Priority recommendation]
```

## Rules

- Be specific — cite file paths and line numbers
- Prioritize by risk (payment > auth > UI > cosmetic)
- Suggest the correct shared package to use
- Flag any security concerns
