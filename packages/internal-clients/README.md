# @azeebo/internal-clients

Typed internal service clients for Azeebo microservices with built-in retries, timeouts, idempotency, and trace headers.

## Installation

```bash
npm install @azeebo/internal-clients
```

## Usage

```typescript
import { createServiceClients, AuthServiceClient, WalletServiceClient } from '@azeebo/internal-clients';

// Create all clients
const clients = createServiceClients();

// Or use individual clients
const authClient = new AuthServiceClient();
const walletClient = new WalletServiceClient();

// Make requests with automatic retries
const user = await clients.user.getUser('user-123');

// Validate tokens
const { userId, roles } = await clients.auth.validateToken(token);

// Debit wallet with idempotency
const result = await clients.wallet.debitWallet(walletId, 1000, 'Purchase', idempotencyKey);
```

## Available Clients

| Client | Base URL | Purpose |
|--------|----------|---------|
| `AuthServiceClient` | AUTH_SERVICE_URL | Token validation, refresh |
| `WalletServiceClient` | WALLET_SERVICE_URL | Wallet operations |
| `PaymentServiceClient` | PAYMENT_SERVICE_URL | Payment processing |
| `AnalyticsServiceClient` | ANALYTICS_SERVICE_URL | Event tracking |
| `NotificationServiceClient` | NOTIFICATION_SERVICE_URL | Notifications |
| `ContentServiceClient` | CONTENT_SERVICE_URL | Content access |
| `UserServiceClient` | USER_SERVICE_URL | User management |

## Features

- **Automatic Retries**: Exponential backoff with configurable max retries
- **Idempotency Keys**: Automatic generation for write operations
- **Configurable Timeouts**: Default 30s, configurable per request
- **Trace Headers**: X-Request-ID propagation for distributed tracing
- **Type Safety**: Full TypeScript support with typed responses

## Configuration

```typescript
const client = new ServiceClient({
  baseURL: 'http://service:3000',
  timeout: 5000,
  retry: {
    maxRetries: 3,
    delay: 1000,
    backoffMultiplier: 2,
  },
});
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_SERVICE_URL` | http://auth-service:3000 | Auth service base URL |
| `WALLET_SERVICE_URL` | http://wallet-service:3002 | Wallet service base URL |
| `PAYMENT_SERVICE_URL` | http://payment-service:3003 | Payment service base URL |
| `ANALYTICS_SERVICE_URL` | http://analytics-service:3008 | Analytics service base URL |
| `NOTIFICATION_SERVICE_URL` | http://notification-service:3006 | Notification service base URL |
| `CONTENT_SERVICE_URL` | http://content-service:3004 | Content service base URL |
| `USER_SERVICE_URL` | http://user-service:3001 | User service base URL |