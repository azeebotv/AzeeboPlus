# Product Documentation

> Product specs, PRDs, user stories, and feature requirements for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Master Platform Pack | `../legacy/azeebo-modular-app.md` | Full platform vision, BRD, PRD, design blueprint |
| Claude Build Playbook | `../legacy/azeebo-claude-build.md` | Engineering playbook and prompt library |
| Architecture | `../../ARCHITECTURE.md` | System architecture |
| Services Catalog | `../SERVICES.md` | All services and their contracts |
| Creator Dashboard Plan | `creators.md` | Creator portal implementation plan |
| Admin Dashboard Plan | `admin.md` | Admin portal implementation plan |
| Agbala API Reference | `../agbala-api.md` | Agbala storyworld API endpoints |
| Launch Tasks & Scorecard | `../program/pmr-task.md` | Master task plan, workstreams, and launch scorecard |
| Feature Flags | `../../packages/feature-flags/` | Redis-backed feature flag system |
| Geo Restriction | `../../services/core/content-service/prisma/schema.prisma` | Content geo restriction schema |
| Device Limits | `../../services/engagement/subscription-service/prisma/schema.prisma` | Subscription device limits |

## Universe Product Specs

Universe product definitions are in the Master Platform Pack (`../legacy/azeebo-modular-app.md`), Sections 13 (Universe Annexes A-I).

| Universe | Annex | Status |
|----------|-------|--------|
| Foundation | Annex A | Implemented |
| Reality | Annex B | Complete (backend + mobile + web + analytics) |
| Creator | Annex C | Complete (backend + standalone portal + mobile + web) |
| Lifestyle | Annex D | Complete (backend + mobile + web + analytics) |
| Vertical | Annex E | Complete (backend + Agbala mobile + web + analytics) |
| Movie | Annex F | Complete (backend + mobile + web + analytics) |
| Games | Annex G | Complete (backend + mobile + web + analytics) |
| Comedy | Annex H | Complete (backend + mobile + web + analytics) |
| Sports | Annex I | Complete (backend + mobile + web + analytics) |

## Writing Specs

When writing a new spec, follow this template:

```markdown
# [Feature Name]

## Problem
What problem does this solve?

## User Stories
- As a [user], I want to [action] so that [benefit]

## Requirements
### Functional
- [ ] Requirement 1
- [ ] Requirement 2

### Non-Functional
- Performance: [target]
- Scalability: [target]

## User Flows
1. Step 1 → Step 2 → Step 3

## API Requirements
| Method | Endpoint | Description |
|--------|----------|-------------|

## Analytics Events
| Event | Trigger | Properties |
|-------|---------|------------|

## Admin Requirements
- [ ] Admin tool 1

## Success Metrics
- Metric 1: [target]
- Metric 2: [target]

## Risks
- Risk 1: [mitigation]
```
