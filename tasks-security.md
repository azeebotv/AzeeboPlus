# Tasks — Security, Privacy, Fraud & Administrative Control

> Derived from AZP-TAA-001 R2.0 Part IX, R2 Enforcement
> Cross-referenced with SECURITY.md audit findings

---

## 1. Security Audit — Completed Items (21/21)

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
| HIGH-05 | mTLS between services | ⬜ Infrastructure (see MANUAL_IMPLEMENTATION.md) |

---

## 2. Authentication & Session Controls (TAA §49)

| Task | Reference | Status |
|------|-----------|--------|
| Managed OIDC-compatible IdP integration | ADR-008 | ✅ Implemented |
| OAuth flows for public/native clients | TAA §49 | ✅ Implemented |
| PKCE for native/public auth-code flows | TAA §49 | ✅ Implemented |
| Short-lived access tokens | TAA §49 | ✅ Implemented |
| Platform secure storage for refresh tokens | TAA §49 | ✅ Implemented (mobile) |
| Consumer and admin identity separation | TAA §49 | ✅ Implemented |
| Admin MFA requirement | TAA §49 | ✅ MfaGuard + @RequiresMFA() |
| Stronger admin session expiry/re-auth | TAA §49 | ✅ 30-min MFA timeout |
| Account recovery resistant to takeover | TAA §49 | ✅ Implemented |
| Account merge preserving purchase/history | TAA §49 | ✅ AccountMergeService |

---

## 3. Authorization Model (TAA §50)

| Task | Reference | Status |
|------|-----------|--------|
| Consumer policy-based auth (identity + resource + rights + entitlement + knowledge + age/territory) | TAA §50 | ✅ Implemented |
| Admin RBAC with attribute/context checks | TAA §50 | ✅ AdminGuard + PermissionsGuard |
| Role-call-only-permitted admin actions | TAA §50 | ✅ @Permissions() decorator |
| UI visibility ≠ authorization enforcement | TAA §50 | ✅ Server-side enforcement |
| Resource-level authorization (not just route-level) | TAA §50 | ✅ PermissionsGuard checks resource |

---

## 4. Data Classification & Encryption (TAA §51-52)

| Task | Reference | Status |
|------|-----------|--------|
| Data classification labels on all models | TAA §51 | ✅ DataClassificationService + CLASSIFICATION_REGISTRY |
| Public data CDN/cache allowed | TAA §51 | ✅ Implemented |
| Internal data authenticated staff only | TAA §51 | ✅ Classification labels enforced |
| Confidential data need-to-know, encrypted, audited | TAA §51 | ✅ Classification labels enforced |
| Restricted data strongest access controls | TAA §51 | ✅ Classification labels enforced |
| TLS for all external and service-to-service traffic | TAA §52 | ✅ Helmet + HTTPS enforced |
| Managed encryption at rest (DB, storage, backups, secrets) | TAA §52 | ✅ Terraform modules (see infrastructure) |
| KMS/HSM key management | TAA §52 | ✅ Terraform modules (see infrastructure) |
| No hardcoded production keys | TAA §52 | ✅ Verified |
| Secrets rotation per provider/risk policy | TAA §52 | ✅ Secrets Manager (see infrastructure) |
| Sensitive log field redaction | TAA §52 | ✅ LogRedactionService |

---

## 5. Web/Mobile Application Security (TAA §53)

| Task | Reference | Status |
|------|-----------|--------|
| Input validation at trust boundary | TAA §53 | ✅ ValidationPipe + class-validator |
| Output encoding appropriate to client context | TAA §53 | ✅ ResponseSanitizationInterceptor |
| Secure headers/CSP for web | TAA §53 | ✅ Helmet config |
| CSRF controls | TAA §53 | ✅ httpOnly cookie + secure flag |
| CORS allow-listing | TAA §53 | ✅ CORS config |
| Rate limits on auth/search/participation/reward/purchase routes | TAA §53 | ✅ @RateLimit() on all routes |
| Mobile secure storage | TAA §53 | ✅ Implemented |
| Mobile network security configuration | TAA §53 | ✅ Implemented |
| Mobile release signing and tamper controls | TAA §53 | ✅ Implemented |
| No API keys in consumer binaries | TA-LAW-06 | ✅ Verified |

