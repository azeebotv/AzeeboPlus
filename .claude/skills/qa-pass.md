# Skill: QA Pass

> Run QA checklist on a feature and generate a quality report.

---

## Usage

```
/qa-pass [feature-path-or-name]

Example:
/qa-pass reality-vote-flow
/qa-pass apps/mobile/src/screens/reality
/qa-pass services/universes/reality-service/src/vote
```

## What It Does

1. Reads the feature code
2. Runs the full QA checklist
3. Generates a quality report
4. Creates test cases for missing coverage
5. Identifies edge cases

## QA Checklist

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
- [ ] Event properties are complete

### Code Quality
- [ ] No `any` types
- [ ] No `console.log` (use logger)
- [ ] Error handling with proper HTTP codes
- [ ] Input validation present
- [ ] Auth guard applied

### UX
- [ ] Copy is clear and concise
- [ ] Touch targets >= 44px
- [ ] Loading indicators for async actions
- [ ] Pull-to-refresh where applicable
- [ ] Back navigation works

## Output

```markdown
## QA Report: [Feature]

### Score: X/20 passed

### Passed
- [x] Loading state
- [x] Empty state
...

### Failed (High Priority)
- [ ] No idempotency key on vote endpoint — RISK: double charges
- [ ] Missing failure analytics event — IMPACT: can't track conversion drops

### Failed (Low Priority)
- [ ] Touch target on secondary button is 38px — should be 44px

### Edge Cases to Test
1. Rapid double-tap on Vote button
2. Vote with zero balance
3. Network timeout during payment
4. Background/foreground transition during vote

### Suggested Tests
[Generated test cases for identified gaps]
```
