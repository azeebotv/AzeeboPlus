# Azeebo+ Engineering Rules & Security Standard

**Version:** 1.0  
**Applies To:** All services, modules, apps, and infrastructure  
**Last Updated:** April 23, 2026

---

## 📋 Enforcement Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **MUST** | Mandatory | Block merge if violated |
| **SHOULD** | Strongly recommended | Requires justification if skipped |
| **MUST NOT** | Strictly forbidden | Immediate escalation |



---

## 1. 🏗 Architecture

### 1.1 Directory Structure

| Location | Purpose | Rule |
|----------|---------|------|
| `/services` | Shared backend services | MUST |
| `/modules` | Universe-specific logic | MUST |
| `/packages/ui` | Shared UI components | MUST |
| `/packages/shared` | Types & contracts | MUST |
| `/apps` | Applications (mobile, web, admin) | MUST |

### 1.2 Service Design

**Coupling & Communication**
- Services MUST be loosely coupled
- Cross-service communication MUST be event-driven where possible
- APIs MUST be versioned (`/v1`, `/v2`)
- All operations MUST be idempotent where applicable

**Service Requirements**
Every service MUST include:
- `GET /health` - Health check endpoint
- `GET /ready` - Readiness probe
- `GET /live` - Liveness probe

### 1.3 Business Logic Separation

**Controllers**
- Business logic MUST NOT exist in controllers
- Controllers MUST be thin wrappers around services

**Shared Services**
Modules MUST NOT duplicate:
- ❌ Payments
- ❌ Wallet
- ❌ Authentication
- ❌ Rewards
- ❌ Analytics





---

## 2. 🎨 Frontend Rules

### 2.1 Technology Stack

| Platform | Framework | Rule |
|----------|-----------|------|
| Mobile | React Native + Expo | MUST |
| Web | Next.js | MUST |
| Language | TypeScript | MUST |

### 2.2 UI/UX Requirements

**Every screen MUST include:**
- ✅ Loading state
- ✅ Empty state
- ✅ Error state
- ✅ Success state
- ✅ Retry option

### 2.3 Security Boundaries

**Frontend MUST NOT:**
- ❌ Store secrets
- ❌ Verify payments
- ❌ Enforce permissions alone

**All sensitive logic MUST be server-side**

### 2.4 Design System

- Use design tokens MUST
- Mobile-first design MUST
- Accessibility compliance MUST



---

## 3. ⚙️ Backend Rules

### 3.1 Technology Stack

| Component | Technology | Rule |
|-----------|-----------|------|
| Framework | NestJS | MUST |
| Language | TypeScript | MUST |
| Database | PostgreSQL | MUST |
| Cache | Redis | MUST |

### 3.2 API Requirements

**All endpoints MUST:**
- ✅ Validate input
- ✅ Sanitize output
- ✅ Support pagination
- ✅ Implement rate limiting

### 3.3 Code Organization

- Controllers MUST be thin
- Services MUST contain business logic
- Dependency injection MUST be used



---

## 4. 🔐 Authentication & Session

### 4.1 JWT Requirements

**Authentication MUST:**
- ✅ Use JWT tokens
- ✅ Keep access tokens short-lived (15-30 min)
- ✅ Rotate refresh tokens
- ✅ Support token revocation

**Required JWT Claims:**
```
iss (issuer)
sub (subject/user ID)
aud (audience)
exp (expiration)
iat (issued at)
jti (JWT ID for revocation)
```

### 4.2 Multi-Factor Authentication

**MFA MUST be enforced for:**
- 🔒 Admin accounts
- 💰 Payout operations
- 🔑 Sensitive actions

### 4.3 Session Management

**Sessions MUST support:**
- ✅ Logout invalidation
- ✅ Device tracking
- ✅ Concurrent session limits





---

## 5. 🛂 Authorization & RBAC

### 5.1 Role-Based Access Control

**Required Roles:**
| Role | Permissions | Scope |
|------|-------------|-------|
| `user` | View, consume content | Personal |
| `creator` | Create, manage content | Personal + universe |
| `moderator` | Review, flag content | Universe |
| `admin` | Manage users, content | Platform |
| `super_admin` | Full access | Platform |

### 5.2 Enforcement Policy

- Server-side enforcement MUST
- Default policy: **DENY** (whitelist approach)
- All permission checks MUST be explicit

### 5.3 Audit & Logging

**All permission changes MUST be logged:**
- ✅ Role assignments
- ✅ Permission grants/revokes
- ✅ Access denials
- ✅ Timestamp & actor



---

## 6. 🌐 API Security

