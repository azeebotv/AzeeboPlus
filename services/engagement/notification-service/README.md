# Notification Service

Azeebo+ Notification Service - Handles push notifications, email, and SMS notifications.

## Features

- **Push Notifications**: Firebase Cloud Messaging integration
- **Email Notifications**: SendGrid integration
- **SMS Notifications**: Twilio integration
- **Notification Preferences**: User-configurable preferences
- **Multi-Channel Delivery**: Send to multiple channels simultaneously

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3020 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
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

## API Routes

- `POST /v1/notifications/send` - Send notification
- `POST /v1/notifications/push/token` - Save push token
- `PUT /v1/notifications/preferences` - Update notification preferences
- `GET /v1/notifications/preferences` - Get notification preferences

## Ownership

- **Team**: Platform Engineering
- **Maintainer**: platform@azeebo.com
- **Last Updated**: 2026-05-14
