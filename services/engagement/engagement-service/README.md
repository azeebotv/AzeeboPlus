# Engagement Service

Azeebo+ Engagement Service - Tracks user engagement, leaderboards, rankings, and prediction results.

## Features

- **Leaderboards**: Time-period and category-based leaderboards (daily, weekly, monthly)
- **Rankings**: User rankings by engagement category
- **Prediction Results**: Tracks and resolves user predictions across universes
- **Engagement Scoring**: Weighted scoring system for user interactions (view, like, comment, share, create)

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3012 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| REDIS_URL | - | Redis connection string |
| ENGAGEMENT_SCORE_WEIGHTS | `{view:1,like:2,comment:3,share:5,create:10}` | Score weights per interaction type |

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

- `GET /v1/engagement/leaderboard` - Get leaderboard entries (query: timePeriod, category, limit)
- `GET /v1/engagement/rankings` - Get rankings by category
- `GET /v1/engagement/predictions/:contentId/results` - Get prediction results for content

## Ownership

- **Team**: Engagement Team
- **Maintainer**: engagement@azeebo.com
- **Last Updated**: 2026-06-17