### 6.1 OWASP API Top 10 Compliance

**All APIs MUST comply with OWASP API Top 10:**

| Threat | Prevention | Status |
|--------|-----------|--------|
| Broken Object Level Authorization | Ownership checks | MUST |
| Rate abuse | Rate limiting | MUST |
| SSRF | URL validation | MUST |
| Data exposure | Encryption + sanitization | MUST |
| Injection attacks | Input validation | MUST |
| Broken authentication | JWT + MFA | MUST |
| Excessive data exposure | Field filtering | MUST |
| Mass assignment | Explicit field mapping | MUST |
| Logging & monitoring | Audit trails | MUST |
| Unsafe consumption | Validation | MUST |

### 6.2 Endpoint Requirements

**All endpoints MUST:**
- ✅ Require authentication (unless explicitly public)
- ✅ Enforce ownership checks
- ✅ Validate payload size (max 10MB)
- ✅ Implement rate limiting
- ✅ Return appropriate status codes





---

## 7. 🗄 Data Security

### 7.1 Data Storage

**Sensitive Data:**
- ✅ MUST be encrypted at rest (AES-256)
- ✅ MUST be encrypted in transit (TLS 1.3)
- ✅ Passwords MUST be hashed (bcrypt, Argon2)
- ❌ Passwords MUST NOT be encrypted (one-way only)

**Data Classification:**
| Level | Examples | Encryption |
|-------|----------|-----------|
| Public | Content, profiles | Optional |
| Internal | Logs, analytics | Recommended |
| Sensitive | Payments, PII | MUST |
| Secret | Keys, tokens | MUST |

### 7.2 Secrets Management

**Secrets MUST NOT exist in code:**
- ❌ No hardcoded API keys
- ❌ No credentials in git
- ❌ No secrets in environment files (committed)

**Use:**
- ✅ Environment variables (`.env.local`)
- ✅ Secret managers (AWS Secrets Manager, HashiCorp Vault)
- ✅ Encrypted configuration

### 7.3 Compliance & Audit

- Data access MUST be logged
- Data retention policy MUST exist
- Deletion MUST be auditable
- GDPR compliance MUST be maintained



---

## 8. 💰 Payments, Wallet & Rewards

### 8.1 Core Rules

**Pricing & Payments:**
- ❌ Prices MUST NOT be hardcoded
- ✅ Prices MUST be fetched from database
- ✅ Payments MUST use shared payment service
- ✅ All payment logic MUST be centralized

### 8.2 Payment Flow

**Every payment MUST include:**
1. ✅ Confirmation (user approval)
2. ✅ Processing (payment gateway)
3. ✅ Success (transaction recorded)
4. ✅ Failure (error handling + retry)

**Status Tracking:**
```
pending → processing → completed/failed
```

### 8.3 Security Requirements

**Server-side Verification MUST:**
- ✅ Verify amount matches
- ✅ Verify user authorization
- ✅ Verify transaction status
- ✅ Prevent double-charging

**Webhooks MUST:**
- ✅ Be cryptographically signed
- ✅ Be idempotent (safe to replay)
- ✅ Have timeout handling
- ✅ Log all events

### 8.4 Wallet & Ledger

**Wallet operations MUST be:**
- ✅ Atomic (all-or-nothing)
- ✅ Auditable (full history)
- ✅ Consistent (no race conditions)
- ✅ Reversible (refunds supported)

**Ledger entries MUST include:**
- Transaction ID
- User ID
- Amount
- Type (credit/debit)
- Reason
- Timestamp
- Status





---

## 9. 🎬 Media Security

### 9.1 Media Access Control

**Premium Media:**
- ✅ MUST use signed URLs (time-limited)
- ✅ URLs MUST expire (15-60 min)
- ✅ Storage paths MUST NOT be public
- ✅ Direct S3 access MUST be blocked

**Public Media:**
- ✅ Use CDN with caching
- ✅ Implement rate limiting
- ✅ Monitor bandwidth usage

### 9.2 Upload Security

**File Validation MUST:**
- ✅ Verify MIME type
- ✅ Check file size (max 500MB)
- ✅ Scan for malware (SHOULD)
- ✅ Validate file headers
- ✅ Reject executable files

**Allowed Types:**
| Type | Extensions | Max Size |
|------|-----------|----------|
| Image | jpg, png, webp | 50MB |
| Video | mp4, webm | 500MB |
| Audio | mp3, aac | 100MB |
| Document | pdf | 50MB |

### 9.3 Storage

- ✅ Use S3 with encryption
- ✅ Enable versioning
- ✅ Set lifecycle policies
- ✅ Enable access logging



