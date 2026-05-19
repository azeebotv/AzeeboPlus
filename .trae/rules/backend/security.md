# Azeebo+ Security Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Security Principles

### Core Security Rules

| Rule | Enforcement |
|------|-------------|
| JWT authentication | MUST |
| MFA for sensitive actions | MUST |
| RBAC enforcement | MUST |
| Rate limiting | MUST |
| Secure media URLs | MUST |
| Payment verification | MUST |
| Audit logging | MUST |
| Encrypted backups | MUST |
| Secret management | MUST |
| Monitoring + alerts | MUST |

---

## Authentication

### JWT Requirements

- Access tokens MUST be short-lived (15-30 min)
- Refresh tokens MUST be rotated
- Token revocation MUST be supported
- Token storage MUST be secure

**Required JWT Claims:**
```
iss (issuer)     - Who issued the token
sub (subject)    - User ID
aud (audience)   - Intended recipient
exp (expiration) - When token expires
iat (issued at)  - When token was created
jti (JWT ID)     - Unique identifier for revocation
```

### Multi-Factor Authentication

MFA MUST be enforced for:
- Admin accounts
- Payout operations
- Sensitive actions
- Password changes

### Session Management

- Session timeout after inactivity
- Device tracking
- Concurrent session limits
- Logout invalidation

---

## Authorization

### Role-Based Access Control

| Role | Permissions | Scope |
|------|-------------|-------|
| `user` | View, consume content | Personal |
| `creator` | Create, manage content | Personal + universe |
| `moderator` | Review, flag content | Universe |
| `admin` | Manage users, content | Platform |
| `super_admin` | Full access | Platform |
| `partner` | Sponsor access | Partner scope |
| `sponsor_manager` | Campaign management | Sponsor scope |

### Enforcement Policy

- Server-side enforcement MUST
- Default policy: DENY (whitelist approach)
- All permission checks MUST be explicit
- No client-side permission decisions

---

## Data Security

### Data Classification

| Level | Examples | Encryption |
|-------|----------|-----------|
| Public | Content, profiles | Optional |
| Internal | Logs, analytics | Recommended |
| Sensitive | Payments, PII | MUST |
| Secret | Keys, tokens | MUST |

### Encryption Requirements

- Data at rest: AES-256
- Data in transit: TLS 1.3
- Passwords: bcrypt or Argon2 (one-way only)
- No password encryption (use hashing)

### Secrets Management

- No hardcoded API keys
- No credentials in git
- Use environment variables (`.env.local`)
- Use secret managers (AWS Secrets Manager, HashiCorp Vault)

---

## API Security

### OWASP API Top 10 Compliance

| Threat | Prevention | Enforcement |
|--------|-----------|-------------|
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

### Endpoint Requirements

All endpoints MUST:
- Require authentication (unless explicitly public)
- Enforce ownership checks
- Validate payload size (max 10MB)
- Implement rate limiting
- Return appropriate status codes

---

## Input Validation

### Validation Rules

- All inputs MUST be validated
- Use type checking
- Enforce length limits
- Use format validation (regex)
- Use whitelist approach (not blacklist)

### Example

```typescript
// ✅ Good
const email = z.string().email().parse(input);
const userId = z.string().uuid().parse(input);
const amount = z.number().positive().max(1000000).parse(input);

// ❌ Bad
const email = input; // No validation
```

---

## Output Encoding

- HTML encoding for web
- JSON encoding for APIs
- URL encoding for links
- SQL escaping for queries

---

## SQL Injection Prevention

- Parameterized queries
- ORM (TypeORM, Prisma)
- Prepared statements

### Must NOT Use

- String concatenation
- Template literals with user input
- Dynamic SQL construction

---

## Dangerous Functions

### Must NOT Use

- `eval()`
- `Function()` constructor
- `JSON.parse()` on untrusted data
- `pickle` or unsafe deserialization
- `exec()` or `system()` with user input

---

## File Handling

### File Operations Must

- Validate MIME type
- Enforce size limits
- Scan for malware (SHOULD)
- Store outside web root
- Use random filenames

### Allowed File Types

| Type | Extensions | Max Size |
|------|-----------|----------|
| Image | jpg, png, webp | 50MB |
| Video | mp4, webm | 500MB |
| Audio | mp3, aac | 100MB |
| Document | pdf | 50MB |

---

## Media Security

### Premium Media

- MUST use signed URLs (time-limited)
- URLs MUST expire (15-60 min)
- Storage paths MUST NOT be public
- Direct S3 access MUST be blocked

### Public Media

- Use CDN with caching
- Implement rate limiting
- Monitor bandwidth usage

---

## Infrastructure Security

### Network Security

- HTTPS MUST be enforced (no HTTP)
- TLS 1.3 MUST be used
- HSTS MUST be enabled (min 1 year)
- Certificate pinning SHOULD be used

### Security Headers

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### Environment Separation

| Environment | Purpose | Access |
|-------------|---------|--------|
| Development | Local testing | Developers |
| Staging | Pre-production | QA + Developers |
| Production | Live users | Restricted |

---

## Logging & Audit

### Structured Logging

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

### Audit Events

| Event | Details | Retention |
|-------|---------|-----------|
| Authentication | Login, logout, MFA | 1 year |
| Payments | Amount, status, provider | 7 years |
| Admin actions | Changes, deletions | 2 years |
| Role changes | Old role, new role, actor | 2 years |
| Data access | User, resource, timestamp | 1 year |

### Audit Log Fields

- Actor (who did it)
- Action (what was done)
- Resource (what was affected)
- Timestamp (when)
- Result (success/failure)
- IP address
- User agent

---

## Monitoring & Alerts

### Must Monitor

- Error rates
- Response times
- Failed payments
- Failed authentications
- Rate limit violations
- Unusual access patterns

---

## Prohibited Actions

- Bypass shared services
- Trust frontend validation alone
- Hardcode pricing or permissions
- Expose secrets in code
- Skip logging or audit trails
- Deploy without error handling
- Store sensitive data unencrypted
- Use unsafe deserialization
- Trust user input without validation
- Deploy without monitoring