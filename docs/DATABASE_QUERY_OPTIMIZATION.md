# Database Query Optimization Guide

## Overview

This guide covers database query optimization patterns for all Azeebo+ services using Prisma ORM.

## Query Optimization Patterns

### 1. Always Specify Select Clause

**Inefficient:**
```typescript
const users = await this.prisma.user.findMany();
```

**Optimized:**
```typescript
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    displayName: true,
    role: true,
  },
});
```

**Why:** Prevents fetching unnecessary columns and reduces data transfer.

### 2. Always Add Pagination with `take` and `skip`

**Inefficient:**
```typescript
const allContent = await this.prisma.content.findMany();
```

**Optimized:**
```typescript
const content = await this.prisma.content.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});
```

**Why:** Prevents loading unbounded data into memory, which can cause OOM errors.

### 3. Use `where` Clause for Filtering

**Inefficient:**
```typescript
const allUsers = await this.prisma.user.findMany();
const activeUsers = allUsers.filter(u => u.status === 'active');
```

**Optimized:**
```typescript
const activeUsers = await this.prisma.user.findMany({
  where: { status: 'active' },
});
```

**Why:** Filters at the database level, reducing data transfer.

### 4. Use `include` Only When Needed

**Inefficient:**
```typescript
const content = await this.prisma.content.findMany({
  include: { author: true, comments: true, tags: true },
});
```

**Optimized:**
```typescript
const content = await this.prisma.content.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true,
  },
});

// Only fetch author when displaying
const contentWithAuthor = await this.prisma.content.findMany({
  select: { id: true, title: true },
  include: { author: { select: { id: true, name: true } } },
});
```

### 5. Avoid N+1 Queries

**Inefficient (N+1):**
```typescript
const posts = await this.prisma.post.findMany();
for (const post of posts) {
  post.author = await this.prisma.user.findUnique({ where: { id: post.authorId } });
}
```

**Optimized:**
```typescript
const posts = await this.prisma.post.findMany({
  include: { author: { select: { id: true, name: true } } },
});
```

### 6. Use `count` Instead of `findMany` for Counting

**Inefficient:**
```typescript
const users = await this.prisma.user.findMany({ where: { status: 'active' } });
const count = users.length;
```

**Optimized:**
```typescript
const count = await this.prisma.user.count({ where: { status: 'active' } });
```

### 7. Use Cursor-Based Pagination for Large Datasets

**Inefficient (Offset-based):**
```typescript
const users = await this.prisma.user.findMany({
  take: 10,
  skip: 1000, // Gets slower with larger offsets
});
```

**Optimized (Cursor-based):**
```typescript
const users = await this.prisma.user.findMany({
  take: 10,
  skip: 0,
  cursor: { id: lastSeenId },
  orderBy: { id: 'asc' },
});
```

### 8. Index Hints - Use Explaining

Always check query performance using `explain`:

```typescript
const result = await this.prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${email}
`;
```

Or use Prisma's `explain` for debugging:
```typescript
const users = await this.prisma.user.findMany({
  where: { role: 'user' },
});

// Check if index is used
console.log(await this.prisma.user.findMany({ where: { email: 'test@example.com' } }).explain());
```

## Common Query Templates

### Paginated List with Filters

```typescript
async findAll(dto: FindAllDto) {
  const { page = 1, limit = 20, status, search } = dto;

  const where: Prisma.UserWhereInput = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      select: { id: true, email: true, displayName: true, status: true },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

### One-to-One Relation Lookup

```typescript
const userWithWallet = await this.prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    wallet: {
      select: { id: true, balance: true },
    },
  },
});
```

### One-to-Many with Limit

```typescript
const recentComments = await this.prisma.comment.findMany({
  where: { contentId },
  select: { id: true, text: true, createdAt: true },
  take: 10,
  orderBy: { createdAt: 'desc' },
});
```

## Query Optimization Checklist

- [ ] All `findMany` calls have `take` limit
- [ ] All queries use `select` to fetch only needed fields
- [ ] Pagination is implemented for list endpoints
- [ ] Indexes exist for frequently queried columns
- [ ] N+1 queries are avoided using `include`
- [ ] Count queries use `count()` instead of `findMany().length`
- [ ] Cursor-based pagination used for large datasets

## Query Performance Targets

| Query Type | Target Latency |
|-------------|----------------|
| Simple select by ID | < 10ms |
| Paginated list (20 items) | < 50ms |
| List with JOIN | < 100ms |
| Aggregation/count | < 50ms |
| Write operations | < 100ms |

## Monitoring

Use the logging interceptor to track slow queries:

```typescript
// In your service
private logger = new Logger('QueryPerformance');

async findAll() {
  const start = Date.now();
  const result = await this.prisma.user.findMany({ ... });
  const duration = Date.now() - start;

  if (duration > 100) {
    this.logger.warn(`Slow query detected: ${duration}ms`);
  }

  return result;
}
```

## Index Recommendations

### User Table
```sql
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_status ON "User"(status);
CREATE INDEX idx_user_created_at ON "User"("createdAt");
```

### Content Table
```sql
CREATE INDEX idx_content_creator ON "Content"(creatorId);
CREATE INDEX idx_content_universe ON "Content"(universe);
CREATE INDEX idx_content_status ON "Content"(status);
CREATE INDEX idx_content_created_at ON "Content"("createdAt");
```

### Transaction Table
```sql
CREATE INDEX idx_transaction_wallet ON "WalletTransaction"(walletId);
CREATE INDEX idx_transaction_type ON "WalletTransaction"(type);
CREATE INDEX idx_transaction_created_at ON "WalletTransaction"("createdAt");
```

## Anti-Patterns to Avoid

1. **Fetching all columns:**
   ```typescript
   // ❌ Bad
   const users = await prisma.user.findMany();

   // ✅ Good
   const users = await prisma.user.findMany({
     select: { id: true, email: true }
   });
   ```

2. **No pagination:**
   ```typescript
   // ❌ Bad - can cause OOM
   const allContent = await prisma.content.findMany();

   // ✅ Good
   const content = await prisma.content.findMany({
     take: 20,
     skip: 0,
   });
   ```

3. **N+1 queries:**
   ```typescript
   // ❌ Bad
   const orders = await prisma.order.findMany();
   for (const order of orders) {
     order.customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
   }

   // ✅ Good
   const orders = await prisma.order.findMany({
     include: { customer: { select: { id: true, name: true } } },
   });
   ```

4. **Filtering in JavaScript:**
   ```typescript
   // ❌ Bad
   const users = await prisma.user.findMany();
   const activeUsers = users.filter(u => u.status === 'active');

   // ✅ Good
   const activeUsers = await prisma.user.findMany({
     where: { status: 'active' },
   });
   ```
