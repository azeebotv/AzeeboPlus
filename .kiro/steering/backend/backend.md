# Azeebo+ Backend Engineering Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Technology Stack

| Component | Technology | Enforcement |
|-----------|-----------|-------------|
| Framework | NestJS | MUST |
| Language | TypeScript | MUST |
| Database | PostgreSQL | MUST |
| Cache | Redis | MUST |
| ORM | TypeORM or Prisma | MUST |
| Queue | BullMQ / Redis queues | MUST |
| Search | OpenSearch or Elasticsearch | SHOULD |

---

## Architecture Overview

### Monorepo Structure

```
azeebo-plus/
├── services/                    # Shared backend services
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── wallet-service/
│   ├── payment-service/
│   ├── reward-service/
│   ├── notification-service/
│   ├── content-service/
│   ├── search-service/
│   ├── analytics-service/
│   ├── moderation-service/
│   └── recommendation-service/
│
├── modules/                     # Universe-specific logic
│   ├── reality-service/
│   ├── creator-service/
│   ├── lifestyle-service/
│   ├── vertical-service/
│   ├── movie-service/
│   ├── games-service/
│   ├── comedy-service/
│   └── sports-service/
│
├── packages/                    # Shared packages
│   ├── shared-types/
│   ├── api-client/
│   ├── utils/
│   └── analytics-sdk/
│
└── infra/                       # Infrastructure
    ├── docker/
    ├── kubernetes/
    ├── terraform/
    └── ci-cd/
```

---

## Service Design Principles

### Coupling & Communication

- Services MUST be loosely coupled
- Cross-service communication MUST be event-driven where possible
- APIs MUST be versioned (`/v1`, `/v2`)
- All operations MUST be idempotent where applicable

### Required Health Endpoints

Every service MUST include:
- `GET /health` - Health check endpoint
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### Business Logic Separation

- Business logic MUST NOT exist in controllers
- Controllers MUST be thin wrappers around services
- Dependency injection MUST be used

---

## Core Shared Services

### Auth Service

**Responsibilities:**
- Signup / login
- OTP / social auth
- Token issuance and refresh
- Session management
- Role-based access control
- Account verification

**Roles Supported:**
| Role | Permissions | Scope |
|------|-------------|-------|
| `user` | View, consume content | Personal |
| `creator` | Create, manage content | Personal + universe |
| `moderator` | Review, flag content | Universe |
| `admin` | Manage users, content | Platform |
| `super_admin` | Full access | Platform |
| `partner` | Sponsor access | Partner scope |
| `sponsor_manager` | Campaign management | Sponsor scope |

**Core Objects:**
- `account`
- `auth_provider`
- `session`
- `role`
- `permission`

### User Service

**Responsibilities:**
- Profile management
- Preferences and interests
- Watch history
- Participation history
- Saved items
- Universe affinity

**Core Objects:**
- `user`
- `user_profile`
- `preference`
- `watch_history`
- `saved_item`
- `activity_summary`

### Wallet Service

**Responsibilities:**
- Wallet balance management
- Credits / debits
- Stored value
- Transaction ledger
- Promo credits
- Bonus credits
- Voting wallet
- Reward conversion support

**Core Objects:**
- `wallet`
- `wallet_transaction`
- `balance_snapshot`
- `promo_credit`
- `reward_credit`

**Rules:**
- Wallet operations MUST be atomic (all-or-nothing)
- Wallet operations MUST be auditable (full history)
- Wallet operations MUST be consistent (no race conditions)
- Wallet operations MUST be reversible (refunds supported)

### Payment Service

**Responsibilities:**
- Payment initialization
- Payment provider integration
- Transaction verification
- Payment callbacks / webhooks
- Refunds / reversals
- Subscription billing
- One-off purchases

**Core Objects:**
- `payment_intent`
- `payment_transaction`
- `payment_method`
- `refund`
- `chargeback_case`

**Payment Flow:**
```
pending → processing → completed/failed
```

**Every payment MUST include:**
1. Confirmation (user approval)
2. Processing (payment gateway)
3. Success (transaction recorded)
4. Failure (error handling + retry)

**Webhook Requirements:**
- MUST be cryptographically signed
- MUST be idempotent (safe to replay)
- MUST have timeout handling
- MUST log all events

### Reward Service

**Responsibilities:**
- Points management
- Streaks
- Badges
- Level system
- Reward rules
- Challenge rewards
- Redemption tracking

**Core Objects:**
- `reward_account`
- `points_ledger`
- `badge`
- `streak`
- `level`
- `redemption`

### Notification Service

