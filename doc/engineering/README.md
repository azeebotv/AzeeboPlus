# Engineering Documentation

> Technical guides, API docs, deployment guides, and engineering standards for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture | `doc/ARCHITECTURE.md` | System architecture overview |
| Services Catalog | `doc/SERVICES.md` | All services and endpoints |
| API Gateway | `doc/engineering/api/gateway.md` | Gateway routing and configuration |
| Auth Service API | `doc/engineering/api/auth-service.md` | Authentication endpoints |
| Auth Flow | `doc/engineering/security/auth-flow.md` | JWT and OAuth flow |
| Local Development | `doc/engineering/deployment/local-dev.md` | Local setup guide |
| Incident Response | `doc/engineering/runbooks/incident-response.md` | Incident handling |
| Deployment | `doc/DEPLOYMENT.md` | Production deployment |
| Deployment Checklist | `doc/DEPLOYMENT-CHECKLIST.md` | Pre-deployment verification |
| Secret Rotation | `doc/secret-rotation.md` | Secret rotation procedures |

---

## Engineering Standards

### Code Quality
- TypeScript strict mode — no `any` in production code
- ESLint + Prettier enforced in CI
- PR size limit: 400 lines (split if larger)
- All PRs require review before merge

### Testing
- Unit tests for all services (Jest)
- Integration tests for critical flows
- E2E tests for admin and creator portals (Playwright)
- Load tests via k6 (`scripts/load-test.js`)

### Security
- JWT auth with 15min access + 7d refresh tokens
- Rate limiting on all endpoints
- Input validation via class-validator
- SQL injection prevention via Prisma ORM
- CORS properly configured per environment

### Deployment
- Docker all-in-one container for staging/production
- Coolify for deployment management
- GitHub Actions for CI/CD
- Automated database backups

### Monitoring
- Structured JSON logging via `@azeebo/logger`
- Health checks on all services
- Sentry for error tracking
- Prometheus metrics via `@azeebo/observability`
