# Product Documentation

> Product specs, PRDs, user stories, and feature requirements for Azeebo+.

---

## Structure

```
docs/product/
├── README.md              # This file
├── universe-specs/        # Per-universe product specifications
│   ├── reality.md
│   ├── creator.md
│   ├── lifestyle.md
│   ├── vertical.md
│   ├── movie.md
│   ├── games.md
│   ├── comedy.md
│   └── sports.md
├── shared/                # Shared platform specs
│   ├── auth.md
│   ├── wallet.md
│   ├── notifications.md
│   ├── rewards.md
│   └── search.md
└── analytics/             # Analytics event definitions
    └── events.md
```

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Master Platform Pack | `doc/AZEEBO MODULAR APP (1).md` | Full platform vision, BRD, PRD |
| Claude Build Playbook | `doc/AZEEBO CLAUDE BUILD (1).md` | Engineering playbook and prompt library |
| Architecture | `ARCHITECTURE.md` | System architecture |
| Services Catalog | `SERVICES.md` | All services and their contracts |

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
