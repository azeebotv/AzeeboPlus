# Azeebo+ Event Schema Documentation

## Overview

This document describes the event schemas used for cross-service communication via message queues in the Azeebo+ platform.

## Queue Architecture

The platform uses BullMQ for job processing with the following queues:

| Queue Name | Purpose | Service |
|------------|---------|---------|
| `notifications` | Push and in-app notifications | notification-service |
| `payments` | Payment processing | payment-service |
| `emails` | Email delivery | queue-service |
| `analytics` | Analytics event processing | analytics-service |
| `content-processing` | Content transcoding and processing | content-service |

## Event Schema Format

All events follow a standard envelope:

```json
{
  "id": "evt_unique_id",
  "type": "event.type",
  "timestamp": "2026-05-19T10:00:00Z",
  "version": "1.0",
  "data": {
    // Event-specific payload
  },
  "metadata": {
    "correlationId": "corr_123",
    " causationId": "evt_previous",
    "userId": "user_456"
  }
}
```

## Event Types

### Authentication Events

#### `auth.user.registered`
Fired when a new user completes registration.

```json
{
  "id": "evt_abc123",
  "type": "auth.user.registered",
  "timestamp": "2026-05-19T10:00:00Z",
  "version": "1.0",
  "data": {
    "userId": "user_456",
    "email": "user@example.com",
    "name": "John Doe",
    "source": "email"
  },
  "metadata": {
    "correlationId": "req_xyz",
    "userId": "user_456"
  }
}
```

#### `auth.user.email-verified`
Fired when user verifies their email.

```json
{
  "id": "evt_def456",
  "type": "auth.user.email-verified",
  "timestamp": "2026-05-19T10:05:00Z",
  "version": "1.0",
  "data": {
    "userId": "user_456",
    "verifiedAt": "2026-05-19T10:05:00Z"
  },
  "metadata": {
    "correlationId": "req_xyz",
    "userId": "user_456"
  }
}
```

### Payment Events

#### `payment.initiated`
Fired when a payment is started.

```json
{
  "id": "evt_ghi789",
  "type": "payment.initiated",
  "timestamp": "2026-05-19T10:10:00Z",
  "version": "1.0",
  "data": {
    "transactionId": "txn_123",
    "userId": "user_456",
    "amount": 5000,
    "currency": "NGN",
    "provider": "paystack",
    "status": "pending"
  },
  "metadata": {
    "correlationId": "req_abc",
    "userId": "user_456"
  }
}
```

#### `payment.completed`
Fired when a payment succeeds.

```json
{
  "id": "evt_jkl012",
  "type": "payment.completed",
  "timestamp": "2026-05-19T10:15:00Z",
  "version": "1.0",
  "data": {
    "transactionId": "txn_123",
    "userId": "user_456",
    "amount": 5000,
    "currency": "NGN",
    "provider": "paystack",
    "providerReference": "PS_123456"
  },
  "metadata": {
    "correlationId": "req_abc",
    "userId": "user_456"
  }
}
```

#### `payment.failed`
Fired when a payment fails.

```json
{
  "id": "evt_mno345",
  "type": "payment.failed",
  "timestamp": "2026-05-19T10:15:00Z",
  "version": "1.0",
  "data": {
    "transactionId": "txn_123",
    "userId": "user_456",
    "amount": 5000,
    "currency": "NGN",
    "provider": "paystack",
    "errorCode": "payment_declined",
    "errorMessage": "Card was declined"
  },
  "metadata": {
    "correlationId": "req_abc",
    "userId": "user_456"
  }
}
```

### Wallet Events

#### `wallet.funded`
Fired when wallet is credited.

```json
{
  "id": "evt_pqr678",
  "type": "wallet.funded",
  "timestamp": "2026-05-19T10:20:00Z",
  "version": "1.0",
  "data": {
    "transactionId": "txn_wallet_001",
    "walletId": "wallet_456",
    "userId": "user_456",
    "amount": 5000,
    "currency": "NGN",
    "balanceAfter": 15000,
    "source": "payment"
  },
  "metadata": {
    "correlationId": "req_def",
    "userId": "user_456"
  }
}
```

