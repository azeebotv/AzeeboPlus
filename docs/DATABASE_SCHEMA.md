# Database Schema Documentation

**Last Updated:** June 2, 2026  
**Version:** 1.0  
**Database:** PostgreSQL 15+  
**ORM:** Prisma 5.22.0  

---

## 1. Overview

Azeebo+ uses a microservices architecture with each service owning its database schema. All schemas are defined using Prisma ORM and are independently managed per service.

### 1.1 Service Database Ownership

| Service | Schema File | Tables | Description |
|---------|-------------|--------|-------------|
| auth-service | `services/auth-service/prisma/schema.prisma` | User, Role, Permission, Session, Device | Authentication and user management |
| content-service | `services/content-service/prisma/schema.prisma` | ContentItem, MediaAsset, Category, Tag, Universe, Comment, WatchHistory | Content management and delivery |
| wallet-service | `services/wallet-service/prisma/schema.prisma` | Wallet, Transaction, Reward, BonusCredit, PromoCredit | Wallet and financial operations |
| payment-service | `services/payment-service/prisma/schema.prisma` | Payment, PaymentIntent, PaymentMethod, Subscription, Invoice | Payment processing |
| engagement-service | `services/engagement-service/prisma/schema.prisma` | Like, Share, Bookmark, Follow, Notification | User engagement features |
| lifestyle-service | `services/lifestyle-service/prisma/schema.prisma` | Challenge, Poll, Quiz, Submission, Vote | Interactive content features |
| referral-service | `services/referral-service/prisma/schema.prisma` | ReferralCode, Referral, ReferralReward, ReferralConfig | Referral program |
| messaging-service | `services/messaging-service/prisma/schema.prisma` | Message, Conversation, MessageRecipient | Messaging and notifications |

---

## 2. Core Schemas

### 2.1 Authentication (auth-service)

#### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  firstName     String?
  lastName      String?
  avatar        String?
  role          String    @default("user")
  isActive      Boolean   @default(true)
  isVerified    Boolean   @default(false)
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  devices       Device[]
  
  @@map("users")
  @@index([email])
  @@index([role])
}
```

**Key Relationships:**
- User → Session (one-to-many)
- User → Device (one-to-many)

**Indexes:**
- `email` (unique)
- `role` (for RBAC queries)

---

#### Session
```prisma
model Session {
  id            String    @id @default(uuid())
  userId        String
  token         String    @unique
  refreshToken  String    @unique
  expiresAt     DateTime
  revokedAt     DateTime?
  ipAddress     String?
  userAgent     String?
  deviceId      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  user          User      @relation(fields: [userId], references: [id])
  
  @@map("sessions")
  @@index([userId])
  @@index([token])
  @@index([refreshToken])
}
```

---

### 2.2 Content (content-service)

#### ContentItem
```prisma
model ContentItem {
  id            String    @id @default(uuid())
  title         String
  slug          String    @unique
  description   String?
  thumbnailUrl  String?
  type          String    // video, audio, image, document
  status        String    @default("draft") // draft, published, archived
  isPremium     Boolean   @default(false)
  price         Decimal?  @default(0)
  viewCount     Int       @default(0)
  likeCount     Int       @default(0)
  shareCount    Int       @default(0)
  universeId    String
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  universe      Universe  @relation(fields: [universeId], references: [id])
  mediaAsset    MediaAsset?
  comments      Comment[]
  watchHistory  WatchHistory[]
  
  @@map("content_items")
  @@index([universeId])
  @@index([status])
  @@index([type])
  @@index([slug])
}
```

**Key Relationships:**
- ContentItem → Universe (many-to-one)
- ContentItem → MediaAsset (one-to-one)
- ContentItem → Comment (one-to-many)
- ContentItem → WatchHistory (one-to-many)

---

#### Universe
```prisma
model Universe {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  description   String?
  coverImage    String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  content       ContentItem[]
  
  @@map("universes")
  @@index([slug])
}
```

---

### 2.3 Wallet (wallet-service)

#### Wallet
```prisma
model Wallet {
  id            String    @id @default(uuid())
  userId        String    @unique
  balance       Decimal   @default(0)
  bonusBalance  Decimal   @default(0)
  promoBalance  Decimal   @default(0)
  rewardPoints  Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  transactions  Transaction[]
  
  @@map("wallets")
  @@index([userId])
}
```

**Key Relationships:**
- Wallet → Transaction (one-to-many)

---

#### Transaction
```prisma
model Transaction {
  id            String    @id @default(uuid())
  walletId      String
  type          String    // credit, debit
  amount        Decimal
  balanceBefore Decimal
  balanceAfter  Decimal
  description   String?
  reference     String?   // external reference (payment ID, etc.)
  idempotencyKey String?  @unique
  status        String    @default("pending") // pending, completed, failed
  metadata      Json?
  createdAt     DateTime  @default(now())
  
  wallet        Wallet    @relation(fields: [walletId], references: [id])
  
  @@map("transactions")
  @@index([walletId])
  @@index([status])
  @@index([idempotencyKey])
}
```

---

### 2.4 Payment (payment-service)

#### Payment
```prisma
model Payment {
  id            String    @id @default(uuid())
  userId        String
  amount        Decimal
  currency      String    @default("USD")
  status        String    @default("pending") // pending, processing, completed, failed, refunded
  provider      String    // paystack, flutterwave
  providerRef   String?   @unique
  paymentMethod String    // card, bank_transfer, mobile_money
  metadata      Json?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("payments")
  @@index([userId])
  @@index([status])
  @@index([providerRef])
}
```

---

### 2.5 Referral (referral-service)

#### ReferralCode
```prisma
model ReferralCode {
  id            String    @id @default(uuid())
  userId        String
  code          String    @unique
  isActive      Boolean   @default(true)
  maxUses       Int?
  currentUses   Int       @default(0)
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  referrals     Referral[]
  
  @@map("referral_codes")
  @@index([userId])
  @@index([code])
  @@index([isActive])
}
```

#### Referral
```prisma
model Referral {
  id            String    @id @default(uuid())
  referrerId    String
  referredId    String
  referralCodeId String
  status        String    @default("pending") // pending, completed, rewarded
  rewardAmount  Decimal?
  rewardedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  referralCode  ReferralCode @relation(fields: [referralCodeId], references: [id])
  
  @@map("referrals")
  @@index([referrerId])
  @@index([referredId])
  @@index([status])
}
```

---

### 2.6 Lifestyle (lifestyle-service)

#### Challenge
```prisma
model Challenge {
  id            String    @id @default(uuid())
  title         String
  slug          String    @unique
  description   String
  coverImage    String?
  type          String    // photo, video, quiz, poll
  startDate     DateTime
  endDate       DateTime
  prize         String?
  rules         String?
  status        String    @default("draft") // draft, active, completed, cancelled
  participantCount Int    @default(0)
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  submissions   ChallengeSubmission[]
  
  @@index([type])
  @@index([status])
  @@index([startDate])
  @@index([endDate])
}
```

#### Poll
```prisma
model Poll {
  id            String    @id @default(uuid())
  question      String
  slug          String    @unique
  description   String?
  expiresAt     DateTime?
  status        String    @default("draft") // draft, active, completed
  totalVotes    Int       @default(0)
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  options       PollOption[]
  votes         PollVote[]
  
  @@index([status])
  @@index([expiresAt])
}
```

#### Quiz
```prisma
model Quiz {
  id            String    @id @default(uuid())
  title         String
  slug          String    @unique
  description   String?
  timeLimit     Int?      // in seconds
  playCount     Int       @default(0)
  createdById   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  questions     QuizQuestion[]
  attempts      QuizAttempt[]
  
  @@index([slug])
}
```

---

## 3. Cross-Service Relationships

While each service owns its database, there are logical relationships across services:

| Source Service | Target Service | Relationship Type | Description |
|----------------|----------------|-------------------|-------------|
| auth-service | All services | User reference | All services reference `userId` from auth-service |
| content-service | wallet-service | Content purchase | Wallet transactions reference content purchases |
| payment-service | wallet-service | Payment funding | Payments fund wallet balances |
| referral-service | wallet-service | Reward crediting | Referral rewards credit wallet balances |
| engagement-service | content-service | Content engagement | Likes, shares reference content items |

---

## 4. Indexing Strategy

### 4.1 Common Indexes

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| User | email | Unique | User lookup by email |
| User | role | B-tree | RBAC queries |
| ContentItem | slug | Unique | Content lookup by slug |
| ContentItem | status | B-tree | Filter by publication status |
| ContentItem | universeId | B-tree | Filter by universe |
| Transaction | walletId | B-tree | Transaction history |
| Transaction | idempotencyKey | Unique | Prevent duplicate transactions |
| Payment | providerRef | Unique | Webhook idempotency |

### 4.2 Composite Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| ContentItem | (universeId, status) | Filter content by universe and status |
| Transaction | (walletId, createdAt DESC) | Recent transactions for wallet |
| Payment | (userId, status) | User payment history |

---

## 5. Data Retention Policies

| Data Type | Retention Period | Deletion Policy |
|-----------|------------------|-----------------|
| User accounts | Indefinite (until deletion request) | Soft delete with GDPR compliance |
| Sessions | 90 days | Automatic cleanup of expired sessions |
| Transactions | 7 years | Financial compliance requirement |
| Payments | 7 years | Financial compliance requirement |
| Audit logs | 2 years | Compliance requirement |
| Watch history | 1 year | Automatic cleanup |
| Referral data | 3 years | Program duration + buffer |

---

## 6. Migration Strategy

### 6.1 Prisma Migrations

All schema changes are managed through Prisma migrations:

```bash
# Create a new migration
npx prisma migrate dev --name add_new_field

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### 6.2 Migration Guidelines