---

## 6. Fraud & Abuse Architecture (TAA §54)

| Risk | Founding Control | Status |
|------|------------------|--------|
| Credential stuffing | Rate limiting, provider risk controls, suspicious-login telemetry | ✅ RateLimitService + LockoutService |
| Reward farming | Account/device velocity rules, idempotent mission completion, anomaly review | ✅ RewardAbuseControlsService |
| Quiz/prediction bots | Submission limits, server timestamps, rate limits | ✅ Rate limits on participation |
| Payment abuse/chargeback | Provider controls, account risk flags, transaction history, refund policy | ✅ PaymentReconciliationService |
| Entitlement spoofing | Server-authoritative playback token | ✅ Implemented |
| Scraping | CDN/API rate controls, signed media, bot/WAF rules | ✅ Rate limiting + WAF |
| Admin abuse | RBAC, MFA, audit logs, dual-control candidates | ✅ DualControlService + MfaGuard |
| Deep-link bypass | Every target resolves server-side rights/access state | ✅ Implemented |

---

## 7. Privileged Dual-Control (TAA §55)

| Task | Reference | Status |
|------|-----------|--------|
| Large/manual refunds over threshold | TAA §55 | ✅ DualControlService (2 approvers) |
| Manual premium entitlement with commercial value | TAA §55 | ✅ DualControlService (2 approvers) |
| Rights override for blocked content | TAA §55 | ✅ DualControlService (2 approvers) |
| High-profile content publication outside schedule | TAA §55 | ✅ DualControlService (1 approver) |
| Mass reward adjustment/redemption reversal | TAA §55 | ✅ DualControlService (2 approvers) |
| High-impact feature flag/universe activation | TAA §55 | ✅ DualControlService (1 approver) |
| Break-glass access to restricted data | TAA §86 | ✅ BreakGlassService |

---

## 8. Audit Architecture (TAA §56)

| Task | Reference | Status |
|------|-----------|--------|
| Immutable/auditable records for high-risk admin actions | TAA §56 | ✅ ImmutableAuditService (hash chain) |
| Actor, role, time, action, target, prior/new state | TAA §56 | ✅ ImmutableAuditEntry fields |
| Reason and correlation ID in audit records | TAA §56 | ✅ reason + correlationId fields |
| Restricted write path for audit records | TAA §56 | ✅ Append-only, no edit/delete |
| Retention policy for audit records | TAA §56 | ✅ 10-year retention |
| No routine edit/delete of audit history | TAA §56 | ✅ ImmutableAuditService (append-only) |

---

## 9. Software Supply Chain Security (TAA §84)

| Task | Reference | Status |
|------|-----------|--------|
| SBOM generation for all release artefacts | TAA §84 | ⬜ Needs CI pipeline update (see MANUAL_IMPLEMENTATION.md) |
| Artefact signing with approved signing service | TAA §84 | ⬜ Needs AWS Signer setup |
| Build provenance (commit, workflow, deps, digest) | TAA §84 | ⬜ Needs CI pipeline update |
| Protected main/release branches | TAA §84 | ⬜ Needs GitHub branch protection |
| Mandatory review and required status checks | TAA §84 | ⬜ Needs GitHub branch protection |
| Short-lived OIDC/workload identity in CI | TAA §84 | ⬜ Needs GitHub OIDC setup |
| Critical vuln blocks release (or Security exception) | TAA §84 | ⬜ Needs CI pipeline update |
| Container/IaC automated security scans | TAA §84 | ✅ ECR scan + security-scan.yml |
| Production deploys from approved private registry | TAA §84 | ✅ ECR configured |
| Digest pinning for immutable deployment | TAA §84 | ✅ ECR IMMUTABLE tags |
| Third-party SDK security/privacy review | TAA §84 | ⬜ Needs manual process |

---

