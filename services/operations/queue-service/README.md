# Queue Service

Azeebo+ Queue Service - BullMQ-based job queue for asynchronous processing.

## Features

- **Email Queue**: Process email sending asynchronously
- **Push Notification Queue**: Process push notifications asynchronously
- **Payment Queue**: Process payment webhooks asynchronously
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Monitoring**: Track job status and progress

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3015 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | redis://localhost:6379 | Redis URL for BullMQ |
| SENDGRID_API_KEY | - | SendGrid API key |
| TWILIO_ACCOUNT_SID | - | Twilio account SID |
| TWILIO_AUTH_TOKEN | - | Twilio auth token |

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

## Queue Configuration

| Queue | Max Attempts | Backoff Type | Initial Delay |
|-------|--------------|--------------|---------------|
| notifications | 3 | exponential | 5000ms |
| payments | 5 | exponential | 10000ms |
| emails | 3 | exponential | 60000ms |
| analytics | 2 | fixed | 30000ms |
| content-processing | 3 | exponential | 15000ms |

## API Routes

- `GET /v1/health` - Health check endpoint
- `GET /v1/health/ready` - Readiness probe

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: platform@azeeboplus.com
- **Last Updated**: 2026-05-14
