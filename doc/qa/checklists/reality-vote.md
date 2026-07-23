# Reality Vote — QA Checklist

## States
- [ ] Loading state present
- [ ] Empty state (no shows)
- [ ] Error state with retry
- [ ] Success confirmation

## Payment Safety
- [ ] No hardcoded prices
- [ ] Idempotency key used
- [ ] Balance check before debit
- [ ] Transaction recorded in ledger
- [ ] Failure handled gracefully
- [ ] Race condition protected (concurrent votes)
- [ ] Wallet sufficient check

## Analytics
- [ ] reality_show_viewed on page load
- [ ] reality_vote_created on vote submission
- [ ] reality_vote_success on confirmation
- [ ] reality_vote_failure on error

## UX
- [ ] Vote quantity selector works
- [ ] Wallet balance shown
- [ ] Price breakdown clear
- [ ] Confirmation dialog before payment
- [ ] Success feedback visible
- [ ] Error message clear
