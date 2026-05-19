# Azeebo+ Code Review Guidelines

**Version:** 1.0
**Last Updated:** April 24, 2026

---

## Overview

This document defines code review standards and best practices for the Azeebo+ platform.

---

## Review Checklist

### Code Quality

- [ ] Code follows project conventions and style guide
- [ ] No linting errors (ESLint, Prettier)
- [ ] Type safety maintained (TypeScript strict mode)
- [ ] No hardcoded secrets or credentials
- [ ] No console.log in production code

### Functionality

- [ ] Code implements the intended feature correctly
- [ ] Edge cases are handled
- [ ] Error handling is implemented
- [ ] Input validation is in place

### Security

- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication/authorization checks are in place
- [ ] Sensitive data is not exposed

### Performance

- [ ] No N+1 queries
- [ ] Database queries are optimized
- [ ] No memory leaks
- [ ] Async operations are handled properly

### Testing

- [ ] Unit tests are added/updated
- [ ] Integration tests are added/updated
- [ ] Test coverage is maintained (target: 80%)
- [ ] Critical paths are covered by tests

### Documentation

- [ ] Code is well-commented where necessary
- [ ] API endpoints are documented
- [ ] README files are updated
- [ ] Changelog is updated for breaking changes

---

## Review Process

### 1. Self-Review

Before requesting a review, the author should:

- Run all tests
- Fix linting errors
- Run type checking
- Review their own code

### 2. PR Description

The PR description should include:

- **Summary:** Brief description of changes
- **Context:** Why these changes are needed
- **Changes:** Detailed list of changes
- **Testing:** How changes were tested
- **Screenshots:** UI changes (if applicable)

### 3. Review Timeline

- **Critical:** 1 hour
- **High:** 4 hours
- **Medium:** 24 hours
- **Low:** 48 hours

### 4. Review Feedback

- Be specific and constructive
- Explain the "why" behind suggestions
- Use code examples when possible
- Acknowledge good practices

---

## PR Size Guidelines

- **Small PRs:** < 200 lines (preferred)
- **Medium PRs:** 200-500 lines
- **Large PRs:** > 500 lines (avoid if possible)

**Best Practice:** Break large changes into smaller, focused PRs.

---

## Approval Requirements

- **All PRs:** At least 1 approval
- **Breaking changes:** At least 2 approvals
- **Production deployments:** At least 2 approvals

---

## Merge Requirements

- [ ] All CI checks passing
- [ ] At least 1 approval
- [ ] No unresolved comments
- [ ] Code coverage threshold met
- [ ] No high/critical vulnerabilities

---

## Prohibited Actions

- No merging without approval
- No bypassing CI checks
- No merging with failing tests
- No merging with linting errors
- No merging with unresolved comments

---

## Code Review Etiquette

### Do

- Be respectful and constructive
- Focus on the code, not the person
- Ask questions instead of making demands
- Acknowledge good work
- Be patient with new contributors

### Don't

- Use harsh or dismissive language
- Make personal comments
- Review code when tired or stressed
- Merge without proper review
- Ignore security concerns

---

## Hotfix Process

For critical production issues:

1. Create a branch from `main`
2. Make the fix
3. Get approval from on-call engineer
4. Merge immediately
5. Create a follow-up PR with proper review
6. Document the incident
