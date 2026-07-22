# Azeebo+ Payment Service

> Port: 3003 | Database: `azeebo_payment` | Analytics: Yes

Handles payment processing, verification, refunds, and webhook handling for the Azeebo+ platform. Integrates with Paystack and Flutterwave as payment providers.

## API Endpoints

### Payments (/payments)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /payments/initialize | Create a payment intent and return a payment URL | JWT |
| POST | /payments/verify | Verify payment status with the provider | JWT |
| GET | /payments/history | Get payment transaction history for the authenticated user | JWT |
| GET | /payments/:id | Get details of a specific payment | JWT |
| POST | /payments/refund-request | Request a refund for a completed payment | JWT |

### Webhooks (/webhooks)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /webhooks/paystack | Handle Paystack webhook events | Public (signature verified) |
| POST | /webhooks/flutterwave | Handle Flutterwave webhook events | Public (signature verified) |

### Pricing (/pricing)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /pricing/movie | Get movie pricing | JWT |
| GET | /pricing/vote-packages/:type | Get vote packages by type (standard, reality, superVote) | JWT |
| GET | /pricing/subscriptions | Get subscription plans | JWT |
| GET | /pricing/wallet | Get wallet pricing and limits | JWT |
| GET | /pricing/passes | Get content passes pricing | JWT |

### Admin (/admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /admin/stats | Get payment statistics | Admin |
| GET | /admin/payments | List all payments (paginated, filterable by status) | Admin |
| GET | /admin/payments/:paymentId | Get payment details by ID | Admin |
| GET | /admin/payment-intents | List all payment intents (paginated, filterable by status) | Admin |
| GET | /admin/refunds | List all refunds (paginated, filterable by status) | Admin |
| GET | /admin/webhook-events | List webhook events (paginated, filterable by provider) | Admin |

### Health (/health)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /health | Full health check (database, memory, disk, external services) | Public |
| GET | /health/live | Liveness probe | Public |
| GET | /health/ready | Readiness probe | Public |

## Events Tracked

| Event | Trigger | Properties |
|-------|---------|------------|
| `payment_success` | Payment completed successfully | paymentId, amount, currency, provider, paymentMethod |
| `payment_failed` | Payment failed | paymentId, amount, currency, provider, failureReason |
| `refund_completed` | Refund processed | refundId, paymentId, amount, reason |

## Configuration

```bash
PORT=3003
DATABASE_URL="postgresql://azeebo:azeebo_dev_2024@localhost:5432/azeebo_payment?schema=public"
JWT_SECRET="your-jwt-secret"

# Payment Providers
PAYSTACK_SECRET="paystack-secret"
PAYSTACK_WEBHOOK_SECRET="paystack-webhook-secret"
FLUTTERWAVE_SECRET="flutterwave-secret"
FLUTTERWAVE_WEBHOOK_SECRET="flutterwave-webhook-secret"

# Analytics
ANALYTICS_SERVICE_URL="http://localhost:3004"

# Wallet Service
WALLET_SERVICE_URL="http://localhost:3005"
```

## Prisma Models

| Model | Table | Description |
|-------|-------|-------------|
| `Payment` | payments | Completed payment records with provider references |
| `PaymentIntent` | payment_intents | Pending payment intents with idempotency keys |
| `Refund` | refunds | Refund requests linked to payment intents |
| `WebhookEvent` | webhook_events | Processed webhook events for deduplication |
| `WebhookRetry` | webhook_retries | Failed webhook events queued for retry |
| `PaymentMethod` | payment_methods | Tokenized payment methods for user card management |

## Security

- Global `ServiceAuthGuard` on all routes (endpoints opt-out with `@Public()`)
- Webhook signature verification (Paystack HMAC, Flutterwave verif-hash)
- Duplicate webhook detection and replay attack prevention
- Rate limiting on payment initialization, verification, and refund requests
- Admin endpoints protected by `AdminGuard`

**Last Updated:** 2026-07-22