**Responsibilities:**
- Push notifications
- In-app notifications
- Email notifications
- SMS alerts
- Campaign triggers
- Reminder rules

**Core Objects:**
- `notification`
- `template`
- `delivery_attempt`
- `preference`
- `campaign_trigger`

### Content Service

**Responsibilities:**
- Content ingestion
- Metadata management
- Categories and tagging
- Media references
- Publishing states
- Content availability windows
- Content relationships

**Core Objects:**
- `content_item`
- `media_asset`
- `category`
- `tag`
- `publish_state`
- `content_relation`

### Search Service

**Responsibilities:**
- Universal search
- Suggestions
- Trending search
- Faceted filtering
- Universe filtering

**Core Objects:**
- `search_index`
- `search_query_log`
- `suggestion`
- `ranking_rule`

### Analytics Service

**Responsibilities:**
- Event ingestion
- Event validation
- Product metrics
- Funnel metrics
- Cohort support
- Dashboard feeds
- Internal KPI reporting

**Core Objects:**
- `product_event`
- `event_schema`
- `experiment_event`
- `conversion_metric`
- `session_summary`

### Moderation Service

**Responsibilities:**
- Content reporting
- Moderation workflows
- Creator verification flags
- Abuse handling
- Trust scoring
- Safety actions

**Core Objects:**
- `report`
- `moderation_case`
- `moderation_action`
- `flagged_content`
- `trust_score`

### Recommendation Service

**Responsibilities:**
- Feed ranking
- Universe recommendations
- Content recommendations
- Creator recommendations
- Personalization
- Cross-universe suggestions

**Core Objects:**
- `recommendation_request`
- `recommendation_result`
- `user_embedding`
- `content_embedding`
- `ranking_signal`

---

## Universe-Specific Services

### Reality Service

**Responsibilities:**
- Shows, seasons, episodes
- Contestants
- Voting logic
- Supervotes
- Predictions
- Leaderboards
- Fan engagement flows

**Core Entities:**
- `show`, `season`, `episode`
- `contestant`
- `vote`, `supervote`
- `prediction`
- `leaderboard_entry`

### Creator Service

**Responsibilities:**
- Creator onboarding
- Creator verification
- Uploads
- Creator channels
- Subscriptions
- Tips
- Creator analytics
- Creator earnings tracking

**Core Entities:**
- `creator_profile`
- `creator_channel`
- `upload`
- `tip`, `subscription`
- `creator_earning`
- `creator_campaign`

### Lifestyle Service

**Responsibilities:**
- Music rails
- Culture stories
- Celebrity coverage
- Nightlife / city guide
- Event discovery
- Influencer features

**Core Entities:**
- `lifestyle_story`
- `city_guide_item`
- `event`, `venue`
- `celebrity_profile`
- `influencer_feature`

### Vertical Service

**Responsibilities:**
- Fictional universe map
- Title pages
- Characters
- Lore
- Timeline
- Crossover logic
- Fandom interactions

**Core Entities:**
- `universe_layer`
- `title`, `character`
- `lore_entry`
- `timeline_node`
- `crossover_link`

### Movie Service

**Responsibilities:**
- Movie catalog
- Premiere access
- Passes / rentals
- Viewing windows
- Watchlist
- Filmmaker support

**Core Entities:**
- `movie`, `premiere`
- `access_pass`, `rental`
- `watch_session`
- `filmmaker_profile`

### Games Service

**Responsibilities:**
- Daily challenges
- Trivia
- Tournaments
- Score logic
- Leaderboard logic
- Entry flows
- Reward hooks

**Core Entities:**
- `game`, `game_session`
- `challenge`
- `answer_submission`
- `score_entry`
- `tournament`

### Comedy Service

**Responsibilities:**
- Skit feed
- Comedy clip management
- Comedian profiles
- Comedy challenges
- Share and trend logic

**Core Entities:**
- `comedy_clip`
- `comedian_profile`
- `comedy_series`
- `share_event`
- `challenge_entry`

### Sports Service

**Responsibilities:**
- Sports highlights
- Fixtures metadata
- Prediction logic
- Fan contests
- Sports leaderboards
- Fan boards

**Core Entities:**
- `sports_event`
- `highlight`
- `prediction_market`
- `contest`
- `fan_board`
- `prediction_entry`

---

## API Architecture

### API Pattern

- REST APIs for external clients
- Optional internal aggregation in API gateway
- Webhook support for payments and partner events

### API Gateway Responsibilities