---

## 10. 📊 Analytics

### 10.1 Event Naming

**Event names MUST use `snake_case`:**
```
✅ user_signup_completed
✅ content_view_started
✅ payment_processed
❌ userSignupCompleted
❌ ContentViewStarted
```

### 10.2 Required Events

**Every conversion funnel MUST track:**
| Stage | Event | Data |
|-------|-------|------|
| 1. View | `{action}_viewed` | user_id, timestamp |
| 2. Submit | `{action}_submitted` | user_id, data |
| 3. Success | `{action}_completed` | user_id, result |
| 4. Failure | `{action}_failed` | user_id, error |

**Examples:**
- `payment_viewed` → `payment_submitted` → `payment_completed`
- `content_viewed` → `content_liked` → `content_shared`

### 10.3 Data Privacy

**Analytics MUST NOT include:**
- ❌ Secrets or API keys
- ❌ Passwords or tokens
- ❌ PII (unless anonymized)
- ❌ Payment details

**All events MUST:**
- ✅ Be anonymizable
- ✅ Comply with GDPR
- ✅ Have retention policies



---

## 11. 🏢 Infrastructure Security

### 11.1 Network Security

**HTTPS/TLS:**
- ✅ HTTPS MUST be enforced (no HTTP)
- ✅ TLS 1.3 MUST be used
- ✅ HSTS MUST be enabled (min 1 year)
- ✅ Certificate pinning SHOULD be used

**Headers:**
```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### 11.2 Environment Separation

**Three environments MUST exist:**
| Environment | Purpose | Access |
|-------------|---------|--------|
| Development | Local testing | Developers |
| Staging | Pre-production | QA + Developers |
| Production | Live users | Restricted |

**Separation MUST include:**
- ✅ Separate databases
- ✅ Separate secrets
- ✅ Separate credentials
- ✅ Separate monitoring

### 11.3 Container Security

**Docker Images MUST:**
- ✅ Be scanned for vulnerabilities
- ✅ Use minimal base images
- ✅ Run as non-root user
- ✅ Have no hardcoded secrets

**Dependencies MUST:**
- ✅ Be audited regularly
- ✅ Have security patches applied
- ✅ Be pinned to specific versions
- ✅ Be checked for CVEs



---

## 12. 🧠 Secure Coding Practices

### 12.1 Input Validation

**All inputs MUST be validated:**
- ✅ Type checking
- ✅ Length limits
- ✅ Format validation (regex)
- ✅ Whitelist approach (not blacklist)

**Example:**
```typescript
// ✅ Good
const email = z.string().email().parse(input);

