# Moderation Service

Azeebo+ Moderation Service - Handles content moderation and flagging workflows.

## Features

- **Content Moderation**: Review and moderate flagged content
- **Automated Filters**: Rule-based content filtering
- **Moderation History**: Audit trail for moderation actions
- **Escalation Workflows**: Route serious issues to human reviewers

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3021 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |

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

- `POST /v1/moderation/flag` - Flag content for review
- `GET /v1/moderation/queue` - Get moderation queue
- `POST /v1/moderation/:id/approve` - Approve content
- `POST /v1/moderation/:id/reject` - Reject content
- `GET /v1/moderation/history` - Get moderation history

## Ownership

- **Team**: Trust & Safety
- **Maintainer**: trust-safety@azeeboplus.com
- **Last Updated**: 2026-05-14
