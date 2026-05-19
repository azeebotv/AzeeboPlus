# Recommendation Service

Azeebo+ Recommendation Service - Provides personalized recommendations using user behavior and analytics data.

## Features

- **Personalized Content**: Recommendations based on user preferences and behavior
- **Trending Content**: Curates trending content across all universes
- **Similar Items**: Recommends similar content based on what's being viewed
- **Collaborative Filtering**: Uses user interaction patterns for suggestions

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3009 | Service port |
| ANALYTICS_SERVICE_URL | http://localhost:3008 | Analytics service URL |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start:dev
```

## API Routes

- `GET /v1/recommendations/personalized` - Get personalized recommendations
- `GET /v1/recommendations/trending` - Get trending content
- `GET /v1/recommendations/similar/:contentId` - Get similar content
- `POST /v1/recommendations/feedback` - Submit feedback on recommendations

## Ownership

- **Team**: Data Science
- **Maintainer**: data-science@azeebo.com
- **Last Updated**: 2026-05-11
