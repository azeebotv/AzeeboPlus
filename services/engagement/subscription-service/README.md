# Subscription Service

Azeebo+ Subscription Service - Manages subscription plans, user subscriptions, and billing cycles.

## Features

- **Subscription Plans**: Create and manage tiered subscription plans
- **User Subscriptions**: Subscribe, upgrade, downgrade, and cancel subscriptions
- **Billing Cycles**: Track billing periods and renewal dates
- **Grace Period**: Configurable grace period for failed payments
- **Stripe Integration**: Payment processing via Stripe

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3013 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | - | Redis connection string |
| STRIPE_SECRET_KEY | - | Stripe API secret key |
| SUBSCRIPTION_GRACE_PERIOD_DAYS | 7 | Grace period before cancellation |
| DEFAULT_CURRENCY | NGN | Default billing currency |

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

- `GET /v1/subscription/plans` - Get all subscription plans
- `GET /v1/subscription/plans/:id` - Get subscription plan by ID
- `POST /v1/subscription/plans` - Create a new subscription plan (admin)
- `POST /v1/subscription/subscribe` - Subscribe to a plan
- `GET /v1/subscription/current` - Get current user subscription
- `DELETE /v1/subscription/current` - Cancel current subscription
- `POST /v1/subscription/webhook` - Stripe webhook handler

## Ownership

- **Team**: Engagement Team
- **Maintainer**: subscriptions@azeebo.com
- **Last Updated**: 2026-06-17
