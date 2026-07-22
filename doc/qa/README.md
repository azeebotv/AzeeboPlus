# QA Documentation

> Test plans, checklists, regression suites, and quality standards for Azeebo+.

---

## Structure

```
docs/qa/
├── README.md              # This file
├── checklists/            # Per-feature QA checklists
│   ├── reality-vote.md
│   ├── creator-upload.md
│   ├── wallet-deposit.md
│   └── [feature].md
├── regression/            # Regression test suites
│   ├── smoke-tests.md     # Core path smoke tests
│   ├── payment.md         # Payment regression
│   └── auth.md            # Auth regression
├── edge-cases/            # Edge case catalogs
│   ├── payments.md
│   ├── concurrency.md
│   └── offline.md
└── test-plans/            # Feature test plans
    ├── [feature].md
```

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

## Using Skills for QA

Use the QA-related Claude skills:

```
/qa-pass [feature]     # Run full QA checklist
/review-module [path]  # Audit module for issues
```

## Severity Levels

| Level | Description | SLA |
|-------|------------|-----|
| **P0** | Payment failure, data loss, security | Fix immediately |
| **P1** | Core feature broken, no workaround | Fix within 24h |
| **P2** | Feature degraded, workaround exists | Fix within 1 week |
| **P3** | Minor UX issue, cosmetic | Fix in next sprint |
