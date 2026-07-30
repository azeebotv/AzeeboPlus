# QA Documentation

> Test plans, checklists, regression suites, and quality standards for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Reality Vote Checklist | `doc/qa/checklists/reality-vote.md` | Reality voting flow QA |
| Wallet Deposit Checklist | `doc/qa/checklists/wallet-deposit.md` | Wallet deposit flow QA |
| Accessibility Tests | `apps/web/e2e/accessibility.spec.ts` | WCAG AA compliance |
| Admin E2E Tests | `apps/admin/` (Playwright) | Admin portal smoke tests |
| Creator E2E Tests | `apps/creator/` (Playwright) | Creator portal smoke tests |

---

## Testing Strategy

### Unit Tests (Jest)
- **Coverage target:** 70% branches, 80% functions/lines/statements
- **Location:** `*.spec.ts` files alongside source code
- **Mocking:** Prisma, Redis, external services mocked per test
- **Run:** `pnpm -r test` or `cd services/<name> && pnpm test`

### Integration Tests
- **Database:** Real PostgreSQL + Redis in CI
- **Location:** `*.integration.spec.ts` files
- **Scope:** Service-to-service communication, database operations

### E2E Tests (Playwright)
- **Admin portal:** Login, user management, content moderation, settings
- **Creator portal:** Login, content upload, analytics, earnings
- **Location:** `apps/admin/` and `apps/creator/` test directories

### Load Tests (k6)
- **Script:** `scripts/load-test.js`
- **Config:** `scripts/load-test-config.json`
- **Endpoints tested:** Auth, content, search, wallet, reality voting
- **Thresholds:** <500ms p95 response time, <1% error rate

---

## QA Checklists

### Reality Vote Flow
- Vote casting with sufficient balance
- Vote casting with insufficient balance (error handling)
- Supervote flow with payment
- Leaderboard accuracy after voting
- Prediction submission and resolution

### Wallet Deposit Flow
- Paystack payment initialization
- Flutterwave payment initialization
- Webhook verification
- Balance update after payment
- Transaction ledger accuracy
- Idempotency (duplicate payment handling)

---

## Quality Standards

### Code Review Checklist
- [ ] TypeScript strict mode — no `any`
- [ ] Loading / empty / error / success states present
- [ ] Analytics events added (`view`, `action`, `success`, `failure`)
- [ ] Shared components reused — no duplication
- [ ] No hardcoded prices or secrets
- [ ] Wallet/payment flows use shared services
- [ ] Unit tests included
- [ ] Mobile responsive (if UI change)
- [ ] Error handling with proper HTTP status codes
- [ ] PR size < 400 lines

### Accessibility Standards
- WCAG AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Touch target sizes (44x44px minimum)
- Reduced motion support
