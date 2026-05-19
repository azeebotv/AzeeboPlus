# Prisma Schema Ownership Documentation

## Overview

This document defines the database schema ownership strategy for the Azeebo+ platform. Each service owns its own database schema and Prisma models, with clear boundaries to prevent duplication and ensure data integrity.

## Ownership Strategy

### Service-Owned Schemas

Each microservice maintains its own Prisma schema and database. This approach:
- Provides clear ownership boundaries
- Enables independent scaling
- Simplifies deployment and rollbacks
- Reduces cross-service dependencies

### Shared Types

Common types (enums, interfaces, utilities) are centralized in `packages/shared-types/`.

## Entity Relationship Diagrams

### Core Services ERD

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Auth User    │───────│   User Service  │───────│   Wallet        │
│                 │ 1:1   │                 │ 1:1   │                 │
│ • id (PK)       │       │ • userId (FK)   │       │ • userId (FK)   │
│ • email         │       │ • preferences   │       │ • mainBalance   │
│ • passwordHash  │       │ • watchHistory  │       │ • bonusBalance  │
│ • displayName   │       │ • savedItems    │       │ • promoBalance  │
│ • role          │       │ • following     │       │                 │
│ • mfaEnabled    │       │ • subscription  │       └─────────────────┘
└─────────────────┘       └─────────────────┘
        │                           │
        │                           │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌─────────────────┐
        │   Analytics     │
        │                 │
        │ • eventId (PK)  │
        │ • userId (FK)   │
        │ • eventType     │
        │ • timestamp     │
        │ • properties    │
        └─────────────────┘
```

### Payment & Transaction ERD

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Payment       │───────│ Transaction     │───────│   Wallet        │
│                 │ 1:N   │                 │ N:1   │                 │
│ • id (PK)       │       │ • id (PK)       │       │ • id (PK)       │
│ • userId        │       │ • paymentId (FK)│       │ • userId (FK)   │
│ • amount        │       │ • walletId (FK) │       │ • balance       │
│ • status        │       │ • type          │       │                 │
│ • provider      │       │ • amount        │       └─────────────────┘
│ • metadata      │       │ • status        │
└─────────────────┘       └─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│   WebhookEvent  │
│                 │
│ • id (PK)       │
│ • paymentId (FK)│
│ • provider      │
│ • eventType     │
│ • payload       │
└─────────────────┘
```

### Content & Media ERD

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Content      │───────│    MediaAsset   │       │    Category     │
│                 │ 1:N   │                 │       │                 │
│ • id (PK)       │       │ • id (PK)       │       │ • id (PK)       │
│ • title         │       │ • contentId (FK)│       │ • name          │
│ • description   │       │ • url           │       │ • slug          │
│ • universe      │       │ • type          │       │                 │
│ • categoryId    │       │ • size          │       └─────────────────┘
│ • creatorId     │       │                 │
└─────────────────┘       └─────────────────┘
        │
        │
        ▼