// ❌ Bad
const email = input; // No validation
```

### 12.2 Output Encoding

**All outputs MUST be encoded:**
- ✅ HTML encoding for web
- ✅ JSON encoding for APIs
- ✅ URL encoding for links
- ✅ SQL escaping for queries

### 12.3 SQL Injection Prevention

**MUST use:**
- ✅ Parameterized queries
- ✅ ORM (TypeORM, Prisma)
- ✅ Prepared statements

**MUST NOT use:**
- ❌ String concatenation
- ❌ Template literals with user input
- ❌ Dynamic SQL construction

### 12.4 Dangerous Functions

**MUST NOT use:**
- ❌ `eval()`
- ❌ `Function()` constructor
- ❌ `JSON.parse()` on untrusted data
- ❌ `pickle` or unsafe deserialization
- ❌ `exec()` or `system()` with user input

### 12.5 File Handling

**File operations MUST:**
- ✅ Validate MIME type
- ✅ Enforce size limits
- ✅ Scan for malware
- ✅ Store outside web root
- ✅ Use random filenames



---

## 13. 📡 Observability & Audit

### 13.1 Logging Requirements

**All logs MUST be structured (JSON):**
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

**Logging MUST include:**
- ✅ Timestamp (ISO 8601)
- ✅ Log level (DEBUG, INFO, WARN, ERROR)
- ✅ Trace ID (for request correlation)
- ✅ Service name
- ✅ User ID (when applicable)
- ✅ Request ID

### 13.2 Audit Logging

**Audit logs MUST be created for:**

| Event | Details | Retention |
|-------|---------|-----------|
| Authentication | Login, logout, MFA | 1 year |
| Payments | Amount, status, provider | 7 years |
| Admin actions | Changes, deletions | 2 years |
| Role changes | Old role, new role, actor | 2 years |
| Data access | User, resource, timestamp | 1 year |

**Audit logs MUST include:**
- ✅ Actor (who did it)
- ✅ Action (what was done)
- ✅ Resource (what was affected)
- ✅ Timestamp (when)
- ✅ Result (success/failure)
- ✅ IP address
- ✅ User agent

### 13.3 Monitoring & Alerts

**MUST monitor:**
- ✅ Error rates
- ✅ Response times
- ✅ Failed payments
- ✅ Failed authentications
- ✅ Rate limit violations
- ✅ Unusual access patterns



---

## 14. 🌍 Universe Rules

### 14.1 Independence

**Each universe MUST:**
- ✅ Have independent business logic
- ✅ Have independent UI/UX
- ✅ Have independent database schema
- ✅ Be independently deployable

### 14.2 Shared Services

**Shared services MUST be reused:**
- ✅ Authentication
- ✅ Payments
- ✅ Wallet
- ✅ Rewards
- ✅ Analytics

### 14.3 Prohibited Duplication

**MUST NOT duplicate:**
- ❌ Auth systems
- ❌ Payment systems
- ❌ Wallet logic
- ❌ User management

---

## 15. ✅ Pre-Merge Review Checklist

**MANDATORY - All items must be verified before merge:**

- [ ] Mobile responsive (tested on multiple devices)
- [ ] Error states handled (loading, empty, error, success)
- [ ] RBAC enforced (server-side authorization)
- [ ] Analytics added (events tracked)
- [ ] Rate limiting applied (if applicable)
- [ ] No duplicated logic (uses shared services)
- [ ] Secure media handled (signed URLs, expiration)
- [ ] Payment verified server-side (amount, user, status)
- [ ] Logs + audit present (structured logs, audit trail)
- [ ] Input validation (all user inputs validated)
- [ ] Output sanitization (all outputs encoded)
- [ ] No secrets in code (uses environment variables)
- [ ] Tests passing (unit + integration)
- [ ] Security scan passed (no vulnerabilities)
- [ ] Documentation updated (README, API docs)

---

## 16. 🚀 CI/CD Rules

**All deployments MUST:**
- ✅ Have PR review (minimum 1 approval)
- ✅ Have tests passing (100% coverage for critical paths)
- ✅ Have security scan passed (no high/critical vulnerabilities)
- ✅ Have rollback plan (documented)
- ✅ Have deployment checklist (verified)

**Deployment Process:**
1. Code review & approval
2. Automated tests pass
3. Security scan passes
4. Build succeeds
5. Deploy to staging
6. Smoke tests pass
7. Deploy to production
8. Monitor for errors

---

## 17. 🚫 NEVER DO

**These actions will result in immediate escalation:**

- ❌ Bypass shared services
- ❌ Trust frontend validation alone
- ❌ Hardcode pricing or permissions
- ❌ Expose secrets in code
- ❌ Skip logging or audit trails
- ❌ Deploy without error handling
- ❌ Store sensitive data unencrypted
- ❌ Use unsafe deserialization
- ❌ Trust user input without validation
- ❌ Deploy without monitoring

---

## 18. 🔒 Minimum Security Baseline

**These are NON-NEGOTIABLE for all deployments:**

| Requirement | Status | Verification |
|-------------|--------|--------------|
| JWT authentication | MUST | Token validation on all endpoints |
| MFA for sensitive actions | MUST | Admin, payouts, role changes |
| RBAC enforcement | MUST | Server-side authorization checks |
| Rate limiting | MUST | API rate limits configured |
| Secure media URLs | MUST | Signed URLs with expiration |
| Payment verification | MUST | Server-side amount/user verification |
| Audit logging | MUST | All sensitive actions logged |
| Encrypted backups | MUST | Database backups encrypted |
| Secret management | MUST | No secrets in code/git |
| Monitoring + alerts | MUST | Error rates, failed payments monitored |

---

## 19. 📌 Enforcement Policy

### Violation Consequences

| Violation Type | Severity | Action |
|---|---|---|
| MUST / MUST NOT violation | 🔴 Critical | BLOCK MERGE |
| SHOULD violation | 🟡 Warning | Requires written justification |
| Security violation | 🔴 Critical | Immediate escalation |
| Audit/logging violation | 🟡 Warning | Requires fix before merge |

### Escalation Process

1. **Automated Checks** - Security scan, tests, linting
2. **Code Review** - Manual review by team lead
3. **Security Review** - Security team review if flagged
4. **Escalation** - CTO/Security lead for critical issues

---

## 📞 Questions?

For clarification on any rule:
1. Check the relevant section above
2. Ask in #engineering-standards Slack channel
3. Escalate to security team if unclear

**Last Updated:** April 23, 2026  
**Version:** 1.0  
**Status:** Active & Enforced

