# Tasks — Security, Privacy, Fraud & Administrative Control

> Derived from AZP-TAA-001 R2.0 Part IX, R2 Enforcement
> Cross-referenced with SECURITY.md audit findings

---

## 1. Security Audit — Completed Items (20/21)

| ID | Issue | Status |
|----|-------|--------|
| CRIT-01 | CI check for placeholder secrets in .env files | ✅ Fixed |
| CRIT-02 | Virus scanning enabled by default | ✅ Fixed |
| HIGH-01 | ValidationPipe on all services | ✅ Already present |
| HIGH-02 | Social auth redirect URI validation | ✅ Fixed |
| HIGH-03 | Exponential backoff account lockout | ✅ Fixed |
| HIGH-04 | Constant-time session lookup | ✅ Fixed |
| MED-01 | Gateway validation pipe | ✅ Already present |
| MED-02 | CSRF httpOnly cookie | ✅ Fixed |
| MED-03 | CSRF Secure flag for staging | ✅ Fixed |
| MED-04 | WebSocket query string tokens removed | ✅ Fixed |
| MED-05 | Rate limiter critical logging | ✅ Fixed |
| MED-06 | Input sanitization (XSS prevention) | ✅ Fixed |
| MED-07 | CSP headers | ✅ Already present |
| MED-08 | Password reset token 15min + single-use | ✅ Fixed |
| MED-09 | Shell interpolation fix in entrypoint | ✅ Fixed |
| MED-10 | Superadmin role restrictions | ✅ Fixed |
| LOW-01 | X-Content-Type-Options verification test | ✅ Fixed |
| LOW-02 | Admin error URL sanitization | ✅ Fixed |
| LOW-03 | Audit logging for admin actions | ✅ Fixed |
| LOW-04 | Search query data retention | ✅ Fixed |
| LOW-07 | WebSocket origin validation | ✅ Fixed |
| HIGH-05 | mTLS between services | ⬜ Infrastructure (open) |

---

## 2. Authentication & Session Controls (TAA §49)

| Task | Reference | Status |
|------|-----------|--------|
| Managed OIDC-compatible IdP integration | ADR-008 | Partial |
| OAuth flows for public/native clients | TAA §49 | Partial |
| PKCE for native/public auth-code flows | TAA §49 | Needs verification |
| Short-lived access tokens | TAA §49 | ✅ Implemented |
| Platform secure storage for refresh tokens | TAA §49 | ✅ Implemented (mobile) |
| Consumer and admin identity separation | TAA §49 | ✅ Implemented |
| Admin MFA requirement | TAA §49 | Partial |
| Stronger admin session expiry/re-auth | TAA §49 | Needs implementation |
| Account recovery resistant to takeover | TAA §49 | Needs verification |
| Account merge preserving purchase/history | TAA §49 | Needs implementation |

---

## 3. Authorization Model (TAA §50)

| Task | Reference | Status |
|------|-----------|--------|
| Consumer policy-based auth (identity + resource + rights + entitlement + knowledge + age/territory) | TAA §50 | Partial |
| Admin RBAC with attribute/context checks | TAA §50 | Partial |
| Role-call-only-permitted admin actions | TAA §50 | Partial |
| UI visibility ≠ authorization enforcement | TAA §50 | Needs verification |
| Resource-level authorization (not just route-level) | TAA §50 | Partial |

---

## 4. Data Classification & Encryption (TAA §51-52)

| Task | Reference | Status |
|------|-----------|--------|
| Data classification labels on all models | TAA §51 | Needs implementation |
| Public data CDN/cache allowed | TAA §51 | ✅ Implemented |
| Internal data authenticated staff only | TAA §51 | Needs verification |
| Confidential data need-to-know, encrypted, audited | TAA §51 | Partial |
| Restricted data strongest access controls | TAA §51 | Partial |
| TLS for all external and service-to-service traffic | TAA §52 | Partial |
| Managed encryption at rest (DB, storage, backups, secrets) | TAA §52 | Needs implementation |
| KMS/HSM key management | TAA §52 | Needs implementation |
| No hardcoded production keys | TAA §52 | ✅ Verified |
| Secrets rotation per provider/risk policy | TAA §52 | Needs implementation |
| Sensitive log field redaction | TAA §52 | Partial |

---

## 5. Web/Mobile Application Security (TAA §53)

| Task | Reference | Status |
|------|-----------|--------|
| Input validation at trust boundary | TAA §53 | ✅ Implemented |
| Output encoding appropriate to client context | TAA §53 | Partial |
| Secure headers/CSP for web | TAA §53 | ✅ Implemented |
| CSRF controls | TAA §53 | ✅ Implemented |
| CORS allow-listing | TAA §53 | ✅ Implemented |
| Rate limits on auth/search/participation/reward/purchase routes | TAA §53 | Partial |
| Mobile secure storage | TAA §53 | ✅ Implemented |
| Mobile network security configuration | TAA §53 | Needs implementation |
| Mobile release signing and tamper controls | TAA §53 | Needs implementation |
| No API keys in consumer binaries | TA-LAW-06 | ✅ Verified |

---

## 6. Fraud & Abuse Architecture (TAA §54)

