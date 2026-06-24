# User Service

Azeebo+ User Service - Manages user profiles, preferences, watch history, saved items, follows, and subscriptions.

## Features

- **User Profiles**: Full profile management with personal information
- **User Preferences**: Customizable app preferences and settings
- **Watch History**: Track content viewing history across all universes
- **Saved Items**: Save content for later viewing
- **Following/Followers**: Follow creators and other users
- **Subscriptions**: Manage subscription plans and content access
- **Search History**: Track user search queries

## Service Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| PORT | 3001 | Service port |
| DATABASE_URL | - | PostgreSQL connection string |
| ANALYTICS_SERVICE_URL | http://localhost:3008 | Analytics service URL |
| NOTIFICATION_SERVICE_URL | http://localhost:3006 | Notification service URL |

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

- `GET /v1/users/me` - Get current user profile
- `PUT /v1/users/me` - Update user profile
- `GET /v1/users/me/preferences` - Get user preferences
- `PUT /v1/users/me/preferences` - Update user preferences
- `GET /v1/users/me/history` - Get watch history
- `POST /v1/users/me/history` - Add to watch history
- `GET /v1/users/me/saved` - Get saved items
- `POST /v1/users/me/saved` - Save an item
- `DELETE /v1/users/me/saved/:id` - Remove saved item
- `GET /v1/users/me/following` - Get following list
- `POST /v1/users/me/following/:userId` - Follow a user
- `DELETE /v1/users/me/following/:userId` - Unfollow a user
- `GET /v1/users/me/subscriptions` - Get user subscriptions
- `GET /v1/users/:userId` - Get user profile by ID

## Ownership

- **Team**: User Experience
- **Maintainer**: ux-engineering@azeeboplus.com
- **Last Updated**: 2026-05-11
