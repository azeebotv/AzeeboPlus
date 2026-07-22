# Azeebo+ Content Service

> Port: 3004 | Database: `azeebo_content` | Analytics: Yes

Central content management service for the Azeebo+ platform. Handles content CRUD, media assets, transcoding, access control, moderation, payments (rentals/passes/screenings/locked extras), categories, tags, relationships, comments, and public configuration.

## API Endpoints

### Content (`/content`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/content` | List content with filters | Public |
| GET | `/content/home` | Home feed content | Public |
| GET | `/content/watch` | Watch hub feed | Public |
| GET | `/content/featured` | Featured content | Public |
| GET | `/content/trending` | Trending content | Public |
| GET | `/content/new-releases` | New release content | Public |
| GET | `/content/featured-slides` | Featured slides for hero carousel | Public |
| GET | `/content/popular-region` | Popular content in region | Public |
| GET | `/content/search` | Search content | Public |
| GET | `/content/recommended` | Get recommended content | Auth |
| GET | `/content/accessible` | Get accessible content for user | Auth |
| GET | `/content/passes/access` | Check pass access | Auth |
| GET | `/content/rentals/:contentId/access` | Check rental access | Auth |
| GET | `/content/screenings/:screeningId/access` | Check screening access | Auth |
| GET | `/content/extras/:extraId/access` | Check locked extra access | Auth |
| GET | `/content/categories` | Get all categories | Public |
| GET | `/content/categories/:id/content` | Get content by category | Public |
| GET | `/content/tags` | Get all tags | Public |
| GET | `/content/tags/:id/content` | Get content by tag | Public |
| GET | `/content/universe/:universeId` | Get content by universe | Public |
| GET | `/content/category/:categoryId` | Get content by category (param) | Public |
| GET | `/content/me` | Get current user's content | Auth |
| GET | `/content/creator/:creatorId` | Get creator's content | Public |
| GET | `/content/:id` | Get content by ID | Public |
| GET | `/content/:id/comments` | Get content comments | Public |
| GET | `/content/:id/analytics` | Get content analytics (owner only) | Auth |
| GET | `/content/:id/moderation-status` | Get content moderation status | Public |
| GET | `/content/:id/access-check` | Check if user can access content | Auth |
| GET | `/content/:id/playback-url` | Get media playback URL | Auth |
| GET | `/content/:id/relationships` | Get content relationships | Public |
| GET | `/content/:id/related` | Get related content | Public |
| GET | `/content/:id/media` | Get media asset for content | Auth |
| GET | `/content/:id/media/signed-url` | Get signed URL for media asset | Auth |
| GET | `/content/:id/transcode/:jobId/status` | Get transcoding job status | Auth |
| GET | `/content/:id/transcode/:jobId/url` | Get transcoded media URL | Auth |
| POST | `/content` | Create content | Auth |
| POST | `/content/categories` | Create category | Admin |
| POST | `/content/tags` | Create tag | Admin |
| POST | `/content/:id/comments` | Add comment to content | Auth |
| POST | `/content/:id/media` | Create media asset for content | Auth |
| POST | `/content/:id/media/thumbnail` | Generate thumbnail for media asset | Auth |
| POST | `/content/:id/publish` | Publish content | Auth |
| POST | `/content/:id/unpublish` | Unpublish content | Auth |
| POST | `/content/:id/report` | Report content | Auth |
| POST | `/content/:id/transcode` | Start media transcoding | Auth |
| POST | `/content/:id/scan` | Scan content for safety issues | Auth |
| POST | `/content/:id/categories/:categoryId` | Add category to content | Auth |
| POST | `/content/:id/tags/:tagId` | Add tag to content | Auth |
| POST | `/content/:id/relationships` | Add content relationship | Auth |
| PATCH | `/content/:id` | Update content | Auth |
| PATCH | `/content/:id/media` | Update media asset for content | Auth |
| PATCH | `/content/categories/:id` | Update category | Admin |
| PATCH | `/content/tags/:id` | Update tag | Admin |
| DELETE | `/content/:id` | Delete content (soft) | Auth |
| DELETE | `/content/:id/media` | Delete media asset for content | Auth |
| DELETE | `/content/:id/categories/:categoryId` | Remove category from content | Auth |
| DELETE | `/content/:id/tags/:tagId` | Remove tag from content | Auth |
| DELETE | `/content/:id/relationships/:relatedContentId` | Remove content relationship | Auth |
| DELETE | `/content/categories/:id` | Delete category (soft) | Admin |
| DELETE | `/content/tags/:id` | Delete tag (soft) | Admin |

