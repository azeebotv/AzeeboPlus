# Azeebo+ User Service

> Port: 3001 | Database: `azeebo_user` | Analytics: Yes

Manages user profiles, preferences, watch history, saved items, follows, subscriptions, and GDPR data deletion requests. Connects to the analytics service for event tracking and caches hot paths via Redis.

## API Endpoints

### Users (/users)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/me` | Get current user profile | Bearer |
| PATCH | `/users/me` | Update current user profile | Bearer |
| POST | `/users/me/complete-profile` | Complete profile setup after registration | Bearer |
| GET | `/users/me/preferences` | Get user preferences | Bearer |
| PUT | `/users/me/preferences` | Update user preferences | Bearer |
| GET | `/users/me/history` | Get watch history (paginated) | Bearer |
| GET | `/users/me/saved` | Get saved items (paginated) | Bearer |
| POST | `/users/me/saved` | Save an item | Bearer |
| DELETE | `/users/me/saved/:contentId` | Unsave an item | Bearer |
| GET | `/users/me/universe-affinity` | Get universe affinity scores | Bearer |
| PATCH | `/users/me/universe-affinity` | Update universe affinity | Bearer |
| GET | `/users/me/privacy-settings` | Get privacy settings | Bearer |
| PUT | `/users/me/privacy-settings` | Update privacy settings | Bearer |
| GET | `/users/me/continue-watching` | Get continue watching list | Bearer |
| GET | `/users/me/universes` | Get universe engagement list | Bearer |
| GET | `/users/:id` | Get user by ID | Public |
| POST | `/users/:id/follow` | Follow a user | Bearer |
| DELETE | `/users/:id/follow` | Unfollow a user | Bearer |
| GET | `/users/:id/followers` | Get user followers (paginated) | Public |
| GET | `/users/:id/following` | Get users being followed (paginated) | Public |

### Interactions (/interactions)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/interactions/watchlist` | Get user watchlist | Bearer |
| DELETE | `/interactions/watchlist/:contentId` | Remove from watchlist | Bearer |
| GET | `/interactions/history` | Get watch history | Bearer |
| DELETE | `/interactions/history/:contentId` | Remove from watch history | Bearer |
| GET | `/interactions/favorites` | Get user favorites | Bearer |
| POST | `/interactions/favorites` | Add to favorites | Bearer |
| DELETE | `/interactions/favorites/:contentId` | Remove from favorites | Bearer |

### Privacy (/privacy)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/privacy/deletion-request` | Request GDPR data deletion | Bearer |
| DELETE | `/privacy/data/:userId` | Execute data deletion (self or admin) | Bearer |
| GET | `/privacy/data/:userId/export` | Export all user data (self or admin) | Bearer |
| GET | `/privacy/deletion-status/:userId` | Check deletion request status | Bearer |

### Admin (/admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Get user service statistics | Admin |
| GET | `/admin/analytics` | Get admin analytics | Admin |
| GET | `/admin/audit-logs` | Get audit logs (paginated) | Admin |
| GET | `/admin/users/:id` | Get user by ID | Admin |
| PATCH | `/admin/users/:id` | Update user | Admin |
| POST | `/admin/users/:id/suspend` | Suspend user | Admin |
| GET | `/admin/subscriptions` | Get all subscriptions (paginated, filterable by status) | Admin |
| GET | `/admin/subscriptions/:subscriptionId` | Get subscription by ID | Admin |
| PUT | `/admin/subscriptions/:subscriptionId` | Update subscription | Admin |
| DELETE | `/admin/subscriptions/:subscriptionId` | Delete subscription | Admin |
| GET | `/admin/preferences/:userId` | Get user preferences | Admin |
| PUT | `/admin/preferences/:userId` | Update user preferences | Admin |
| DELETE | `/admin/watch-history/:userId` | Delete user watch history | Admin |
| DELETE | `/admin/saved-items/:userId` | Delete user saved items | Admin |
| PATCH | `/admin/content/:id/moderate` | Moderate content | Admin |
| GET | `/admin/moderation/reports` | Get moderation reports (paginated) | Admin |
| PATCH | `/admin/moderation/reports/:id` | Resolve moderation report | Admin |
| GET | `/admin/creators/verification` | Get creator verification requests | Admin |
| PATCH | `/admin/creators/:id/verify` | Approve/reject creator verification | Admin |

### Health (/health)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check (includes DB probe) | Public |
| GET | `/health/live` | Liveness probe | Public |
| GET | `/health/readiness` | Readiness probe (includes DB probe) | Public |

## Events Tracked

| Event | Trigger | Properties |
|-------|---------|------------|
| `user_saved_content` | User saves content | `contentId` |
| `user_profile_updated` | User updates profile | profile fields |
| `user_followed` | User follows another user | `targetUserId` |
| `user_unfollowed` | User unfollows another user | `targetUserId` |
| `user_profile_completed` | User completes profile setup | profile fields |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Service port |
| `DATABASE_URL` | - | PostgreSQL connection string (`azeebo_user` database) |
| `ANALYTICS_SERVICE_URL` | `http://analytics-service:3040` | Analytics service URL |
| `REDIS_URL` | - | Redis connection string for caching |

## Prisma Models

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | Core user record (id, email, displayName, role) |
| `UserProfile` | `user_profiles` | Extended profile (bio, location, isPublic) |
| `UserRole` | `user_roles` | Role grants (userId, role, grantedBy) |
| `UserPreferences` | `user_preferences` | App settings (darkMode, notifications, contentPreferences, privacySettings) |
| `WatchHistory` | `watch_history` | Content viewing history |
| `SavedItem` | `saved_items` | Bookmarked content |
| `Following` | `following` | User follow relationships |
| `Subscription` | `subscriptions` | Subscription plans (basic/standard/premium) |
| `UserUniverseAffinity` | `user_universe_affinity` | Per-universe engagement scores |
| `AuditLog` | `audit_logs` | Admin action audit trail |
| `DataDeletionRequest` | `data_deletion_requests` | GDPR deletion requests |

## Ownership

- **Team**: User Experience
- **Maintainer**: ux-engineering@azeeboplus.com
