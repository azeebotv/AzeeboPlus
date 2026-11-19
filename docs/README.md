# Azeebo+ Documentation Hub

Welcome to the central documentation index for the Azeebo+ digital entertainment platform.

---

## 1. Programme Management & Governance (Launch Authority)

- [program/AZEEBO-PMR-2026-11-04.md](./program/AZEEBO-PMR-2026-11-04.md) - Authoritative Project Management Report (PMR W45)
- [program/pmr-task.md](./program/pmr-task.md) - Master PMR Task Plan (10 Workstreams, 100% verified)
- [program/pmr-todo.md](./program/pmr-todo.md) - Master Remediation Checklist & Go/No-Go Gate verification
- [program/PROGRAM-RACI.md](./program/PROGRAM-RACI.md) - Programme RACI Matrix with named accountable owners
- [program/DECISION-LOG.md](./program/DECISION-LOG.md) - Executive Steering Committee Decisions (D-01 through D-10)
- [program/SCOPE-CHANGE-LEDGER.md](./program/SCOPE-CHANGE-LEDGER.md) - Formal Scope Change Control Ledger (SC-01 through SC-15)

---

## 2. Architecture & Platform Overview

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Complete system architecture, service topology, and data isolation models
- [SERVICES.md](./SERVICES.md) - Comprehensive microservice catalog (29 services), database mapping, and endpoint specifications
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Developer onboarding, local environment setup, and development guidelines
- [AGENTS.md](./AGENTS.md) - Multi-agent AI engineering architecture, roles, and collaboration workflows
- [adr/](./adr/) - Architectural Decision Records (ADRs)
- [architecture/CREATOR-DB-SPLIT-PLAN.md](./architecture/CREATOR-DB-SPLIT-PLAN.md) - Post-launch `azeebo_creator` co-tenancy separation plan

---

## 3. Commercial & Regulatory Compliance

- [compliance/PENETRATION-TEST-REPORT-2026.md](./compliance/PENETRATION-TEST-REPORT-2026.md) - Third-party penetration test report (0 Critical, 0 High)
- [compliance/PII-RETENTION-POLICY.md](./compliance/PII-RETENTION-POLICY.md) - NDPR/GDPR PII retention policy instrument
- [compliance/DPIA-ASSESSMENT.md](./compliance/DPIA-ASSESSMENT.md) - Data Protection Impact Assessment
- [compliance/ACCESSIBILITY-CONFORMANCE-STATEMENT.md](./compliance/ACCESSIBILITY-CONFORMANCE-STATEMENT.md) - WCAG 2.2 Level AA / VPAT accessibility conformance statement
- [commercial/PRICE-BOOK-2026.md](./commercial/PRICE-BOOK-2026.md) - Official NGN and USD price book across tiers and universes
- [commercial/APP-STORE-SUBMISSION-PACK.md](./commercial/APP-STORE-SUBMISSION-PACK.md) - EAS build profiles, Apple Privacy Manifests, and Google Play Data Safety pack

---

## 4. API & Integration Guides

- [API-DOCS.md](./API-DOCS.md) - General API specifications, authentication headers, and error envelopes
- [agbala-api.md](./agbala-api.md) - Agbala API integration documentation
- [openapi/](./openapi/) - OpenAPI / Swagger specifications and schemas
- [api/](./api/) - Additional API contract specifications

---

## 5. Design System & Creative Direction

- [design/design-system-tokens-spec.md](./design/design-system-tokens-spec.md) - Vanta Black palette, Flame gradient, and token scales
- [design/route-inventory-and-screen-specs.md](./design/route-inventory-and-screen-specs.md) - Complete cross-surface route inventory
- [design/figma-azeebo-screen-spec.md](./design/figma-azeebo-screen-spec.md) - Screen specifications and Figma mappings
- [design/ui-ux-implementation-status-report.md](./design/ui-ux-implementation-status-report.md) - Component state matrix and usability status

---

## 6. Engineering, Standards & Security

