# Wallet Deposit — QA Checklist

## States
- [ ] Loading state present
- [ ] Error state with retry
- [ ] Success confirmation with redirect

## Payment Safety
- [ ] Amount validation (min/max)
- [ ] Idempotency key used
- [ ] Paystack/Flutterwave integration works
- [ ] Webhook handling correct
- [ ] Balance updated after payment
- [ ] Transaction recorded

## Analytics
- [ ] wallet_deposit_initiated on start
- [ ] wallet_deposit_completed on success
- [ ] wallet_deposit_failed on error

## UX
- [ ] Quick amount buttons work
- [ ] Custom amount input works
- [ ] Payment method selection
- [ ] Confirmation before payment
- [ ] Success feedback visible
