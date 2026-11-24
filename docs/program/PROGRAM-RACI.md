# Azeebo+ — Programme Governance & RACI Accountability Matrix

**Programme:** Azeebo+ Platform (Codename: **AZEEBO-PLUS**)  
**Document ID:** AZP-GOV-RACI-2026-v1.0  
**Effective Date:** Q4 2026  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md`, `pmr-task.md`, `pmr-todo.md`  
**Classification:** Internal — Governance & Execution Standard

---

## 1. Governance Structure & Named Ownership

PMR Finding §0.1 and Risk **R-01** identified: *“A programme of this size (29 services, 5 client surfaces, ~503K lines of TypeScript) is currently managed without a dated commitment or a named accountable owner on file.”*

This document defines the formal operational leadership roles, delegations, and accountability across the Azeebo+ estate.

| Function / Role | Accountable Entity / Individual | Scope & Delegation |
| :--- | :--- | :--- |
| **Executive Sponsor** | **VMNL — Board of Directors** | Platform ownership, capital allocation, statutory liability, and final Go/No-Go sign-off. |
| **Program Director / Lead Delivery Architect** | **Senior Director, Program Management & Systems Architecture** | Monorepo architecture, invariant CI gates, multi-service deployment, and change control. |
| **Technical Deputy Lead** | **Principal Systems Engineer (Designated Deputy)** | Dual-sign-off partner, money-path reviewer, and emergency architectural continuity (closes R-01). |
| **Core Platform Lead** | **Engineering Lead — Core Services** | Auth, Wallet, Payments, Content, Media, Search, and Gateway microservices. |
| **Web Engineering Lead** | **Lead Frontend Architect — Web** | Next.js 15 Consumer Web application (`apps/web`), SEO, SSR, and web performance. |
| **Mobile & TV Engineering Lead** | **Lead Mobile Architect** | Expo / React Native applications for iOS, Android (`apps/mobile`), and 10-foot TV (`apps/tv`). |
| **Creator & Admin Operations Lead** | **Engineering Lead — Tooling & Portals** | Standalone Vite+Nest portals for Admin (`apps/admin`) and Creator (`apps/creator`). |
| **Design Systems Lead** | **Head of Design Systems** | Token architecture, Vanta Black theme, WCAG 2.2 AA accessibility, and component libraries. |
| **QA & Test Automation Lead** | **Head of Quality Assurance** | Test suites, UAT execution, regression gates, and performance budgets. |
| **Site Reliability & DevOps Lead (SRE)** | **Lead SRE / DevOps Architect** | Kubernetes, Docker, PgBouncer, CI workflows, disaster recovery drills, and observability. |
| **Data Protection Officer & Legal** | **General Counsel / DPO** | Privacy compliance, DPIA, PII retention instrument, and statutory store declarations. |

---

## 2. RACI Accountability Matrix Across Workstreams

- **R (Responsible):** The role that performs the work.
- **A (Accountable):** The single role with ultimate ownership and veto power.
- **C (Consulted):** Domain experts whose input is required.
- **I (Informed):** Stakeholders updated on progress and outcomes.

| Workstream / Capability | Sponsor | Lead Arch | Deputy | Core Eng | Web/Mobile | SRE | QA | Design | Legal |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Core Architecture & Schemas** | I | **A** | R | R | C | C | C | I | I |
| **Financial Ledger & Money Paths** | I | **A** | R | R | C | C | R | I | C |
| **Payment Gateways & Settlement** | C | A | C | **R** | C | C | R | I | C |
| **Consumer Web Experience** | I | A | C | C | **R** | C | R | R | I |
| **Mobile iOS/Android Apps** | I | A | C | C | **R** | C | R | R | I |
| **TV 10-Foot Experience** | I | A | C | C | **R** | I | R | R | I |
| **Admin & Moderation Tooling** | I | A | C | C | **R** | C | R | C | C |
| **Creator Portal & Payouts** | I | A | C | C | **R** | C | R | C | C |
| **Design Tokens & Accessibility** | I | C | I | I | R | I | R | **A** | C |
| **CI/CD, Parity & DR Drills** | I | A | C | C | C | **R** | R | I | I |
| **External Penetration Testing** | C | A | C | R | R | **R** | R | I | C |
| **User Acceptance Testing (UAT)** | C | A | C | C | R | C | **R** | C | I |
| **Regulatory, PII & Store Disclosures** | C | C | I | I | R | I | I | I | **A** |
| **Production Traffic Cutover (Go/No-Go)** | **A** | R | R | R | R | R | R | R | R |

---

## 3. Bus Factor Mitigation Protocol (R-01 / D-10)

1. **Mandatory Dual-Review on Money Paths:** Pull requests modifying `services/core/wallet-service`, `services/core/payment-service`, or `services/gateway/api-gateway/src/modules/proxy` require approval from both the Lead Delivery Architect and the Technical Deputy.
2. **Architecture Handover Asset:** Recorded system walkthrough and transcript maintained in `docs/engineering/SYSTEM-WALKTHROUGH.md`.
3. **Escalation Path:** If the primary architect is unavailable, the Technical Deputy assumes temporary release authority for hotfixes.
