# Azeebo+ Search Service

> Port: 3005 | Database: `azeebo_search` | Analytics: Yes

## API Endpoints

### Search (`/search`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `GET` | `/search` | Public | 30/min | Universal search across all content |
| `GET` | `/search/faceted` | Public | 30/min | Search with faceted filtering |
| `GET` | `/search/suggestions` | Public | 60/min | Get search suggestions |
| `GET` | `/search/trending` | Public | 30/min | Get trending searches |
| `GET` | `/search/facets` | Public | 30/min | Get search facets |
| `POST` | `/search/log` | Bearer | - | Log search query (requires auth) |

**Query Parameters (`GET /search`, `GET /search/faceted`):**
- `q` - Search query (required)
- `universe` - Filter by universe (e.g., `reality`, `comedy`, `sports`)
- `categories` - Comma-separated category filters
- `tags` - Comma-separated tag filters
- `contentType` - Comma-separated content type filters
- `dateStart` / `dateEnd` - Date range filters
- `sort` - Sort order
- `page` - Page number (default: 1)
- `limit` - Results per page (1-100, default: 20)

### Admin (`/admin`)

All admin endpoints require `AdminGuard` authentication.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/stats` | Get search service statistics |
| `GET` | `/admin/queries` | Get paginated search query log |

**Query Parameters (`GET /admin/queries`):**
- `page` - Page number
- `limit` - Results per page
- `startDate` - Filter start date
- `endDate` - Filter end date

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (includes DB status) |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |

## Events Tracked

| Event | Trigger |
|-------|---------|
| `search_performed` | User executes a search |
| `search_suggestion_clicked` | User clicks a suggestion |
| `search_filter_applied` | User applies a filter |
| `search_result_clicked` | User clicks a search result |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | 3005 | Service port |
| `DATABASE_URL` | - | PostgreSQL connection string |

## Prisma Models

| Model | Table | Description |
|-------|-------|-------------|
| `Suggestion` | `suggestions` | Admin-managed autocomplete entries (trending, promoted, category, manual) |
| `RankingRule` | `ranking_rules` | Deterministic ranking rules applied at query time |
| `UserSearch` | `user_searches` | Per-user search history |
| `SearchQueryLog` | `search_query_logs` | Global search query log for analytics |
| `ContentItem` | `content_items` | Searchable content indexed across universes |
| `CreatorProfile` | `creator_profiles` | Creator profiles for search |
| `Universe` | `universes` | Universe definitions |
| `Category` | `categories` | Content categories |
| `Tag` | `tags` | Content tags |
