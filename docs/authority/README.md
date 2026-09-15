# Authority Documentation

> Governance, architecture, and product master specifications for Azeebo+. These are the source-of-truth documents that other docs and task breakdowns derive from.

---

## Key Documents

| Document | ID | Purpose |
|----------|----|---------|
| [Technical Architecture Authority](technical-architecture-authority.md) | AZP-TAA-001 R2.0 | Domain-enforced technical architecture: service domains, atomic releases, supply-chain security, FinOps control |
| [Product Development & Deployment Master Authority](product-development-deployment-authority.md) | AZP-PDDMA-001 R1.0 | Evidence-gated product development, engineering, operations, commercialisation & deployment control |
| [Founding MVP Master PRD](founding-mvp-prd.md) | AZP-FMVP-PRD-001 R2.0 | Founding MVP scope: requirements, acceptance criteria, and engineering handoff |

## Task Breakdowns (`tasks/`)

Implementation task lists derived from AZP-TAA-001 R2.0, cross-referenced against
the actual codebase state. One file per discipline; each inherits its rules from
the parent authority doc.

| File | Area |
|------|------|
| [tasks-backend.md](tasks/tasks-backend.md) | 28 backend services across 6 service groups |
| [tasks-frontend.md](tasks/tasks-frontend.md) | Web, Mobile, Admin, Creator surfaces |
| [tasks-mobile.md](tasks/tasks-mobile.md) | Mobile app (Expo) specifics |
| [tasks-ai-ml.md](tasks/tasks-ai-ml.md) | AI/ML and intelligence services |
| [tasks-data.md](tasks/tasks-data.md) | Data & analytics |
| [tasks-infrastructure.md](tasks/tasks-infrastructure.md) | Infrastructure & deployment |
| [tasks-security.md](tasks/tasks-security.md) | Security & compliance |
| [tasks-sre.md](tasks/tasks-sre.md) | SRE, observability, SLOs, capacity, DR & incident |
| [tasks-testing.md](tasks/tasks-testing.md) | Testing strategy & coverage |
| [tasks-media.md](tasks/tasks-media.md) | Media pipeline & delivery |

## What Belongs Here

- **Do add:** new/updated master authority specs (BRD/PRD/TAA-class documents) and
  their official task breakdowns. Name authority docs by their AZP ID so traceability
  (`AZP-XXX-###_R#.#`) survives renames.
- **Don't add:** audit reports, session notes, or implementation guides — audits go
  to [`docs/audits/`](../audits/), and engineering how-tos go to
  [`docs/engineering/`](../engineering/).
