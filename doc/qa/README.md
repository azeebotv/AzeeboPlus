# QA Documentation

> Test plans, checklists, regression suites, and quality standards for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Contributing (Testing) | `doc/CONTRIBUTING.md` (§Testing) | Test standards and coverage targets |
| Security Audit | `doc/AUDITNOTES.md` | Security findings and verification |
| Deployment Checklist | `doc/DEPLOYMENT-CHECKLIST.md` | Post-deploy verification steps |
| Remaining Tasks | `doc/remaining-tasks.md` | Testing tasks (Phase 6) |

## QA Checklist (Every Feature)

### States
- [ ] Loading state present
- [ ] Empty state present
- [ ] Error state with retry
- [ ] Success state with feedback

### Payment Safety
- [ ] No hardcoded prices
- [ ] Idempotency key used
- [ ] Balance check before debit
- [ ] Transaction recorded in ledger
- [ ] Failure handled gracefully
- [ ] Race condition protected

### Analytics
- [ ] View event on screen mount
- [ ] Action event on user interaction
- [ ] Success event on completion
- [ ] Failure event on error

### Code Quality
- [ ] No `any` types
- [ ] No `console.log`
- [ ] Error handling present
- [ ] Input validation present
- [ ] Auth guard applied

### UX
- [ ] Copy is clear
- [ ] Touch targets >= 44px
- [ ] Loading indicators for async
- [ ] Back navigation works

## Severity Levels

| Level | Description | SLA |
|-------|------------|-----|
| **P0** | Payment failure, data loss, security | Fix immediately |
| **P1** | Core feature broken, no workaround | Fix within 24h |
| **P2** | Feature degraded, workaround exists | Fix within 1 week |
| **P3** | Minor UX issue, cosmetic | Fix in next sprint |

## Coverage Targets

| Area | Target |
|------|--------|
| Wallet/Payment | 90%+ |
| Auth/Security | 90%+ |
| Core Services | 80%+ |
| Universe Services | 70%+ |