#### `wallet.withdrawn`
Fired when withdrawal is processed.

```json
{
  "id": "evt_stu901",
  "type": "wallet.withdrawn",
  "timestamp": "2026-05-19T10:25:00Z",
  "version": "1.0",
  "data": {
    "transactionId": "txn_withdraw_001",
    "walletId": "wallet_456",
    "userId": "user_456",
    "amount": 2000,
    "currency": "NGN",
    "balanceAfter": 13000,
    "bankAccount": "****1234"
  },
  "metadata": {
    "correlationId": "req_ghi",
    "userId": "user_456"
  }
}
```

### Content Events

#### `content.published`
Fired when content is published.

```json
{
  "id": "evt_vwx234",
  "type": "content.published",
  "timestamp": "2026-05-19T10:30:00Z",
  "version": "1.0",
  "data": {
    "contentId": "content_789",
    "creatorId": "creator_456",
    "title": "My New Video",
    "type": "video",
    "universe": "sports"
  },
  "metadata": {
    "correlationId": "req_jkl",
    "userId": "creator_456"
  }
}
```

#### `content.viewed`
Fired when content is viewed.

```json
{
  "id": "evt_yza567",
  "type": "content.viewed",
  "timestamp": "2026-05-19T10:35:00Z",
  "version": "1.0",
  "data": {
    "contentId": "content_789",
    "viewerId": "user_456",
    "watchDuration": 120,
    "completionRate": 0.45
  },
  "metadata": {
    "correlationId": "req_mno",
    "userId": "user_456"
  }
}
```

### Notification Events

#### `notification.created`
Fired when a notification is created.

```json
{
  "id": "evt_bcd890",
  "type": "notification.created",
  "timestamp": "2026-05-19T10:40:00Z",
  "version": "1.0",
  "data": {
    "notificationId": "notif_123",
    "userId": "user_456",
    "type": "like",
    "title": "New like",
    "message": "Jane liked your video",
    "data": {
      "contentId": "content_789",
      "actorId": "user_jane"
    }
  },
  "metadata": {
    "correlationId": "req_pqr",
    "userId": "user_456"
  }
}
```

### Rewards Events

#### `rewards.earned`
Fired when user earns points.

```json
{
  "id": "evt_efg123",
  "type": "rewards.earned",
  "timestamp": "2026-05-19T10:45:00Z",
  "version": "1.0",
  "data": {
    "userId": "user_456",
    "points": 100,
    "reason": "content_view",
    "contentId": "content_789",
    "totalBalance": 1500
  },
  "metadata": {
    "correlationId": "req_stu",
    "userId": "user_456"
  }
}
```

#### `rewards.redeemed`
Fired when user redeems rewards.

```json
{
  "id": "evt_hij456",
  "type": "rewards.redeemed",
  "timestamp": "2026-05-19T10:50:00Z",
  "version": "1.0",
  "data": {
    "userId": "user_456",
    "points": 500,
    "rewardId": "reward_789",
    "rewardName": "$5 Airtime",
    "totalBalance": 1000
  },
  "metadata": {
    "correlationId": "req_vwx",
    "userId": "user_456"
  }
}
```

## Retry Configuration

Each queue has specific retry settings:

| Queue | Max Attempts | Backoff Type | Delay |
|-------|--------------|--------------|-------|
| notifications | 3 | exponential | 5000ms |
| payments | 5 | exponential | 10000ms |
| emails | 3 | exponential | 60000ms |
| analytics | 2 | fixed | 30000ms |
| content-processing | 3 | exponential | 5000ms |

## Dead Letter Queue

Failed jobs after all retry attempts are moved to the dead letter queue (`<queue-name>:failed`) for manual inspection and replay.