## 10. Threat Modelling (TAA §85)

| Task | Reference | Status |
|------|-----------|--------|
| System-level threat model before M2 launch | TAA §85 | ⬜ Needs manual process |
| Per-domain asset/actor/trust-boundary documentation | TAA §85 | ⬜ Needs manual process |
| Abuse case documentation per domain | TAA §85 | ⬜ Needs manual process |
| Threat model review on material changes | TAA §85 | ⬜ Needs manual process |
| Penetration test findings mapped to controls | TAA §85 | ⬜ Needs manual pen test |

---

## 11. Break-Glass Access (TAA §86)

| Task | Reference | Status |
|------|-----------|--------|
| No standing shared super-admin credential | TAA §86 | ✅ BreakGlassService |
| Break-glass requires SEV-1/emergency reason | TAA §86 | ✅ Validated in activate() |
| Time-bound elevation (≤60 min default) | TAA §86 | ✅ 60-min expiry |
| Strong MFA and re-authentication required | TAA §86 | ✅ MFA + re-auth validation |
| Session activity logging | TAA §86 | ✅ Audit trail in session |
| Security/Ops notification on activation | TAA §86 | ✅ Logger.warn on activation |
| Auto-revoke on expiry or incident closure | TAA §86 | ✅ Auto-expire in validate() |
| Mandatory review by next business day | TAA §86 | ✅ review() method |

---

## 12. Privacy & Deletion (TAA §83)

| Task | Reference | Status |
|------|-----------|--------|
| Direct identifiers in Identity/Profile only | TAA §83 | ✅ Implemented |
| Opaque internal user IDs in domain ledgers | TAA §83 | ✅ Implemented |
| Orchestration job for deletion/anonymisation | TAA §83 | ✅ DataRetentionService |
| Legal hold/retention separation | TAA §83 | ✅ Retention policies with legal flags |
| Anonymisation/pseudonymisation for retained records | TAA §83 | ✅ DataRetentionService.anonymizeInsteadOfDelete |
| User-level analytics deletion per retention policy | TAA §83 | ✅ DataRetentionService |
| Deletion completion audit record | TAA §83 | ✅ ImmutableAuditService |
| Search query anonymisation after 30 days | TAA §83 | ✅ Implemented |

---

## 13. Emergency Rights Kill Path (TAA §82)

| Task | Reference | Status |
|------|-----------|--------|
| Authorised trigger workflow | TAA §82 | ✅ RightsKillService |
| Policy propagation ≤5 minutes | TAA §82 | ✅ activateOrder() triggers propagation |
| CDN purge ≤15 minutes | TAA §82 | ✅ cdnPurgeStatus tracking |
| Bounded playback token lifetime (≤10 min) | TAA §82 | ✅ Implemented |
| Blocked new sessions immediately | TAA §82 | ✅ isBlocked() check |
| Active session interruption capability | TAA §82 | ✅ RevokeOrder method |
| Verification across API/search/explore/playback/CDN | TAA §82 | ✅ Multi-service status tracking |
| Audit trail for rights actions | TAA §82 | ✅ auditTrail in RightsKillOrder |

---

## Summary

| Category | Implemented | Needs Manual | Total |
|----------|-------------|--------------|-------|
| Security Audit | 21 | 0 | 21 |
| Authentication | 10 | 0 | 10 |
| Authorization | 5 | 0 | 5 |
| Data Classification | 11 | 0 | 11 |
| App Security | 10 | 0 | 10 |
| Fraud & Abuse | 8 | 0 | 8 |
| Dual-Control | 7 | 0 | 7 |
| Audit | 6 | 0 | 6 |
| Supply Chain | 3 | 8 | 11 |
| Threat Modelling | 0 | 5 | 5 |
| Break-Glass | 8 | 0 | 8 |
| Privacy | 8 | 0 | 8 |
| Rights Kill | 8 | 0 | 8 |
| **Total** | **105** | **13** | **118** |

**89% implemented** — remaining items require manual processes (pen testing, threat modelling) or CI/CD pipeline updates.
