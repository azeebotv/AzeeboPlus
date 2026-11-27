# Azeebo+ Claude Build Playbook

> **Platform:** Azeebo+ by VMNL
> **Purpose:** Standardize how VMNL uses Claude to design, build, scale, and maintain the Azeebo+ platform
> **Philosophy:** *AI as Execution Engine. Humans as Strategy & Judgment.*

---

## Table of Contents

1. [Operating Model](#1-operating-model)
2. [Build Sequence](#2-build-sequence)
3. [Repo Structure](#3-repo-structure)
4. [Claude Setup](#4-claude-setup)
5. [Prompt System](#5-prompt-system)
6. [Prompt Templates](#6-prompt-templates)
7. [Universe Task Breakdown](#7-universe-task-breakdown)
8. [Shared Services](#8-shared-services)
9. [MCP Connections](#9-mcp-connections)
10. [Automation Workflows](#10-automation-workflows)
11. [Cost Control & Performance](#11-cost-control--performance)
12. [QA Checklist](#12-qa-checklist)
13. [Weekly Workflow](#13-weekly-workflow)
14. [First 10 Prompts](#14-first-10-prompts)
15. [Mistakes to Avoid](#15-mistakes-to-avoid)
16. [Final Recommendation](#16-final-recommendation)

---

## 1. Operating Model

Use Claude in four lanes:

| Lane | Focus | Output |
|------|-------|--------|
| **A — Product Architecture** | Turn the Azeebo+ memo into | PRDs, user stories, acceptance criteria, API contracts, analytics maps, admin requirements |
| **B — Design-to-Code** | Convert Figma handoff into | Component inventories, screen scaffolds, interaction specs |
| **C — Repo Development** | Generate inside the real codebase | Modules, services, tests, migrations, refactors |
| **D — QA & Release** | Generate quality artifacts | Test plans, regression suites, edge-case matrices, PR review notes, release summaries |

> **Core rule:** Do not ask Claude to "build the whole app." Build one bounded layer at a time.

---

## 2. Build Sequence

Build in this order:

1. **Shared shell** — navigation, auth, wallet, rewards, notifications
2. **Auth, profile, wallet, rewards** — core identity and monetization
3. **Reality Universe** — first engagement + monetization engine
4. **Creator Universe** — supply + creator earnings
5. **Lifestyle Universe** — daily relevance
6. **Games Universe** — frequency + repeat play
7. **Comedy Universe** — virality + mass reach
8. **Sports Universe** — passion + prediction
9. **Vertical Universe** — premium IP + fandom
10. **Movie Universe** — premium transactions

This sequence: **habit → participation → daily relevance → repeat loops → premium depth**.

---

## 3. Repo Structure

Use a modular monorepo so Claude can reason cleanly across the platform.

```
azeebo-plus/
├── apps/                              # Client applications & backend APIs
│   ├── mobile/                        # Expo React Native app
│   ├── web/                           # Next.js web app
│   ├── admin/                         # Admin Dashboard (NextJS)
│   └── creator/                # Creator Portal (NextJS)
│
├── services/                          # Backend microservices (categorized)
│   ├── core/                          # Essential platform services
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   ├── wallet-service/
│   │   ├── payment-service/
│   │   ├── content-service/
│   │   ├── search-service/
│   │   └── media-service/
│   │
│   ├── universes/                     # Universe-specific business logic
│   │   ├── reality-service/
│   │   ├── creator-service/
│   │   ├── lifestyle-service/
│   │   ├── vertical-service/
│   │   ├── movie-service/
│   │   ├── games-service/
│   │   ├── comedy-service/
│   │   └── sports-service/
│   │
│   ├── engagement/                    # User interaction services
│   │   ├── notification-service/
│   │   ├── reward-service/
│   │   ├── referral-service/
│   │   ├── messaging-service/
│   │   ├── engagement-service/
│   │   └── subscription-service/
│   │
│   ├── operations/                    # Platform operations
│   │   ├── moderation-service/
│   │   ├── queue-service/
│   │   └── support-service/
│   │
│   ├── intelligence/                  # Data & analytics
│   │   ├── analytics-service/
│   │   └── recommendation-service/
│   │
│   └── gateway/                       # API gateway & routing
│       └── api-gateway/
│
├── packages/                          # Shared code libraries
│   ├── ui/                            # Reusable UI components
│   ├── design-tokens/                 # Design system tokens
│   ├── shared-types/                  # TypeScript type definitions
│   ├── utils/                         # Utility functions
│   ├── api-client/                    # API client libraries
│   ├── analytics-sdk/                 # Analytics tracking SDK
│   ├── auth/                          # Auth utilities
│   ├── security/                      # Security (CORS, rate limiting, guards)
│   ├── validation/                    # Validation utilities
│   ├── error-handling/                # Error handling
│   ├── logger/                        # Logging
│   ├── observability/                 # Metrics, tracing, health
│   ├── feature-flags/                 # Feature flags
│   ├── test-utils/                    # Testing utilities
│   ├── internal-clients/              # Internal service clients
│   ├── shared-services/               # Shared NestJS modules
│   ├── contract-tests/                # Pact contract tests
│   ├── opentelemetry/                 # Tracing
│   ├── event-bus/                     # Event-driven communication
│   ├── http-client/                   # Inter-service HTTP
│   └── shared-queue/                  # Queue configuration
│
├── infra/                             # Infrastructure
│   ├── k8s/                           # Kubernetes manifests
│   ├── config/                        # PgBouncer, Redis config
│   └── scripts/                       # Infra scripts
│
├── ci/                                # CI/CD scripts
│   └── scripts/                       # Secret verification, analytics validation
│
├── scripts/                           # Dev & utility scripts
│   ├── database/                      # Migrate, seed
│   ├── demo-content/                  # Demo data deployment
│   └── sql/                           # SQL migrations
│
├── prisma/                            # Root-level seed data
│   └── seed/                          # Universe & admin seeds
│
└── doc/                               # Documentation
    ├── product/
    ├── design/
    ├── engineering/
    └── qa/
```

**Why this works:**
- Shared services stay separate from universe modules
- Claude can generate or refactor within clean boundaries
- No disconnected mini-apps — everything is composable
- Categorized services (`core/`, `universes/`, `engagement/`, `operations/`, `intelligence/`, `gateway/`) make navigation intuitive

---

## 4. Claude Setup

### 4.1 CLAUDE.md at Repo Root

Claude Code reads a `CLAUDE.md` file at session start. This is the right place for architecture rules, coding standards, and review checklists.

**Your CLAUDE.md should include:**

- Platform mission
- Repo map
- Architecture decisions
- Coding standards
- Naming conventions
- Approved libraries
- Analytics event naming rules
- Payment safety rules
- Review checklist
- "Never do" items

**Example:**

```markdown
# Azeebo+ Engineering Rules

## Architecture
- Shared services live in /services/core
- Universe logic lives in /services/universes
- UI primitives live in /packages/ui
- No duplicate payment logic inside modules

## Frontend
- TypeScript only
- Reuse shared components before creating new ones
- All screens must include loading, empty, error, and success states

## Analytics
- Event names use snake_case
- Every conversion screen must fire: view, submit, success, failure

## Monetization
- Never hardcode prices
- All paid actions must use shared wallet/payment services

## Reviews
- Check accessibility
- Check mobile responsiveness
- Check analytics coverage
- Check error states
```

### 4.2 VS Code for Daily Work

The VS Code extension is the recommended way to use Claude Code, with inline diffs and IDE-native workflow.

### 4.3 Shared Commands / Skills

Create repeatable internal workflows:

| Command | Purpose |
|---------|---------|
| `/build-screen` | Generate a complete screen with states |
| `/review-module` | Review a module for duplication and gaps |
| `/add-analytics` | Add analytics events to existing code |
| `/qa-pass` | Run QA checklist on a feature |
| `/refactor-shared` | Move duplicated logic to shared packages |
| `/prepare-pr` | Prepare a clean PR with tests and docs |

---

## 5. Prompt System

Use this standard prompt frame for all Claude tasks:

```
Role:
You are the lead engineer for Azeebo+.

Context:
This repo is a modular entertainment platform with shared services
and 8 universes, organized as:

  /services/core       — shared platform services
  /services/universes  — universe-specific business logic
  /services/engagement — user interaction services
  /packages/ui         — shared UI components

Task:
Build the [specific feature].

Constraints:
- Use existing shared UI components
- TypeScript only
- No duplicate wallet logic
- Add loading/empty/error/success states
- Add analytics events
- Add unit tests

Output:
- Files changed
- Summary of implementation
- Follow-up risks
```

---

## 6. Prompt Templates

### Template 1 — Product-to-Engineering

```
Turn this product spec into:
1. User stories
2. API requirements
3. DB entities
4. Analytics events
5. Admin requirements
6. Acceptance criteria

Output in markdown with headings.
```

### Template 2 — Build a Screen

```
Build the Reality vote screen in the mobile app.

Requirements:
- Contestant cards
- Quantity selector
- Wallet balance
- Total price
- Confirm CTA
- Success/failure states
- Analytics instrumentation

Use:
- Existing UI kit (/packages/ui)
- Shared wallet service (/services/core/wallet-service)
- TypeScript
- Test coverage
```

### Template 3 — Refactor

```
Review the repo for duplicate monetization logic across modules.

Move reusable logic into:
- /services/core (for backend logic)
- /packages/utils (for shared utilities)

Return:
- What was duplicated
- What you consolidated
- Any breaking-change risk
```

### Template 4 — QA Pass

```
Review this feature as a mobile QA lead.

Check:
- Loading states
- Empty states
- Offline behavior
- Failed payment behavior
- Analytics coverage
- Copy clarity

Return a prioritized bug list.
```

---

## 7. Universe Task Breakdown

### Foundation / Shared Shell

Ask Claude to build:
- Bottom nav, top bar, universe switcher
- Auth flow, profile shell
- Wallet summary card
- Rewards layer, notification center
- Shared rails/cards/tabs/modals
- Analytics base schema

```
Prompt: Create the shared Azeebo+ mobile shell.

Need:
- Home, Watch, Create, Rewards, Profile tabs
- Shared top bar
- Universe switcher in Watch
- Design-token-based styling
- Placeholder modules for all 8 universes
- Loading/empty/error states
- Analytics event base
```

### Reality Universe

Ask Claude to build:
- Reality home, show page, contestant cards
- Vote flow, supervote flow
- Predictions, leaderboards, premium extras

```
Prompt: Build the Reality Universe module.

Requirements:
- Reality hub
- Show detail page
- Contestant list
- Vote flow
- Supervote flow
- Prediction page
- Leaderboard
- Premium extras section

Also add:
- Analytics events
- Unit tests
- Admin stubs for contestant/show management
```

### Creator Universe

Ask Claude to build:
- Creator onboarding, verification
- Upload flow, creator profile
- Dashboard, tips/subscriptions, earnings states

### Lifestyle Universe

Ask Claude to build:
- Feed, event cards
- Nightlife/city guide
- Celebrity rails, influencer profiles
- Save/share flows

### Games Universe

Ask Claude to build:
- Daily challenge home, gameplay view
- Points logic, leaderboard
- Completion and reward states

### Comedy Universe

Ask Claude to build:
- Comedy feed, clip player
- Comedian profile, challenge prompts
- Sharing flows

### Sports Universe

Ask Claude to build:
- Sports home, highlight pages
- Prediction screen, contests
- Leaderboards, fan boards

### Vertical Universe

Ask Claude to build:
- Universe home, title page
- Lore page, character page
- Crossover links

### Movie Universe

Ask Claude to build:
- Movie home, film detail page
- Rent/unlock flow, watchlist
- Pass logic, filmmaker dashboard stubs

---

## 8. Shared Services

Have Claude define these before deep universe work:

| Category | Services |
|----------|----------|
| **Core** | `auth-service`, `user-service`, `wallet-service`, `payment-service`, `content-service`, `search-service`, `media-service` |
| **Engagement** | `notification-service`, `reward-service`, `referral-service`, `messaging-service`, `engagement-service`, `subscription-service` |
| **Operations** | `moderation-service`, `queue-service`, `support-service` |
| **Intelligence** | `analytics-service`, `recommendation-service` |
| **Gateway** | `api-gateway` |

And shared packages:

| Package | Purpose |
|---------|---------|
| `ui` | Reusable UI components |
| `design-tokens` | Design system tokens |
| `shared-types` | TypeScript type definitions |
| `utils` | Utility functions |
| `api-client` | API client libraries |
| `analytics-sdk` | Analytics tracking |

---

## 9. MCP Connections

Prioritize these MCP targets:

| Target | Use Case |
|--------|----------|
| **Figma** | Claude reads design context, generates screen scaffolds |
| **GitHub** | Repo and PR workflows, PR reviews against specs |
| **Notion** | Specs and decisions |
| **Jira / Linear** | Task generation from PRDs |
| **Google Drive** | Product docs |
| **Slack** | Engineering coordination |

---

## 10. Automation Workflows

Useful automation ideas:
- Nightly PR review
- Daily bug triage summary
- Release-note generation
- Regression checklist generation
- Security review on payment-related PRs

GitHub Actions-based Claude Code workflows and CI usage are supported.

---

## 11. Cost Control & Performance

| Model | Use For |
|-------|---------|
| **Haiku** | Repetitive transforms, summaries, ticket creation |
| **Sonnet** | Most coding, refactoring, structured reasoning |
| **Opus** | Hardest architecture or debugging work |

**Strategies:**
- **Prompt caching** for reused system prompts (e.g., Azeebo+ platform rules)
- **Streaming** for long codegen or artifact generation
- Keep a fixed reusable architecture prompt, cache it, append only the task-specific part

---

## 12. QA Checklist

Every feature prompt should require:

- [ ] Loading state exists
- [ ] Empty state exists
- [ ] Error state exists
- [ ] Success state exists
- [ ] Analytics events added
- [ ] Shared components reused
- [ ] No duplicate wallet/payment logic
- [ ] Tests included
- [ ] Copy is concise and clear
- [ ] Mobile responsive
- [ ] Accessibility basics covered

---

## 13. Weekly Workflow

| Day | Activity |
|-----|----------|
| **Monday** | Product lead asks Claude to break features into tasks. Design lead asks Claude to convert specs into component/screen checklists. |
| **Tue–Thu** | Engineers use Claude Code inside the repo for bounded tasks. QA uses Claude to prepare edge-case and regression lists. |
| **Friday** | Claude reviews changed modules for duplication, analytics gaps, and missing states. Claude generates release notes and risk summary. |

---

## 14. First 10 Prompts

1. Read this repo and summarize the current architecture, shared services, and missing foundations.
2. Create a CLAUDE.md for this repo based on our architecture and coding rules.
3. Build the shared mobile shell with bottom nav, top utilities, universe switcher, and placeholder module entry points.
4. Create a shared UI package with hero cards, rail components, badges, modals, wallet cards, and leaderboard blocks.
5. Build auth, profile, wallet summary, and rewards shell flows.
6. Build the Reality Universe home screen and show detail flow.
7. Build the voting flow using the shared wallet/payment service.
8. Add analytics event coverage for all Reality Universe screens and actions.
9. Generate unit and integration tests for the Reality vote and prediction flows.
10. Review the repo for duplicated logic and move reusable patterns into shared packages.

---

## 15. Mistakes to Avoid

- Don't use Claude without a repo structure
- Don't let each universe be built with different patterns
- Don't generate UI without shared design tokens
- Don't duplicate wallet or rewards logic across modules
- Don't skip analytics until later
- Don't treat Claude as only a chatbot instead of a workflow layer

---

## 16. Final Recommendation

Your strongest Claude setup:

- **Claude Code in VS Code** for daily engineering
- **CLAUDE.md** in repo root for standards
- **MCP** for Figma + GitHub + docs
- **Shared monorepo** with clean module boundaries
- **Reality Universe first**
- **Sonnet as default**, lighter models for repetitive tasks
- **Prompt caching** for recurring architecture context

---

# VMNL Claude Operations Manual

## Build System & AI-Augmented Execution Framework

**Company:** Virtual Media Network Limited (VMNL)
**Platform:** Azeebo+

---

## 1. Core Principle

Claude is **not** a chatbot, code generator, or helper.

Claude is a **multi-department execution engine**:

- Product Architect
- Design Translator
- Engineering Copilot
- QA Analyst
- Documentation Engine
- System Refactorer

---

## 2. Human vs Claude Roles

| Function | Human Role | Claude Role |
|----------|-----------|-------------|
| Vision | Define direction | Expand into systems |
| Product | Decide what to build | Structure specs |
| Design | Define experience | Translate into UI logic |
| Engineering | Approve architecture | Generate + refactor code |
| QA | Validate | Generate test coverage |
| Ops | Decide priorities | Automate workflows |

> **Golden Rule:** Humans decide WHAT and WHY. Claude executes HOW and HOW FAST.

---

## 3. System Architecture

### 3.1 Azeebo+ Structure

- One **platform shell**
- Eight **universes**
- Multiple **monetization loops**

### 3.2 Universes

1. Reality
2. Creator
3. Lifestyle
4. Vertical
5. Movie
6. Games
7. Comedy
8. Sports

### 3.3 Claude Responsibility

Claude must ALWAYS:
- Respect shared services
- Avoid duplication
- Maintain modular boundaries
- Reuse components

---

## 4. Master Workflow

### Step 1 — Product Breakdown

**Human:** Defines feature idea, universe, expected outcome
**Claude:** Converts into PRD, user stories, API requirements, analytics plan, admin requirements

### Step 2 — Design Translation

**Human:** Provides Figma frames, wireframes, experience intent
**Claude:** Converts into screen logic, component list, layout hierarchy, interaction flow

### Step 3 — Engineering Build

**Claude:** Generates screens, builds modules, wires APIs, creates services, adds tests
**Engineers:** Review, refine, approve

### Step 4 — QA + Validation

**Claude:** Generates edge cases, test plans, failure scenarios, analytics validation
**QA Team:** Verifies real-world behavior

### Step 5 — Release + Iteration

**Claude:** Generates release notes, identifies risks, suggests improvements

---

## 5. Claude Rulebook (Mandatory)

Every Claude task must follow:

| Rule | Requirement |
|------|-------------|
| **No Duplication** | Reuse shared services, reuse UI components |
| **Always Include States** | Loading, empty, error, success |
| **Monetization Integrity** | No hardcoded prices, use shared wallet/payment |
| **Analytics Coverage** | Track: view, interaction, conversion, failure |
| **Mobile First** | Optimized layouts, fast load, minimal friction |

---

## 6. Department Playbooks

### Product Team

Use Claude to: convert ideas → PRDs, generate user stories, define MVP scope, structure rollout phases.

```
Prompt: Turn this idea into:
- PRD
- User stories
- Acceptance criteria
- API requirements
- Analytics plan
```

### Design Team

Use Claude to: convert wireframes → UI systems, define components, generate screen hierarchy, create interaction logic.

```
Prompt: Convert this Figma screen into:
- Layout breakdown
- Component list
- Interaction flow
- Monetization cues
```

### Engineering

Use Claude Code to: scaffold modules, generate screens, build services, refactor logic, write tests.

```
Prompt: Build the Reality voting system.

Include:
- Vote flow
- Wallet integration
- Success/failure states
- Analytics
- Unit tests
```

### QA

Use Claude to: generate test cases, identify edge cases, validate flows.

```
Prompt: Review this feature as QA.

Check:
- Edge cases
- Payment failures
- Offline behavior
- Analytics gaps
```

### Commercial / Monetization

Use Claude to: define pricing logic, build sponsor integrations, create revenue flows.

```
Prompt: Design monetization logic for voting, creator tips, premium content.

Include:
- Pricing tiers
- Conversion flow
- Analytics tracking
```

---

## 7. Universe Build Strategy

| Phase | Universe | Goal |
|-------|----------|------|
| **1** | Reality (FIRST) | Habit, emotion, monetization |
| **2** | Creator | Supply, participation, earnings |
| **3** | Lifestyle | Daily relevance |
| **4** | Games / Comedy / Sports | Frequency, repeat usage |
| **5** | Vertical + Movies | Premium, long-term retention |

---

## 8. Automation System

Claude should automate:
- PR summaries
- Release notes
- Bug reports
- Analytics audits
- Code reviews

---

## 9. Performance Optimization

- Lighter models for simple tasks
- Stronger models for architecture
- Prompt reuse and caching
- Structured prompts with context

---

## 10. Final Execution Principle

> **Azeebo+ will not be built by code alone.**
> It will be built by: **Systems. Structure. Consistency. Relentless iteration.**

- Claude ensures: speed, scale, structure
- VMNL ensures: vision, quality, direction

> **This is VMNL's Competitive Advantage Engine.**

---

# VMNL Claude Prompt Library

## Master Prompt (Use First Always)

```
You are the lead product architect and engineer for Azeebo+.

Azeebo+ is a modular digital platform with:
- One shared app shell
- Shared services (auth, wallet, payments, rewards, analytics)
- 8 universes: Reality, Creator, Lifestyle, Vertical, Movie, Games, Comedy, Sports

Your job:
- Think in systems, not isolated features
- Reuse shared components
- Avoid duplication
- Ensure mobile-first design
- Include monetization logic
- Include analytics tracking
- Include loading, empty, error, success states

Always output in a structured format.
```

---

## Product Prompts

### Idea → Full PRD

```
Turn this idea into a full Product Requirements Document.

Include:
- Problem statement
- Solution overview
- User personas
- User journeys
- Core features
- Monetization logic
- Analytics events
- Admin requirements
- Risks

Idea: [INSERT IDEA]
```

### Feature Breakdown

```
Break this feature into:
- User stories
- Acceptance criteria
- Edge cases
- Dependencies

Feature: [INSERT FEATURE]
```

### Universe Definition

```
Define the full product logic for the [UNIVERSE NAME].

Include:
- Purpose
- Target users
- Core features
- User flows
- Monetization loops
- Engagement loops
- Key screens
```

---

## Design Prompts

### Wireframe → UI Logic

```
Convert this wireframe into a UI/UX breakdown.

Include:
- Layout structure
- Component list
- Hierarchy
- Interaction flow
- Monetization cues
- States (loading, empty, error, success)

Wireframe: [INSERT]
```

### Screen Builder

```
Design the [SCREEN NAME].

Include:
- Layout
- Components
- Sections
- User actions
- Transitions
- Monetization points
- Visual style direction
```

### Component System Builder

```
Create a reusable component system for Azeebo+.

Include:
- Cards, buttons, navigation, modals
- Badges, leaderboards, wallet components

Define:
- Usage, states, variations
```

---

## Engineering Prompts

### Build Full Feature

```
Build the [FEATURE NAME] for Azeebo+.

Requirements:
- Use shared services
- TypeScript
- Mobile-first
- Include all states
- Include analytics
- Include unit tests

Output:
- Architecture
- Code structure
- Key files
```

### Build Screen

```
Generate the [SCREEN NAME] screen.

Include:
- UI structure
- Components
- API integration points
- State management
- Analytics events
- Loading/empty/error states
```

### Build API / Backend

```
Design backend logic for [FEATURE].

Include:
- Endpoints
- Request/response structure
- DB schema
- Validation
- Error handling
- Analytics tracking
```

### Refactor

```
Review this codebase.

Identify:
- Duplicated logic
- Inconsistent patterns
- Performance issues

Refactor:
- Move shared logic to /services/core
- Standardize components via /packages/ui
```

---

## Universe Prompt Packs

### Reality Universe — *The Heat Engine*

**Full System Builder:**
```
Design the full Reality Universe for Azeebo+.

Include:
- Show lifecycle (auditions → live shows → finale)
- Contestant system, episode structure
- Clip distribution system
- Voting system, supervotes
- Prediction system, leaderboard system
- Reward loop, fan engagement mechanics

Output:
- Product structure
- User flows
- Monetization points
- Admin requirements
```

**Voting Optimization:**
```
Optimize a voting system for maximum conversion.

Include:
- Pricing tiers, bundle strategy
- Urgency triggers, UX flow
- Psychological triggers, upsell logic
```

**Fan Addiction Loop:**
```
Design a fan engagement loop for reality shows.

Include:
- Daily return triggers, emotional hooks
- Social sharing, prediction incentives
- Reward mechanics
```

**Revenue Expansion:**
```
Expand monetization in Reality Universe.

Include:
- Votes, supervotes, premium content
- Fan clubs, brand integrations
- Sponsorship hooks
```

### Creator Universe — *The Supply Engine*

**Ecosystem Builder:**
```
Design a full creator ecosystem.

Include:
- Onboarding, verification
- Content upload, discovery
- Monetization tools
- Creator growth system
```

**Earnings System:**
```
Design a creator monetization system.

Include:
- Tips, subscriptions, paid content
- Brand deals, revenue split logic
```

**Growth Engine:**
```
Design a creator growth system.

Include:
- Algorithm signals, content surfacing
- Challenges, audience growth tools
- Retention loops
```

**Retention:**
```
Design retention strategies for creators.

Include:
- Earnings visibility, milestones
- Gamification, recognition systems
```

### Lifestyle Universe — *The Daily Habit Engine*

**Platform Builder:**
```
Design the Lifestyle Universe.

Include:
- Content feed, music, culture
- Nightlife, events
- Celebrity content, discovery system
```

**City-Based Engagement:**
```
Design a city-based lifestyle system.

Include:
- Location-based feeds
- Nightlife recommendations
- Events, trending spots
```

**Brand Integration:**
```
Design brand integration opportunities.

Include:
- Sponsored content, native ads
- Experiential activations
- Influencer campaigns
```

**Daily Retention Loop:**
```
Design a daily engagement loop.

Include:
- Fresh content triggers
- Notifications, personalization
- Reward hooks
```

### Games Universe — *The Frequency Engine*

**Game System Builder:**
```
Design the Games Universe.

Include:
- Daily challenges, trivia
- Tournaments, scoring system
- Rewards, leaderboards
```

**Addictive Loop:**
```
Design an addictive gameplay loop.

Include:
- Replay triggers, streaks
- Rewards, competition mechanics
```

**Monetization:**
```
Design monetization for games.

Include:
- Entry fees, premium challenges
- Reward upgrades, in-game purchases
```

**Competitive System:**
```
Design leaderboard and ranking systems.

Include:
- Tiers, rankings
- Rewards, progression
```

### Comedy Universe — *The Viral Engine*

**Platform Builder:**
```
Design the Comedy Universe.

Include:
- Skit feed, creator discovery
- Share system, viral loops
```

**Virality Optimization:**
```
Optimize content for virality.

Include:
- Hook structure, pacing
- Share triggers, repeat viewing
```

**Share Mechanics:**
```
Design sharing features.

Include:
- Social sharing, remix culture
- Duet features
```

**Monetization:**
```
Design monetization for comedy.

Include:
- Creator payouts, ads
- Premium content
```

### Sports Universe — *The Passion Engine*

**Platform Builder:**
```
Design the Sports Universe.

Include:
- Highlights, predictions
- Contests, fan engagement
```

**Prediction System:**
```
Design a sports prediction system.

Include:
- Match predictions, scoring
- Rewards, repeat participation
```

**Fan Engagement Loop:**
```
Design a sports fan engagement loop.

Include:
- Live interaction, community
- Notifications
```

**Monetization:**
```
Design monetization.

Include:
- Predictions, premium content
- Brand sponsorships
```

### Vertical Universe — *The Prestige Engine*

**Story Universe Builder:**
```
Design the Vertical Universe.

Include:
- Story layers, character arcs
- Interconnected narratives
- World-building
```

**Fandom System:**
```
Design fandom engagement.

Include:
- Theories, lore exploration
- Character following, discussions
```

**Crossover System:**
```
Design crossover logic.

Include:
- Character interactions
- Timeline connections
- Shared universe rules
```

**Premium Monetization:**
```
Design monetization.

Include:
- Premium episodes, exclusive access
- Fan memberships
```

### Movie Universe — *The Premium Transaction Engine*

**Digital Cinema Builder:**
```
Design the Movie Universe.

Include:
- Catalog, rentals, premieres
- Watchlist
```

**Premiere System:**
```
Design a digital premiere system.

Include:
- Ticketing, access windows
- Exclusivity
```

**Monetization Model:**
```
Design monetization.

Include:
- Rentals, subscriptions
- Premium passes
```

**Viewer Experience:**
```
Design viewing experience.

Include:
- Player UI, recommendations
- Watch continuity
```

---

## QA Prompts

### Full QA Audit

```
Review this feature as QA.

Check:
- Loading states
- Empty states
- Error states
- Offline behavior
- Edge cases
- Analytics coverage
```

### Edge Case Generator

```
Generate all possible edge cases for this feature.

Feature: [INSERT]
```

---

## Monetization Prompts

### Revenue Design

```
Design monetization for this feature.

Include:
- Pricing, conversion flow
- Incentives, retention loop
- Analytics tracking
```

### Payment Flow

```
Design a payment flow.

Include:
- Wallet integration
- Confirmation, failure handling
- Success feedback
```

---

## Analytics Prompts

### Event Tracking

```
Define analytics events for this feature.

Include:
- User actions
- Conversion points
- Drop-off tracking
```

---

## Automation Prompts

### Weekly Summary

```
Summarize this week's development.

Include:
- Completed features
- Risks, blockers
- Next priorities
```

### Release Notes

```
Generate release notes.

Include:
- New features
- Improvements
- Bug fixes
```

---

## Strategic Universe Map

| Universe | Role | Engine |
|----------|------|--------|
| Reality | Monetization | The Heat Engine |
| Creator | Supply | The Supply Engine |
| Lifestyle | Daily Habit | The Daily Habit Engine |
| Games | Frequency | The Frequency Engine |
| Comedy | Virality | The Viral Engine |
| Sports | Passion | The Passion Engine |
| Vertical | Prestige | The Prestige Engine |
| Movies | Premium Revenue | The Premium Transaction Engine |

---

> **Final Line:** This prompt library is your AI workforce manual. Used properly: product moves faster, design becomes clearer, engineering becomes structured, QA becomes stronger, monetization becomes intentional.