┌─────────────────┐       ┌─────────────────┐
│     Comment     │       │    Tag          │
│                 │       │                 │
│ • id (PK)       │       │ • id (PK)       │
│ • contentId (FK)│       │ • name          │
│ • userId (FK)   │       │                 │
│ • text          │       └─────────────────┘
│ • createdAt     │
└─────────────────┘
```

## Service Schema Ownership

### Auth Service (`services/auth-service/prisma/schema.prisma`)
**Owner:** auth-service

**Models:**
- User (core user authentication data)
- Session (refresh token sessions)
- Otp (one-time passwords)
- SocialAccount (social login connections)
- Role (user role definitions)
- AuditLog (security audit trail)

**Responsibilities:**
- User registration and authentication
- Session management
- MFA/OTP handling
- Social login integration
- Audit logging

### User Service (`services/user-service/prisma/schema.prisma`)
**Owner:** user-service

**Models:**
- UserPreferences (user settings and preferences)
- WatchHistory (content viewing history)
- SavedItem (saved content items)
- Following (user follow relationships)
- Subscription (premium subscriptions)

**Responsibilities:**
- User profile management
- Content preferences
- Social relationships
- Subscription management

### Wallet Service (`services/wallet-service/prisma/schema.prisma`)
**Owner:** wallet-service

**Responsibilities:**
- Wallet balances
- Transactions
- Rewards redemption

### Payment Service (`services/payment-service/prisma/schema.prisma`)
**Owner:** payment-service

**Responsibilities:**
- Payment processing
- Payment history
- Refunds

### Content Service (`services/content-service/prisma/schema.prisma`)
**Owner:** content-service

**Responsibilities:**
- Content metadata
- Content categories
- Content tags

### Support Service (`services/support-service/prisma/schema.prisma`)
**Owner:** support-service

**Models:**
- SupportTicket
- SupportMessage
- Refund
- Chargeback
- Appeal
- ContentTakedown
- PayoutDispute
- UserSuspension
- WebhookEvent

**Responsibilities:**
- Support ticket management
- Refund processing
- Chargeback handling
- Appeals and disputes

### Universe Services
Each universe service owns its own content schema:
- reality-service
- games-service
- comedy-service
- sports-service
- movies-service
- lifestyle-service
- vertical-service

## Model Duplication Resolution

### Issue: Duplicate User Models
Both `auth-service` and `user-service` have `User` models, which creates potential data consistency issues.

### Solution
1. **auth-service** maintains the **authoritative User model** with core authentication fields:
   - id, email, password, displayName, avatar, role, mfaEnabled, mfaSecret, mfaBackupCodes

2. **user-service** references the auth User via `userId` foreign key and stores user-specific extensions:
   - UserPreferences (1:1 with User)
   - WatchHistory (1:N with User)
   - SavedItem (1:N with User)
   - Following (N:N relationship)
   - Subscription (1:N with User)

### Implementation Steps
1. Remove duplicate `User` model from user-service
2. Update all user-service models to reference User via `userId`
3. Add foreign key constraints where appropriate
4. Update user-service Prisma client and queries

## Cross-Service Data Access

### Allowed Patterns
1. **API Calls:** Services communicate via REST API for cross-service data
2. **Event-Driven:** Pub/sub for async data propagation
3. **Shared Cache:** Redis for frequently accessed shared data

### Prohibited Patterns
1. **Direct Database Access:** No cross-service direct database queries
2. **Shared Prisma Clients:** Each service uses its own client

## Migration Guidelines

1. **Service-Specific Migrations:** Each service manages its own migrations
2. **Atomic Migrations:** Migrations should be backward-compatible
3. **Migration Testing:** Test migrations in staging before production
4. **Rollback Plans:** Maintain rollback procedures for critical migrations

## Data Dictionary

### Core Entity Fields

| Entity | Field | Type | Required | Description | Validation |
|--------|-------|------|----------|-------------|------------|
| User | id | UUID | Yes | Primary key | UUID v4 |
| User | email | String | Yes | User email | Email format |
| User | passwordHash | String | Yes | Hashed password | bcrypt hash |
| User | displayName | String | Yes | Display name | 2-100 chars |
| User | role | Enum | Yes | User role | user/creator/moderator/admin/super_admin |
| User | mfaEnabled | Boolean | No | MFA status | true/false |

### Transaction Fields

| Entity | Field | Type | Required | Description | Validation |
|--------|-------|------|----------|-------------|------------|
| Transaction | id | UUID | Yes | Primary key | UUID v4 |
| Transaction | userId | UUID | Yes | User reference | Foreign key |
| Transaction | walletId | UUID | Yes | Wallet reference | Foreign key |
| Transaction | type | Enum | Yes | Transaction type | credit/debit/bonus/promo |
| Transaction | amount | Decimal | Yes | Transaction amount | Positive value |
| Transaction | status | Enum | Yes | Transaction status | pending/processing/completed/failed |

### Content Fields

| Entity | Field | Type | Required | Description | Validation |
|--------|-------|------|----------|-------------|------------|
| Content | id | UUID | Yes | Primary key | UUID v4 |
| Content | title | String | Yes | Content title | 1-255 chars |
| Content | description | String | No | Content description | Max 5000 chars |
| Content | universe | Enum | Yes | Content universe | reality/sports/games/movie/comedy/lifestyle/vertical |
| Content | categoryId | UUID | No | Category reference | Foreign key |
| Content | creatorId | UUID | Yes | Creator reference | Foreign key |
| Content | status | Enum | Yes | Content status | draft/published/archived/moderated |

### Index Documentation

#### Auth Service Indexes

| Table | Columns | Index Type | Purpose |
|-------|---------|------------|---------|
| User | email | Unique | Fast login lookups |
| User | id | Primary | Primary key |
| Session | userId | Index | Session lookups by user |
| Session | refreshToken | Unique | Token validation |
| AuditLog | userId | Index | User audit trails |
| AuditLog | createdAt | Index | Time-based queries |

#### Wallet Service Indexes

| Table | Columns | Index Type | Purpose |
|-------|---------|------------|---------|
| Wallet | userId | Unique | User wallet lookups |
| Wallet | id | Primary | Primary key |
| WalletTransaction | walletId | Index | Transaction history |
| WalletTransaction | userId | Index | User transactions |
| WalletTransaction | createdAt | Index | Time-based queries |
| WalletTransaction | type | Index | Type-based filtering |

#### Payment Service Indexes

| Table | Columns | Index Type | Purpose |
|-------|---------|------------|---------|
| PaymentIntent | id | Primary | Primary key |
| PaymentIntent | userId | Index | User payments |
| PaymentIntent | status | Index | Status-based queries |
| PaymentIntent | provider | Index | Provider filtering |
| PaymentIntent | createdAt | Index | Time-based queries |
| WebhookEvent | paymentId | Index | Event lookup by payment |
| WebhookEvent | eventType | Index | Type-based filtering |

#### Content Service Indexes

| Table | Columns | Index Type | Purpose |
|-------|---------|------------|---------|
| Content | id | Primary | Primary key |
| Content | creatorId | Index | Creator content |
| Content | universe | Index | Universe filtering |
| Content | categoryId | Index | Category filtering |
| Content | status | Index | Status filtering |
| Content | createdAt | Index | Recent content |
| Comment | contentId | Index | Content comments |
| Comment | userId | Index | User comments |

## Schema Evolution

1. **Backward Compatibility:** New fields should be optional initially
2. **Deprecation Period:** Mark old fields as deprecated before removal
3. **Communication:** Notify dependent services of breaking changes
4. **Versioning:** Consider schema versioning for critical models

## Migration Guidelines

### Standard Migration Workflow

1. **Plan:** Review impact on dependent services
2. **Write:** Create migration file with `prisma migrate dev`
3. **Test:** Run migration in development environment
4. **Stage:** Deploy to staging and verify
5. **Monitor:** Deploy to production with monitoring
6. **Rollback:** Prepare rollback script if needed

### Migration Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Add Column | New feature | `ALTER TABLE User ADD COLUMN bio TEXT` |
| Remove Column | Deprecated field | `ALTER TABLE User DROP COLUMN oldField` |
| Add Index | Performance | `CREATE INDEX idx_user_email ON User(email)` |
| Modify Column | Type change | `ALTER TABLE Transaction ALTER COLUMN amount TYPE DECIMAL(18,2)` |
| Add Table | New feature | `CREATE TABLE NewModel (...)` |

## Validation Checklist

- [ ] Each model has a clear owner service
- [ ] No duplicate models across services
- [ ] Foreign key relationships are properly defined
- [ ] Migrations are service-specific
- [ ] Cross-service access follows API patterns
- [ ] Sensitive data is encrypted at rest
- [ ] Indexes are added for frequently queried fields
- [ ] Audit logging is implemented for sensitive operations