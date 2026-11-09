# Azeebo+ Documentation Hub

Welcome to the central documentation index for the Azeebo+ digital entertainment platform.

---

## 1. Architecture & Platform Overview

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Complete system architecture, service topology, and data isolation models
- [SERVICES.md](./SERVICES.md) - Comprehensive microservice catalog (29 services), database mapping, and endpoint specifications
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Developer onboarding, local environment setup, and development guidelines
- [AGENTS.md](./AGENTS.md) - Multi-agent AI engineering architecture, roles, and collaboration workflows
- [adr/](./adr/) - Architectural Decision Records (ADRs)

---

## 2. API & Integration Guides

- [API-DOCS.md](./API-DOCS.md) - General API specifications, authentication headers, and error envelopes
- [agbala-api.md](./agbala-api.md) - Agbala API integration documentation
- [openapi/](./openapi/) - OpenAPI / Swagger specifications and schemas
- [api/](./api/) - Additional API contract specifications

---

## 3. Engineering & Standards

- [CODE_STYLE.md](./CODE_STYLE.md) - Code style, TypeScript standards, naming conventions, and linting rules
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Git workflows, pull request conventions, and commit message guidelines
- [DEPRECATION_POLICY.md](./DEPRECATION_POLICY.md) - API and service deprecation policies and deprecation lifecycles
- [WORKFLOW_IDENTITIES.md](./WORKFLOW_IDENTITIES.md) - Service and workflow actor identities
- [engineering/](./engineering/) - Deep-dive engineering guides and service implementation notes
- [feature-flags-implementation.md](./feature-flags-implementation.md) - Feature flag architecture, rollout policies, and evaluation engines
- [feature-flag-rollout-policy.md](./feature-flag-rollout-policy.md) - Progressive rollout policies and safe release rings

---

## 4. Deployment, Operations & Security

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment procedures, environment configuration, and container topology
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Pre-release and go-live deployment checklist
- [MONITORING.md](./MONITORING.md) - Observability, metrics, OpenTelemetry, Prometheus, and alerting
- [secret-rotation.md](./secret-rotation.md) - Cryptographic key rotation and secret hygiene runbook
- [auth-device-link-rollout.md](./auth-device-link-rollout.md) - TV and mobile device cross-authentication linking architecture
- [archive-restore-runbook.md](./archive-restore-runbook.md) - Database backup, archiving, and disaster recovery procedures
- [runbooks/](./runbooks/) - Operational runbooks and incident response procedures
- [runbooks/social-auth-provider-credentials.md](./runbooks/social-auth-provider-credentials.md) - Google/Apple sign-in credential setup, verification, and rotation (staging)

---

## 5. Portals & Role Documentation

- [admin.md](./admin.md) - Platform admin portal specifications and governance
- [creators.md](./creators.md) - Creator portal features, monetization mechanisms, and payouts
- [USER-GUIDE.md](./USER-GUIDE.md) - User guide and client application navigation

---

## 6. Testing & Quality Assurance

- [qa/](./qa/) - QA plans, test matrices, and edge case checklists
- [testing/](./testing/) - Automated testing strategy (Unit, E2E, Contract, Load)
- [AUDITNOTES.md](./AUDITNOTES.md) - Historical security and architectural audit notes
- [audits/](./audits/) - Performance, security, and compliance audit reports
- [business-kpis.md](./business-kpis.md) - Platform business KPIs and measurement criteria
