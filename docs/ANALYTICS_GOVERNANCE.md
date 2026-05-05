# Azeebo+ Analytics Governance

This document defines our analytics strategy, data handling practices, and compliance requirements.

---

## Analytics Event Schema

### Standard Event Structure

All analytics events must conform to this schema:

```typescript
interface AnalyticsEvent {
  eventName: string;           // e.g., "page_view", "content_watch"
  timestamp: string;          // ISO 8601
  userId?: string;            // Hashed user ID (if authenticated)
  sessionId: string;          // Anonymous session ID
  deviceId: string;           // Hashed device identifier
  platform: 'web' | 'ios' | 'android';
  appVersion: string;
  osVersion: string;
  country?: string;           // Derived from IP (with consent)
  properties: Record<string, any>; // Event-specific data
}
```

### Event Naming Convention

- Use snake_case: `page_view`, `content_purchase`
- Prefix with category: `auth_login`, `content_watch`, `payment_success`
- Past tense for completed actions: `clicked`, `watched`, `purchased`

### Core Events

#### Auth Events

```typescript
// auth_signup
{
  eventName: 'auth_signup',
  properties: {
    signupMethod: 'email' | 'google' | 'apple',
    referralSource?: string,
    creatorAccount: boolean
  }
}

// auth_login
{
  eventName: 'auth_login',
  properties: {
    loginMethod: 'email' | 'google' | 'apple',
    isFirstLogin: boolean
  }
}

// auth_logout
{
  eventName: 'auth_logout',
  properties: {
    logoutReason: 'user_initiated' | 'session_expired' | 'token_revoked'
  }
}
```

#### Content Events

```typescript
// content_view
{
  eventName: 'content_view',
  properties: {
    contentId: string,
    contentType: 'video' | 'article' | 'audio',
    creatorId: string,
    vertical: string,
    source: 'search' | 'recommendation' | 'feed' | 'direct'
  }
}

// content_watch
{
  eventName: 'content_watch',
  properties: {
    contentId: string,
    watchDurationSeconds: number,
    percentComplete: number,
    finished: boolean,
    quality: '1080p' | '720p' | '480p'
  }
}

// content_like
{
  eventName: 'content_like',
  properties: {
    contentId: string,
    contentType: string
  }
}

// content_comment
{
  eventName: 'content_comment',
  properties: {
    contentId: string,
    commentLength: number
  }
}

// content_save
{
  eventName: 'content_save',
  properties: {
    contentId: string
  }
}
```

#### Payment Events

```typescript
// payment_initiate
{
  eventName: 'payment_initiate',
  properties: {
    amount: number,
    currency: string,
    paymentMethod: 'card' | 'transfer' | 'wallet',
    intentType: 'content_purchase' | 'wallet_topup' | 'subscription'
  }
}

// payment_success
{
  eventName: 'payment_success',
  properties: {
    paymentIntentId: string,
    amount: number,
    currency: string,
    provider: 'paystack' | 'flutterwave'
  }
}

// payment_failed
{
  eventName: 'payment_failed',
  properties: {
    errorCode: string,
    errorMessage: string,
    amount: number
  }
}

// wallet_topup
{
  eventName: 'wallet_topup',
  properties: {
    amount: number,
    currency: string,
    newBalance: number
  }
}

// content_purchase
{
  eventName: 'content_purchase',
  properties: {
    contentId: string,
    price: number,
    currency: string
  }
}
```

#### Search Events

```typescript
// search_query
{
  eventName: 'search_query',
  properties: {
    query: string,
    resultCount: number,
    filters: string[]
  }
}

// search_click
{
  eventName: 'search_click',
  properties: {
    query: string,
    resultPosition: number,
    contentId: string
  }
}
```

---

## PII Redaction Policy

### Fields That Must Never Be Tracked

- Full names
- Email addresses
- Phone numbers
- Physical addresses
- Passwords or tokens
- Payment card details
- Bank account numbers
- Exact location coordinates (without consent)
- Device serial numbers or IMEI

### Fields That Require Hashing

| Original Field | Hashed Field | Algorithm |
|----------------|--------------|-----------|
| userId | user_id_hash | SHA-256 |
| deviceId | device_id_hash | SHA-256 |
| email | email_hash | SHA-256 (only for matching, not storage) |

### Redaction Implementation

```typescript
// Redaction utility
const REDACTED_FIELDS = ['email', 'phone', 'name', 'address', 'token', 'password'];
const HASH_FIELDS = ['userId', 'deviceId', 'email'];

function redactEvent(event: any): AnalyticsEvent {
  const redacted = { ...event };
  
  // Redact sensitive fields
  for (const field of REDACTED_FIELDS) {
    if (redacted.properties?.[field]) {
      redacted.properties[field] = '[REDACTED]';
    }
  }
  
  // Hash identifying fields
  for (const field of HASH_FIELDS) {
    if (redacted[field]) {
      redacted[field + '_hash'] = crypto.createHash('sha256')
        .update(redacted[field])
        .digest('hex');
      delete redacted[field];
    }
  }
  
  return redacted;
}
```

---

## Consent Handling

### Consent Categories

Users can opt in/out of these categories:

