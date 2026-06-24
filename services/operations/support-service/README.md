# Support Service

Azeebo+ Support Service - Handles customer support workflows including refunds, chargebacks, takedowns, appeals, disputes, and suspensions.

## Features

- **Refund Management**: Process user refund requests
- **Chargeback Handling**: Manage payment chargebacks
- **Content Takedowns**: Handle content removal requests
- **Appeals**: Process appeals for content and user suspensions
- **Disputes**: Manage creator payout disputes
- **Suspensions**: User suspension management

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3020 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| PAYMENT_SERVICE_URL | http://localhost:3003 | Payment service URL |
| WALLET_SERVICE_URL | http://localhost:3002 | Wallet service URL |
| NOTIFICATION_SERVICE_URL | http://localhost:3006 | Notification service URL |
| MODERATION_SERVICE_URL | http://localhost:3006 | Moderation service URL |
| CONTENT_SERVICE_URL | http://localhost:3004 | Content service URL |
| USER_SERVICE_URL | http://localhost:3001 | User service URL |

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm start:dev
```

## API Routes

- `POST /api/support/refunds` - Create refund request
- `POST /api/support/refunds/:id/process` - Process refund
- `POST /api/support/refunds/:id/reject` - Reject refund

- `POST /api/support/chargebacks` - Create chargeback
- `POST /api/support/chargebacks/:id/resolve` - Resolve chargeback

- `POST /api/support/takedowns` - Create takedown request
- `POST /api/support/takedowns/:id/decide` - Decide takedown

- `POST /api/support/appeals` - Create appeal
- `POST /api/support/appeals/:id/decide` - Decide appeal

- `POST /api/support/suspensions` - Create suspension
- `POST /api/support/suspensions/:id/reinstate` - Reinstate user

- `POST /api/support/disputes` - Create dispute
- `POST /api/support/disputes/:id/resolve` - Resolve dispute

## Ownership

- **Team**: Support Engineering
- **Maintainer**: support-engineering@azeeboplus.com
- **Last Updated**: 2026-05-11