1. **Never modify existing migrations** - Create new migrations for changes
2. **Test migrations on staging first** - Verify before production
3. **Backup before production migrations** - Always have a rollback plan
4. **Use `prisma migrate deploy` in production** - Not `prisma db push`
5. **Monitor migration duration** - Large tables may require online migrations

---

## 7. Security Considerations

### 7.1 Sensitive Data

| Table | Sensitive Fields | Encryption |
|-------|------------------|------------|
| User | password, mfaSecret | bcrypt (password), encrypted (mfaSecret) |
| Session | token, refreshToken | Encrypted at rest |
| Wallet | balance | Encrypted at rest |
| Payment | providerRef, metadata | Encrypted at rest |

### 7.2 Access Control

- Database credentials are stored in environment variables
- Connection pooling via PgBouncer
- Row-level security for multi-tenant data
- Audit logging for all data access

---

## 8. Performance Optimization

### 8.1 Query Optimization

- Use `select` instead of `include` when possible
- Limit result sets with `take` and `skip`
- Use cursor-based pagination for large datasets
- Avoid N+1 queries with proper Prisma queries

### 8.2 Connection Pooling

- PgBouncer configured for connection pooling
- Pool size: 20 connections per service
- Max connections: 100 per database instance

### 8.3 Caching Strategy

- Redis caching for frequently accessed data
- Cache TTL varies by data type (see caching documentation)
- Cache invalidation on data updates

---

## 9. Monitoring

### 9.1 Database Metrics

- Connection pool utilization
- Query execution time
- Slow query log (>100ms)
- Table size growth
- Index usage statistics

### 9.2 Alerts

- Connection pool exhaustion
- Slow query threshold exceeded
- Disk space usage >80%
- Replication lag (if read replicas configured)

---

## 10. Backup & Recovery

### 10.1 Backup Strategy

- Daily automated backups
- Point-in-time recovery enabled
- Encrypted backup storage
- Cross-region backup replication

### 10.2 Recovery Procedures

1. **Point-in-time recovery** - Restore to specific timestamp
2. **Full database restore** - From latest backup
3. **Table-level restore** - For specific table recovery

---

**Document Owner:** Engineering Team  
**Review Frequency:** Quarterly  
**Next Review:** September 2, 2026
