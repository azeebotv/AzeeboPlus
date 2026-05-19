# Lifestyle Service

Azeebo+ Lifestyle Service - Universe for lifestyle content including stories, events, social features, city guides, music, and more.

## Features

- **Stories**: Short-form content and news
- **Events**: Local and global events discovery
- **Social Features**: Follow, share, comment on lifestyle content
- **City Guides**: Discover places to eat, shop, and explore
- **Music**: Music content and recommendations
- **Celebrity**: Celebrity news and profiles
- **Nightlife**: Discover nightlife spots
- **Influencers**: Creator profiles and content
- **Feed**: Personalized lifestyle feed

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3016 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| MEDIA_SERVICE_URL | http://localhost:3019 | Media service URL |

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

- `GET /v1/lifestyle/stories` - Get stories
- `GET /v1/lifestyle/events` - Get events
- `GET /v1/lifestyle/city-guide` - Get city guide content
- `GET /v1/lifestyle/feed` - Get lifestyle feed
- `GET /v1/lifestyle/celebrities` - Get celebrity profiles
- `GET /v1/lifestyle/influencers` - Get influencer profiles

## Ownership

- **Team**: Lifestyle Universe
- **Maintainer**: lifestyle-engineering@azeebo.com
- **Last Updated**: 2026-05-11