| Risk | Founding Control | Status |
|------|------------------|--------|
| Credential stuffing | Rate limiting, provider risk controls, suspicious-login telemetry | Partial |
| Reward farming | Account/device velocity rules, idempotent mission completion, anomaly review | Partial |
| Quiz/prediction bots | Submission limits, server timestamps, rate limits | Partial |
| Payment abuse/chargeback | Provider controls, account risk flags, transaction history, refund policy | Partial |
| Entitlement spoofing | Server-authoritative playback token | Partial |
| Scraping | CDN/API rate controls, signed media, bot/WAF rules | Partial |
| Admin abuse | RBAC, MFA, audit logs, dual-control candidates | Partial |
| Deep-link bypass | Every target resolves server-side rights/access state | Partial |

---

## 7. Privileged Dual-Control (TAA §55)

| Task | Reference | Status |
|------|-----------|--------|
| Large/manual refunds over threshold | TAA §55 | Needs implementation |
| Manual premium entitlement with commercial value | TAA §55 | Needs implementation |
| Rights override for blocked content | TAA §55 | Needs implementation |
| High-profile content publication outside schedule | TAA §55 | Needs implementation |
| Mass reward adjustment/redemption reversal | TAA §55 | Needs implementation |
| High-impact feature flag/universe activation | TAA §55 | Needs implementation |
| Break-glass access to restricted data | TAA §86 | Needs implementation |

---

## 8. Audit Architecture (TAA §56)

| Task | Reference | Status |
|------|-----------|--------|
| Immutable/auditable records for high-risk admin actions | TAA §56 | Partial |
| Actor, role, time, action, target, prior/new state | TAA §56 | Partial |
| Reason and correlation ID in audit records | TAA §56 | Partial |
| Restricted write path for audit records | TAA §56 | Needs implementation |
| Retention policy for audit records | TAA §56 | Needs implementation |
| No routine edit/delete of audit history | TAA §56 | Needs verification |

---

## 9. Software Supply Chain Security (TAA §84)

| Task | Reference | Status |
|------|-----------|--------|
| SBOM generation for all release artefacts | TAA §84 | Needs implementation |
| Artefact signing with approved signing service | TAA §84 | Needs implementation |
| Build provenance (commit, workflow, deps, digest) | TAA §84 | Needs implementation |
| Protected main/release branches | TAA §84 | Needs verification |
| Mandatory review and required status checks | TAA §84 | Needs verification |
| Short-lived OIDC/workload identity in CI | TAA §84 | Needs implementation |
| Critical vuln blocks release (or Security exception) | TAA §84 | Needs implementation |
| Container/IaC automated security scans | TAA §84 | Needs implementation |
| Production deploys from approved private registry | TAA §84 | Needs implementation |
| Digest pinning for immutable deployment | TAA §84 | Needs implementation |
| Third-party SDK security/privacy review | TAA §84 | Needs implementation |

---

## 10. Threat Modelling (TAA §85)

| Task | Reference | Status |
|------|-----------|--------|
| System-level threat model before M2 launch | TAA §85 | Needs implementation |
| Per-domain asset/actor/trust-boundary documentation | TAA §85 | Needs implementation |
| Abuse case documentation per domain | TAA §85 | Needs implementation |
| Threat model review on material changes | TAA §85 | Needs implementation |
| Penetration test findings mapped to controls | TAA §85 | Needs implementation |

---

## 11. Break-Glass Access (TAA §86)

| Task | Reference | Status |
|------|-----------|--------|
| No standing shared super-admin credential | TAA §86 | Needs implementation |
| Break-glass requires SEV-1/emergency reason | TAA §86 | Needs implementation |
| Time-bound elevation (≤60 min default) | TAA §86 | Needs implementation |
| Strong MFA and re-authentication required | TAA §86 | Needs implementation |
| Session activity logging | TAA §86 | Needs implementation |
| Security/Ops notification on activation | TAA §86 | Needs implementation |
| Auto-revoke on expiry or incident closure | TAA §86 | Needs implementation |
| Mandatory review by next business day | TAA §86 | Needs implementation |

---

## 12. Privacy & Deletion (TAA §83)

| Task | Reference | Status |
|------|-----------|--------|
| Direct identifiers in Identity/Profile only | TAA §83 | Partial |
| Opaque internal user IDs in domain ledgers | TAA §83 | Partial |
| Orchestration job for deletion/anonymisation | TAA §83 | Partial |
| Legal hold/retention separation | TAA §83 | Needs implementation |
| Anonymisation/pseudonymisation for retained records | TAA §83 | Needs implementation |
| User-level analytics deletion per retention policy | TAA §83 | Partial |
| Deletion completion audit record | TAA §83 | Needs implementation |
| Search query anonymisation after 30 days | TAA §83 | ✅ Implemented |

---

## 13. Emergency Rights Kill Path (TAA §82)

| Task | Reference | Status |
|------|-----------|--------|
| Authorised trigger workflow | TAA §82 | Needs implementation |
| Policy propagation ≤5 minutes | TAA §82 | Needs implementation |
| CDN purge ≤15 minutes | TAA §82 | Needs implementation |
| Bounded playback token lifetime (≤10 min) | TAA §82 | Partial |
| Blocked new sessions immediately | TAA §82 | Needs implementation |
| Active session interruption capability | TAA §82 | Needs implementation |
| Verification across API/search/explore/playback/CDN | TAA §82 | Needs implementation |
| Audit trail for rights actions | TAA §82 | Needs implementation |