- Authentication checks
- Request routing
- Request composition
- Mobile-friendly payload shaping
- Feature flags
- Rate limiting
- API version control
- Edge caching for safe endpoints

### Core API Endpoints

#### Auth API
```
POST /v1/auth/signup
POST /v1/auth/login
POST /v1/auth/logout
POST /v1/auth/refresh
POST /v1/auth/verify-otp
POST /v1/auth/request-otp
GET  /v1/auth/me
```

#### User API
```
GET    /v1/users/me
PATCH  /v1/users/me
GET    /v1/users/me/preferences
PUT    /v1/users/me/preferences
GET    /v1/users/me/history
GET    /v1/users/me/saved
POST   /v1/users/me/saved
DELETE /v1/users/me/saved/{id}
```

#### Wallet API
```
GET  /v1/wallet
GET  /v1/wallet/transactions
POST /v1/wallet/fund
POST /v1/wallet/redeem-reward
GET  /v1/wallet/summary
```

#### Payments API
```
POST /v1/payments/initialize
POST /v1/payments/verify
POST /v1/payments/webhook
GET  /v1/payments/history
POST /v1/payments/refund-request
```

#### Rewards API
```
GET  /v1/rewards
GET  /v1/rewards/missions
GET  /v1/rewards/badges
GET  /v1/rewards/streak
POST /v1/rewards/redeem
```

#### Content API
```
GET /v1/content/home
GET /v1/content/watch
GET /v1/content/{id}
GET /v1/content/search
GET /v1/content/trending
GET /v1/content/recommended
```

#### Notifications API
```
GET    /v1/notifications
PATCH  /v1/notifications/{id}/read
PATCH  /v1/notifications/read-all
PUT    /v1/notifications/preferences
```

#### Analytics API
```
POST /v1/analytics/events
GET  /v1/analytics/me/summary
```

#### Moderation API
```
POST /v1/moderation/report
GET  /v1/moderation/report-types
POST /v1/moderation/appeal
```

---

## Security Requirements

### Authentication

- JWT tokens MUST be used
- Access tokens MUST be short-lived (15-30 min)
- Refresh tokens MUST be rotated
- Token revocation MUST be supported

**Required JWT Claims:**
```
iss (issuer)
sub (subject/user ID)
aud (audience)
exp (expiration)
iat (issued at)
jti (JWT ID for revocation)
```

### MFA Requirements

MFA MUST be enforced for:
- Admin accounts
- Payout operations
- Sensitive actions

### OWASP API Top 10 Compliance

| Threat | Prevention |
|--------|-----------|
| Broken Object Level Authorization | Ownership checks |
| Rate abuse | Rate limiting |
| SSRF | URL validation |
| Data exposure | Encryption + sanitization |
| Injection attacks | Input validation |
| Broken authentication | JWT + MFA |
| Excessive data exposure | Field filtering |
| Mass assignment | Explicit field mapping |
| Logging & monitoring | Audit trails |
| Unsafe consumption | Validation |

### Data Security

- Sensitive data MUST be encrypted at rest (AES-256)
- Data MUST be encrypted in transit (TLS 1.3)
- Passwords MUST be hashed (bcrypt, Argon2)
- Passwords MUST NOT be encrypted (one-way only)

### Secrets Management

- No hardcoded API keys
- No credentials in git
- Use environment variables
- Use secret managers (AWS Secrets Manager, HashiCorp Vault)

---

## Logging & Observability

### Structured Logging

All logs MUST be structured JSON:
```json
{
  "timestamp": "2026-04-23T10:30:00Z",
  "level": "INFO",
  "traceId": "abc-123-def",
  "service": "payment-service",
  "message": "Payment processed",
  "userId": "user-123",
  "amount": 1000,
  "status": "completed"
}
```

### Required Log Fields

- Timestamp (ISO 8601)
- Log level (DEBUG, INFO, WARN, ERROR)
- Trace ID (for request correlation)
- Service name
- User ID (when applicable)
- Request ID

### Audit Logging

**Audit logs MUST be created for:**

| Event | Retention |
|-------|-----------|
| Authentication events | 1 year |
| Payments | 7 years |
| Admin actions | 2 years |
| Role changes | 2 years |
| Data access | 1 year |

**Audit logs MUST include:**
- Actor (who did it)
- Action (what was done)
- Resource (what was affected)
- Timestamp (when)
- Result (success/failure)
- IP address
- User agent

---

## Prohibited Actions

- No universe should own its own wallet logic
- No paid flow should bypass Payment Service
- No reward rule should live only in frontend
- All premium access checks must happen server-side
- No secrets in code
- No trusting frontend validation alone