| Category | Description | Required? |
|----------|-------------|-----------|
| `necessary` | Core app functionality, security | Yes |
| `analytics` | Usage analytics to improve app | No |
| `personalization` | Content recommendations | No |
| `marketing` | Email/SMS marketing | No |

### Consent Flow

1. **First Visit**:
   - Show consent banner on app launch
   - Explain each category clearly
   - Allow granular control
   - Default: only necessary enabled

2. **Consent Storage**:
   - Store consent preferences in database (encrypted)
   - Store consent timestamp and version
   - Sync across user devices

3. **Respect Choices**:
   - Don't send analytics events if analytics consent denied
   - Don't personalize if personalization consent denied
   - Don't send marketing if marketing consent denied

4. **Change Consent**:
   - Allow users to update preferences anytime in Settings → Privacy
   - Show current consent state
   - Log consent changes to audit trail

### API Endpoints

```typescript
// Get current consent
GET /api/v1/users/me/consent

// Update consent
PATCH /api/v1/users/me/consent
{
  necessary: true,
  analytics: boolean,
  personalization: boolean,
  marketing: boolean
}
```

---

## Data Retention Policy

### Retention Periods

| Data Type | Retention Period | Action After |
|-----------|------------------|--------------|
| Raw analytics events | 90 days | Aggregated and anonymized |
| Aggregated analytics | 2 years | Deleted |
| User consent records | Account lifetime + 7 years | Deleted |
| Audit logs | 7 years | Archived to cold storage |

### Deletion Process

1. **Automated Cleanup**:
   - Daily cron job deletes raw events older than 90 days
   - Monthly job aggregates old data
   - Annual job deletes aggregated data older than 2 years

2. **User Data Deletion (GDPR)**:
   - When user requests account deletion:
     - Delete all personal data within 30 days
     - Anonymize or delete analytics data linked to user
     - Keep audit logs of deletion for compliance

3. **Verification**:
   - Monthly audits to verify retention policy followed
   - Document all deletion operations

---

## Dashboard Ownership

| Dashboard | Owner | Purpose | Access |
|-----------|-------|---------|--------|
| User Growth | Product Manager | DAU/MAU, signup funnel, retention | Exec, Product, Marketing |
| Content Performance | Content Lead | Views, watch time, creator earnings | Exec, Product, Content Team |
| Payment & Revenue | Finance Lead | MRR, ARPU, conversion, refunds | Exec, Finance, Product |
| System Health | Engineering Lead | Error rates, latency, uptime | Exec, Engineering |
| Creator Analytics | Creator Success Lead | Creator earnings, content performance | Creator Success, individual creators |
| Marketing | Marketing Lead | Campaign performance, attribution | Exec, Marketing |

### Dashboard Access Controls

- Role-based access control (RBAC)
- SSO required for all dashboards
- Session timeout after 1 hour inactivity
- Access reviews quarterly
- Audit log of all dashboard access

---

## Compliance

### GDPR Requirements

- ✅ User consent for data collection
- ✅ Right to access personal data
- ✅ Right to data portability
- ✅ Right to erasure ("right to be forgotten")
- ✅ Right to restrict processing
- ✅ Right to object
- ✅ Data minimization
- ✅ Storage limitation

### CCPA/CPRA Requirements

- ✅ Right to opt out of sale
- ✅ Right to access and deletion
- ✅ Transparent privacy policy
- ✅ Non-discrimination for exercising rights

### Data Processing Agreement (DPA)

- All third-party analytics vendors sign DPA
- Vendors must be GDPR/CCPA compliant
- Data processing restricted to documented purposes
- Sub-processors documented and approved

---

## Third-Party Vendors

### Current Vendors

| Vendor | Purpose | Data Shared | DPA Signed |
|--------|---------|-------------|------------|
| PostHog (self-hosted) | Product analytics | Redacted events only | Yes |
| CloudWatch | System metrics | Application logs | N/A (AWS) |
| Prometheus | Infrastructure metrics | System metrics | N/A (self-hosted) |

### Vendor Evaluation Criteria

Before adding new vendors:

1. Data security practices
2. Compliance certifications (SOC 2, ISO 27001)
3. Data residency options
4. DPA availability
5. Sub-processor transparency
6. Deletion capabilities

---

## Incident Response

### Data Breach Procedure

If analytics data compromised:

1. **Detect & Contain**:
   - Identify scope of breach
   - Isolate affected systems
   - Preserve evidence

2. **Assess Impact**:
   - What data exposed?
   - How many users affected?
   - PII involved?

3. **Notify**:
   - Internal team within 1 hour
   - Users within 72 hours (if PII involved)
   - Regulators within required timeframe

4. **Remediate**:
   - Fix vulnerability
   - Rotate credentials
   - Improve monitoring

5. **Document**:
   - Full incident report
   - Root cause analysis
   - Lessons learned

---

## Training & Awareness

### Required Training

All team members with analytics access must complete:

- Privacy & Data Protection (annual)
- Analytics Governance (annual)
- Security Awareness (quarterly)

### Creator Training

Creators receive training on:

- What analytics data they can access
- How to interpret their dashboard
- Data privacy best practices

---

## Policy Review

- Annual review of this document
- Update as laws or practices change
- All changes documented and communicated

---

Last Updated: 2025
