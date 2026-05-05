# Azeebo+ Database Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Database Overview

Azeebo+ uses PostgreSQL as the primary database with Redis for caching and OpenSearch for search functionality.

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | PostgreSQL | Transactional data |
| Cache | Redis | Session, rate limiting, caching |
| Search | OpenSearch | Full-text search, analytics |
| Queue | BullMQ/Redis | Background jobs |

---

## Database Schema

### Identity Domain

- `accounts` - User authentication
- `user_profiles` - User details
- `roles` - User roles
- `permissions` - Access permissions
- `sessions` - Active sessions

### Monetization Domain

- `wallets` - User wallets
- `wallet_transactions` - Transaction history
- `payment_intents` - Payment requests
- `payment_transactions` - Completed payments
- `refunds` - Refund records

### Content Domain

- `content_items` - All content
- `media_assets` - Media files
- `categories` - Content categories
- `tags` - Content tags
- `universes` - Universe definitions

### Universe Domains

- `reality_shows`, `reality_seasons`, `reality_episodes`
- `contestants`, `votes`, `supervotes`, `predictions`
- `creator_profiles`, `uploads`, `subscriptions`
- `movies`, `premieres`, `rentals`
- `games`, `challenges`, `tournaments`
- And more per universe

---

## Naming Conventions

### Tables

- Snake_case, plural: `user_profiles`, `wallet_transactions`
- Use descriptive names
- Prefix with domain: `reality_contestants`

### Columns

- Snake_case: `created_at`, `user_id`
- Primary key: `id` (UUID)
- Foreign keys: `{table}_id`
- Timestamps: `created_at`, `updated_at`

### Indexes

- Prefix with `idx_`: `idx_user_email`
- Include table name: `idx_wallet_user_id`

---

## Query Guidelines

### Use Parameterized Queries

```typescript
// ✅ Good
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ Bad
await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Use ORM/Query Builder

- Use TypeORM or Prisma
- Avoid raw SQL unless necessary
- Use query builders for complex queries

---

## Migrations

### Migration Guidelines

- Always use migrations for schema changes
- Include rollback scripts
- Test migrations locally first
- Never modify existing migrations

### Migration Naming

```
YYYYMMDDHHMMSS_add_user_wallet_table.ts
YYYYMMDDHHMMSS_add_universe_column.ts
```

---

## Performance Guidelines

### Indexing

- Index foreign keys
- Index frequently queried columns
- Use composite indexes for multi-column queries
- Avoid over-indexing

### Query Optimization

- Use EXPLAIN ANALYZE
- Avoid SELECT *
- Use pagination
- Limit result sets

### Caching Strategy

- Cache frequently accessed data
- Use Redis for session data
- Implement cache invalidation
- Set appropriate TTLs

---

## Data Security

### Encryption

- Encrypt sensitive fields at application level
- Use TLS for connections
- Enable PostgreSQL SSL

### Access Control

- Use least privilege
- Separate read/write credentials
- Rotate credentials regularly
- Audit query logs

---

## Backup & Recovery

### Backup Strategy

- Daily automated backups
- Point-in-time recovery enabled
- Test restore procedures quarterly

### Retention

- Daily: 30 days
- Weekly: 90 days
- Monthly: 1 year

---

## Prohibited Actions

- No direct database access from frontend
- No raw SQL without review
- No skipping migrations
- No storing credentials in code