### Moderation (`/moderation`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/moderation/scan/:contentId` | Scan content for policy violations | Mod/Admin |
| GET | `/moderation/risk/:contentId` | Assess content risk | Mod/Admin |
| GET | `/moderation/scans/:contentId` | Get content scan history | Mod/Admin |
| POST | `/moderation/cases` | Create moderation case | Mod/Admin |
| GET | `/moderation/cases` | Get moderation cases | Mod/Admin |
| GET | `/moderation/cases/:caseId` | Get moderation case by ID | Mod/Admin |
| PATCH | `/moderation/cases/:caseId/assign` | Assign case to moderator | Mod/Admin |
| PATCH | `/moderation/cases/:caseId/resolve` | Resolve moderation case | Mod/Admin |
| POST | `/moderation/actions` | Execute safety action | Mod/Admin |
| GET | `/moderation/actions/case/:caseId` | Get safety actions for case | Mod/Admin |
| POST | `/moderation/appeals` | Submit appeal | Auth |
| PATCH | `/moderation/appeals/:appealId/review` | Review appeal | Admin |
| GET | `/moderation/trust/:userId` | Get user trust score | Auth |
| PATCH | `/moderation/trust/:userId` | Update user trust score | Mod/Admin |
| GET | `/moderation/stats` | Get moderation statistics | Mod/Admin |

### Public (`/public`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/public/universes` | Get enabled universes | Public |
| GET | `/public/settings` | Get all public system settings | Public |
| GET | `/public/settings/:key` | Get a public setting by key | Public |
| GET | `/public/universes/:name/features` | Get feature flags for a universe | Public |

### Health (`/health`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check (DB ping) | Public |
| GET | `/health/live` | Liveness probe | Public |
| GET | `/health/ready` | Readiness probe | Public |

## Events Tracked

| Event | Trigger | Properties |
|-------|---------|------------|
| `content_created` | Content creation | `contentId`, `universeId`, `title`, `type` |
| `content_published` | Content publication | `contentId`, `universeId` |
| `content_reported` | Content report | `contentId`, `reportType`, `reportReason` |

Events are forwarded to the analytics service via HTTP (`ANALYTICS_SERVICE_URL`).

## Configuration

```bash
PORT=3004
DATABASE_URL="postgresql://user:password@localhost:5432/azeebo_content"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
ANALYTICS_SERVICE_URL="http://analytics-service:3040"
```

## Prisma Models (15)

| Model | Table | Purpose |
|-------|-------|---------|
| `Universe` | `universes` | Content universes (reality, creator, lifestyle, etc.) |
| `Category` | `categories` | Content categories |
| `Tag` | `tags` | Content tags |
| `ContentItem` | `content_items` | Core content entities |
| `MediaAsset` | `media_assets` | Media file metadata per content item |
| `ContentRelationship` | `content_relationships` | Links between content (sequel, prequel, related, etc.) |
| `Comment` | `comments` | User comments with reply threading |
| `Rental` | `rentals` | Time-limited content rentals |
| `Pass` | `passes` | Subscription passes (daily/weekly/monthly/yearly per universe) |
| `Screening` | `screenings` | Scheduled live screenings with viewer caps |
| `LockedExtra` | `locked_extras` | Premium extras (behind-the-scenes, deleted scenes, etc.) |
| `UserUnlock` | `user_unlocks` | Tracks what a user has unlocked and when it expires |
| `WatchHistory` | `watch_history` | Per-user viewing progress |
| `UniverseFeatureFlag` | `universe_feature_flags` | Feature flags per universe |
| `SystemSettings` | `system_settings` | Global key-value settings (public/private) |

## Security

- Creator authorization for content management operations
- AdminGuard on category/tag creation, deletion, and admin endpoints
- Moderation controller restricted to `moderator` and `admin` roles
- Rate limiting on all public endpoints
- Access control service gates content, rental, screening, and extra access
- Premium content requires subscription/pass verification before media URL generation

## Testing

```bash
pnpm test
pnpm test:cov
```

**Last Updated:** 2026-07-22
