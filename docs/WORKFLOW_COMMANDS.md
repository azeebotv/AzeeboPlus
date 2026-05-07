# Workflow Commands

Commands for Claude AI to use during development.

## Build Screen

Build a new UI screen/component following project conventions.

```
/build-screen <feature> <path>

Example:
/build-screen creator-profile apps/web/src/app/creators/[id]/page.tsx
```

Requirements:
- Follow Next.js 14 App Router conventions
- Use Tailwind CSS for styling
- Use existing API client from `@azeebo/api-client`
- Handle loading, error, and empty states
- Implement responsive design (mobile-first)
- Add analytics events for user interactions

## Review Module

Review an existing module for quality and standards compliance.

```
/review-module <module-path>

Example:
/review-module services/wallet-service/src/modules/wallet
```

Checks:
- Follows SOLID principles
- No duplicate code
- Proper error handling
- Tests exist
- API response format correct

## Add Analytics

Add analytics tracking to a feature.

```
/add-analytics <feature> <event-names>

Example:
/add-analytics checkout payment_initiated,payment_success,payment_failed
```

Requirements:
- Use AnalyticsEvent type from @azeebo/shared-types
- Include userId, sessionId, platform
- Add universe context for universe-specific features
- Track conversion funnels

## QA Pass

Run QA checks on a feature branch.

```
/qa-pass <branch-name>

Example:
/qa-pass feature/wallet-improvements
```

Checks:
- All CI gates pass
- Unit tests pass
- E2E tests pass
- No console errors
- Responsive on mobile
- Accessibility checks

## Refactor Shared

Move duplicate code to shared package.

```
/refactor-shared <files...>

Example:
/refactor-shared services/a/src/utils.ts services/b/src/utils.ts
```

Requirements:
- Identify common patterns
- Create/generalize shared implementation
- Update imports in source files
- Add tests for shared code
- Update CLAUDE.md if new conventions

## Prepare PR

Prepare a pull request for review.

```
/prepare-pr <branch-name>

Example:
/prepare-pr feature/payment-webhooks
```

Requirements:
- Run all tests locally
- Update CHANGELOG.md
- Ensure commit messages are semantic
- Add reviewers
- Link related issues
- Complete review checklist