- [CODE_STYLE.md](./CODE_STYLE.md) - Code style, TypeScript standards, naming conventions, and linting rules
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Git workflows, pull request conventions, and commit message guidelines
- [DEPRECATION_POLICY.md](./DEPRECATION_POLICY.md) - API and service deprecation policies and lifecycles
- [WORKFLOW_IDENTITIES.md](./WORKFLOW_IDENTITIES.md) - Service and workflow actor identities
- [engineering/SYSTEM-WALKTHROUGH.md](./engineering/SYSTEM-WALKTHROUGH.md) - System architecture walkthrough and bus-factor mitigation
- [engineering/MANUAL_IMPLEMENTATION.md](./engineering/MANUAL_IMPLEMENTATION.md) - Security controls implementation guide (mTLS, SBOM, artefact signing)
- [engineering/MANUAL_STEPS.md](./engineering/MANUAL_STEPS.md) - Cloud infrastructure setup procedures (read replicas, monitoring)
- [feature-flags-implementation.md](./feature-flags-implementation.md) - Feature flag architecture and evaluation engines
- [feature-flag-rollout-policy.md](./feature-flag-rollout-policy.md) - Progressive rollout policies and safe release rings

---

## 7. Deployment, Operations & Runbooks

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment procedures, environment configuration, and container topology
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Pre-release and go-live deployment checklist
- [operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md](./operations/PRODUCTION-CUTOVER-AND-ROLLBACK-REHEARSAL.md) - Cutover protocol and <15 min rollback rehearsal
- [operations/DR-RESTORE-DRILL-REPORT-2026.md](./operations/DR-RESTORE-DRILL-REPORT-2026.md) - Disaster recovery restore drill report (RTA 42m, RPO 0s)
- [operations/HYPERCARE-LAUNCH-RUNBOOK.md](./operations/HYPERCARE-LAUNCH-RUNBOOK.md) - 72-hour 24/7 on-call escalation rotation and incident procedures
- [operations/BUDGET-BASELINE.md](./operations/BUDGET-BASELINE.md) - Production cloud capex and opex baseline
- [operations/SLOW-QUERY-REPORT.md](./operations/SLOW-QUERY-REPORT.md) - Database query performance and index audit
- [MONITORING.md](./MONITORING.md) - Observability, metrics, OpenTelemetry, Prometheus, and alerting
- [secret-rotation.md](./secret-rotation.md) - Cryptographic key rotation and secret hygiene runbook
- [auth-device-link-rollout.md](./auth-device-link-rollout.md) - TV and mobile device cross-authentication linking architecture
- [archive-restore-runbook.md](./archive-restore-runbook.md) - Database backup, archiving, and disaster recovery procedures
- [runbooks/social-auth-provider-credentials.md](./runbooks/social-auth-provider-credentials.md) - Google/Apple sign-in credential setup, verification, and rotation (Staging & Production)
- [runbooks/database-connection-pool.md](./runbooks/database-connection-pool.md) - PgBouncer connection pooling triage
- [runbooks/high-error-rate.md](./runbooks/high-error-rate.md) - High error rate troubleshooting
- [runbooks/service-down.md](./runbooks/service-down.md) - Service outage remediation

---

## 8. Testing, Quality Assurance & Historical Audits

- [qa/UAT-PLAN-AND-TEST-SCRIPTS.md](./qa/UAT-PLAN-AND-TEST-SCRIPTS.md) & [qa/UAT-DEFECT-LOG.md](./qa/UAT-DEFECT-LOG.md) - User Acceptance Testing plan, scripts, and defect log
- [qa/LIVE-PAYMENT-PROOF.md](./qa/LIVE-PAYMENT-PROOF.md) - Live payment cycle verification record
- [qa/cross-surface-evidence-matrix.md](./qa/cross-surface-evidence-matrix.md) - Cross-surface route and contrast evidence matrix
- [testing/manual-testing-checklist.md](./testing/manual-testing-checklist.md) - Manual testing procedures
- [testing/performance-baselines.md](./testing/performance-baselines.md) - Performance benchmarks and thresholds
- [audits/](./audits/) - Point-in-time security, performance, and contract audit records
