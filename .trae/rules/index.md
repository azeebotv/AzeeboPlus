# Azeebo+ Steering Files Index

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document provides an index of all steering files for the Azeebo+ platform. These files guide development across all aspects of the project.

---

## Steering Files

### Core Architecture

| File | Description |
|------|-------------|
| [backend.md](./backend.md) | Backend services architecture, NestJS, API design |
| [database.md](./database.md) | Database schema, PostgreSQL, migrations |
| [api-design.md](./api-design.md) | REST API endpoints, versioning, response formats |

### Frontend Applications

| File | Description |
|------|-------------|
| [mobile.md](./mobile.md) | React Native + Expo mobile app |
| [web.md](./web.md) | Next.js web application |
| [admin.md](./admin.md) | Next.js admin panel |

### Shared & Cross-Cutting

| File | Description |
|------|-------------|
| [shared.md](./shared.md) | Shared packages, design tokens, types |
| [security.md](./security.md) | Security requirements, authentication, authorization |
| [analytics.md](./analytics.md) | Event tracking, metrics, dashboards |

### Infrastructure & Operations

| File | Description |
|------|-------------|
| [infrastructure.md](./infrastructure.md) | Cloud infrastructure, Kubernetes, networking |
| [cicd.md](./cicd.md) | CI/CD pipelines, deployment process |

### Quality & Standards

| File | Description |
|------|-------------|
| [testing.md](./testing.md) | Testing strategy, unit/integration/E2E |
| [error-handling.md](./error-handling.md) | Error handling patterns, logging |

### Project Management

| File | Description |
|------|-------------|
| [tasks.md](./tasks.md) | Development tasks, todos, sprint planning |

---

## Quick Reference

### Technology Stack

| Component | Technology |
|-----------|------------|
| Mobile | React Native + Expo |
| Web | Next.js |
| Admin | Next.js |
| Backend | NestJS |
| Database | PostgreSQL |
| Cache | Redis |
| Search | OpenSearch |
| Container | Docker |
| Orchestration | Kubernetes |

### The 8 Universes

1. **Reality** - Reality shows, voting, predictions
2. **Creator** - Creator discovery, uploads, earnings
3. **Lifestyle** - Youth culture, events, nightlife
4. **Vertical** - Premium storyworld, lore, characters
5. **Movie** - Digital cinema, rentals, premieres
6. **Games** - Challenges, trivia, tournaments
7. **Comedy** - Viral skits, stand-up clips
8. **Sports** - Predictions, highlights, fan boards

### Core Services

- **Auth Service** - Authentication, JWT, MFA
- **User Service** - Profiles, preferences, history
- **Wallet Service** - Balance, transactions
- **Payment Service** - Payments, refunds
- **Reward Service** - Points, badges, streaks
- **Notification Service** - Push, email, SMS
- **Content Service** - Content management
- **Search Service** - Full-text search
- **Analytics Service** - Event tracking
- **Moderation Service** - Content moderation
- **Recommendation Service** - Personalization

### User Roles

| Role | Description |
|------|-------------|
| `user` | Standard user |
| `creator` | Content creator |
| `moderator` | Content moderator |
| `admin` | Platform admin |
| `super_admin` | Super admin |
| `partner` | Sponsor/partner |
| `sponsor_manager` | Campaign manager |

### Key Requirements

- All screens MUST have loading, empty, error, success states
- All sensitive logic MUST be server-side
- All payments MUST go through Payment Service
- All wallet operations MUST be atomic and auditable
- All admin actions MUST be logged
- MFA MUST be enforced for admin accounts

---

## File Inclusion

Steering files are automatically included in Kiro context based on file patterns:

- `*.md` files in `.kiro/steering/` are automatically included
- Files can be manually included using `#` in chat

---

## Updates

When updating steering files:

1. Update the version number
2. Update the last updated date
3. Document changes in the file
4. Notify the team of breaking changes