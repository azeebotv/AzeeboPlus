# Payment Webhook Integration

This document describes the payment webhook integration with Paystack and Flutterwave.

## Webhook Endpoints

| Provider | Endpoint | Method | Guard |
|----------|----------|--------|-------|
| Paystack | `/webhooks/paystack` | POST | `PaystackWebhookGuard` |
| Flutterwave | `/webhooks/flutterwave` | POST | `FlutterwaveWebhookGuard` |

## Security

### Signature Verification

Both providers use HMAC signature verification to ensure webhook authenticity:

**Paystack:**
- Header: `x-paystack-signature`
- Algorithm: HMAC-SHA512
- Secret: `PAYSTACK_WEBHOOK_SECRET` environment variable

**Flutterwave:**
- Header: `verif-hash`
- Algorithm: HMAC-SHA256
- Secret: `FLUTTERWAVE_WEBHOOK_SECRET` environment variable

### Replay Protection

- Events are tracked by `eventId` to prevent duplicate processing
- Events older than 5 minutes are rejected (timestamp validation)
- Processed events are stored in the `WebhookEvent` table

## Event Types

### Paystack

| Event | Description | Action |
|-------|-------------|--------|
| `charge.success` | Payment completed successfully | Update payment status to COMPLETED |
| `charge.failed` | Payment failed | Update payment status to FAILED |
| `refund` | Refund processed | Update payment status to REFUNDED |

### Flutterwave

| Event | Description | Action |
|-------|-------------|--------|
| `charge.completed` | Payment completed successfully | Update payment status to COMPLETED |
| `charge.failed` | Payment failed | Update payment status to FAILED |
| `refund` | Refund processed | Update payment status to REFUNDED |

## Payload Structure

### Paystack Webhook Payload

```json
{
  "id": "evt_123456789",
  "type": "charge.success",
  "data": {
    "id": 123456789,
    "status": "success",
    "reference": "paystack_ref_123",
    "amount": 50000,
    "currency": "NGN",
    "customer": {
      "email": "customer@example.com",
      "id": "cus_123"
    },
    "metadata": {
      "paymentId": "pay_123"
    }
  }
}
```

### Flutterwave Webhook Payload

```json
{
  "id": "evt_987654321",
  "type": "charge.completed",
  "data": {
    "id": 987654321,
    "status": "successful",
    "txRef": "flutterwave_ref_456",
    "flutterwaveRef": "FLW123456",
    "amount": 50000,
    "currency": "NGN",
    "customer": {
      "email": "customer@example.com",
      "id": "cus_456"
    },
    "metadata": {
      "paymentId": "pay_456"
    }
  }
}
```

## Provider Reference Mapping

| Provider | Webhook Field | Database Field |
|----------|---------------|----------------|
| Paystack | `data.reference` | `providerRef` |
| Paystack | `data.id` | `providerReference` |
| Flutterwave | `data.txRef` | `providerRef` |
| Flutterwave | `data.flutterwaveRef` | `providerReference` |

## Wallet Crediting

**Note:** Wallet crediting is handled separately from webhook processing. The webhook service updates the payment status, and a separate wallet service call is required to credit the user's wallet.

Flow:
1. Webhook received → Payment status updated to COMPLETED
2. Wallet service polls/fetches completed payments
3. Wallet service credits user wallet
4. Wallet transaction recorded

## Error Handling

- Invalid signatures: Return 401 Unauthorized
- Duplicate events: Log and return 200 OK (idempotent)
- Processing errors: Log error, store failure reason, return 500
- Missing payment references: Log warning, return 200 OK

## Testing Webhooks Locally

Use ngrok to expose local endpoints:

```bash
ngrok http 3003
```

Configure the webhook URL in your Paystack/Flutterwave dashboard:
- Paystack: `https://your-ngrok-url.ngrok.io/webhooks/paystack`
- Flutterwave: `https://your-ngrok-url.ngrok.io/webhooks/flutterwave`

## Environment Variables

```bash
# Paystack
PAYSTACK_WEBHOOK_SECRET=whsec_your_secret_here

# Flutterwave
FLUTTERWAVE_WEBHOOK_SECRET=your_secret_here
```

## Database Schema

```prisma
model WebhookEvent {
  id            String    @id @default(cuid())
  eventId       String    @unique
  provider      String
  type          String
  payload       Json
  result        String    @default("success") // success, failed
  failureReason String?
  processedAt   DateTime  @default(now())
  createdAt     DateTime  @default(now())

  @@map("webhook_events")
  @@index([eventId])
  @@index([type])
  @@index([provider])
  @@index([result])
}
```

## Verification Checklist

- [x] Signature verification using HMAC
- [x] Timestamp validation (5-minute window)
- [x] Duplicate event detection (eventId tracking)
- [x] Provider reference extraction
- [x] Payment/PaymentIntent status updates
- [x] Error logging and failure tracking
- [x] Constant-time signature comparison (timing attack prevention)
