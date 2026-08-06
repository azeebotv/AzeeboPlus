# Azeebo+ Agent Architecture

> AI-assisted development agents for the Azeebo+ platform.

---

## Overview

Azeebo+ uses a multi-agent system where each agent specializes in a specific phase of the software development lifecycle. Agents are designed to work independently or in sequence, following the platform's architectural patterns and coding standards.

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Pipeline                         │
│                                                           │
│  Product    →   Design      →   Engineer   →   QA        │
│  Architect     Translator      Agent          Analyst     │
│                                                           │
│  (Ideas)       (Specs)        (Code)         (Quality)   │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Registry

| Agent | File | Purpose |
|-------|------|---------|
| Product Architect | `.claude/agents/product-architect.md` | Convert ideas into structured PRDs |
| Design Translator | `.claude/agents/design-translator.md` | Convert design intent into component specs |
| Engineer | `.claude/agents/engineer.md` | Generate code following platform patterns |
| QA Analyst | `.claude/agents/qa-analyst.md` | Generate test plans and quality reports |

---

## Agent Definitions

### 1. Product Architect

**File:** `.claude/agents/product-architect.md`

**Role:** Converts business ideas, feature requests, and strategic goals into engineering-ready specifications.

**When to Use:**
- New feature requested
- Business requirement needs technical spec
- Universe expansion (new show, game, etc.)
- Monetization feature design

**Output:** Structured PRD with:
- Problem statement
- User stories with acceptance criteria
- API requirements
- Database entities
- Analytics events
- Admin requirements
- Risks and dependencies

**Example:**
```
Use the Product Architect agent to spec out a "Predict & Win" feature for the Reality universe where users predict elimination outcomes and earn rewards.
```

---

### 2. Design Translator

**File:** `.claude/agents/design-translator.md`

**Role:** Converts Figma frames, wireframes, and design intent into component specifications and screen logic.

**When to Use:**
- Figma designs ready for implementation
- New screen or component needed
- Interaction flow design
- Component inventory required

**Output:** Screen spec with:
- Layout description
- Component inventory (reuse vs new)
- State definitions (loading, empty, error, success)
- Interaction flows
- Analytics event mapping

**Example:**
```
Use the Design Translator agent to convert the Reality voting screen Figma into a component spec with all states and interactions.
```

---

### 3. Engineer

**File:** `.claude/agents/engineer.md`

**Role:** Generates TypeScript code following Azeebo+ architectural patterns.

**When to Use:**
- Building new screens (mobile/web)
- Creating API endpoints
- Adding Prisma schemas
- Writing unit tests
- Refactoring duplicated code

**Output:** Production-ready code with:
- NestJS controllers, services, modules
- React Native/Next.js screens with all states
- Prisma migrations
- Unit tests
- Analytics event calls

**Example:**
```
Use the Engineer agent to implement the Reality voting screen with all states, analytics, and backend endpoint.
```

---

### 4. QA Analyst

**File:** `.claude/agents/qa-analyst.md`

**Role:** Generates test plans, identifies edge cases, and produces quality reports.

**When to Use:**
- Feature complete, needs QA review
- Payment flow implementation
- Pre-release quality check
- Edge case identification

**Output:** Quality report with:
- Test plan (happy path + edge cases)
- Payment safety checklist
- Analytics verification
- Code quality audit
- Accessibility checks
- Performance considerations

**Example:**
```
Use the QA Analyst agent to review the Reality voting flow for payment safety and edge cases.
```

---

## Agent Collaboration Patterns

### Pattern 1: New Feature Pipeline

```
1. Product Architect → Creates PRD
2. Design Translator → Creates screen spec
3. Engineer → Implements code
4. QA Analyst → Reviews quality
```

### Pattern 2: Bug Fix

```
1. QA Analyst → Identifies root cause
2. Engineer → Fixes the bug
3. QA Analyst → Verifies fix
```

### Pattern 3: Refactoring

```
1. Engineer → Identifies duplication
2. Engineer → Moves to shared package
3. QA Analyst → Verifies no regressions
```

### Pattern 4: Universe Expansion

```
1. Product Architect → Specs universe feature
2. Design Translator → Designs UI components
3. Engineer → Builds service + screens
4. QA Analyst → Full quality pass
```

---

## Using Agents

### Direct Invocation

```
# Instruct MiMoCode to use a specific agent:
"Use the Product Architect agent to spec a new comedy challenge feature."

# Or reference the agent file directly:
"Read .claude/agents/engineer.md and implement the voting screen."
```

### With Skills

Agents work alongside skills. Use skills for specific tasks within an agent's workflow:

```
1. Product Architect creates PRD
2. Use /build-screen to implement each screen
3. Use /add-analytics to instrument events
4. Use /qa-pass to verify quality
5. Use /prepare-pr to create the PR
```

### In CLAUDE.md

Reference agents in your development workflow:

```markdown
## Development Workflow

1. **Spec Phase:** Use Product Architect agent
2. **Design Phase:** Use Design Translator agent
3. **Implementation:** Use Engineer agent + skills
4. **Quality:** Use QA Analyst agent + /qa-pass skill
```

---

## Agent Context Files

Each agent reads specific context files:

| Agent | Context Files |
|-------|--------------|
| Product Architect | `CLAUDE.md`, `ARCHITECTURE.md`, `SERVICES.md` |
| Design Translator | `CLAUDE.md`, `packages/design-tokens`, `packages/ui` |
| Engineer | `CLAUDE.md`, `ARCHITECTURE.md`, `SERVICES.md` |
| QA Analyst | `CLAUDE.md`, `ARCHITECTURE.md` |

---

## Adding New Agents

To add a new agent:

1. Create `.claude/agents/[agent-name].md`
2. Follow the structure:
   - Role description
   - Context section
   - Capabilities list
   - Output format
   - Rules
3. Add to the Agent Registry above
4. Reference in `CLAUDE.md` if it's a primary workflow

---

## Best Practices

1. **One agent per phase** — Don't mix concerns
2. **Pass context between agents** — Each agent should read relevant docs
3. **Use skills for tasks** — Agents define roles, skills define actions
4. **Review agent output** — AI-generated specs need human review
5. **Keep agents focused** — One clear purpose per agent
