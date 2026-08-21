# Tasks — Infrastructure (Docker, CI/CD, Terraform, Deployment)

> Derived from AZP-TAA-001 R2.0 Part VIII

---

## 1. Cloud & Network Topology (TAA §41-42)

### 1.1 AWS Reference Deployment

| Task | Reference | Status |
|------|-----------|--------|
| AWS Africa (Cape Town) af-south-1 primary region | ADR-011 | Needs verification |
| Multi-AZ deployment | TAA §63 | Needs implementation |
| Route 53 + ACM for DNS/TLS | TAA §41 | Needs implementation |
| CloudFront + WAF for edge/CDN | TAA §41 | Needs implementation |
| ECS/Fargate for container runtime | ADR-012 | Partial |
| RDS/Aurora PostgreSQL Multi-AZ | TAA §41 | Partial |
| ElastiCache Redis-compatible | TAA §41 | Partial |
| S3 for object storage | TAA §41 | Partial |
| EventBridge/SQS for events/queues | TAA §41 | Partial |
| Secrets Manager + KMS for secrets | TAA §52 | Needs implementation |
| OpenTelemetry + CloudWatch for observability | TAA §60 | Partial |

### 1.2 Network Security (TAA §42)

| Task | Reference | Status |
|------|-----------|--------|
| Public traffic at edge/WAF/load-balancer only | TAA §42 | Needs implementation |
| Application in private network segments | TAA §42 | Needs implementation |
| Databases with no public ingress | TAA §42 | Needs implementation |
| Approved egress only to payment/identity/push/media | TAA §42 | Needs implementation |
| Zero-trust/VPN for admin access | TAA §42 | Needs implementation |
| Least-privilege security groups | TAA §42 | Needs implementation |
| mTLS between services | TAA §42 | Needs implementation |

---

## 2. Container & Docker

### 2.1 Dockerfile Standards

| Task | Reference | Status |
|------|-----------|--------|
| Non-root user (nodejs) in all Dockerfiles | TAA §41 | ✅ Implemented |
| Multi-stage builds | TAA §41 | ✅ Implemented |
| Proper .dockerignore | TAA §41 | Needs verification |
| Health check endpoints in all services | TAA §57 | Partial |
| Production-optimized image sizes | TAA §41 | Needs verification |

### 2.2 Docker Compose (Local Dev)

| Task | Reference | Status |
|------|-----------|--------|
| Full local dev environment with all services | TAA §43 | Partial |
| PostgreSQL with proper config | TAA §34 | Partial |
| Redis for caching/rate limiting | TAA §35 | Partial |
| Proper env var configuration | TAA §43 | Partial |
| Volume mounts for development | TAA §43 | Partial |

### 2.3 Production Containers

| Task | Reference | Status |
|------|-----------|--------|
| OCI-compliant container images | ADR-012 | Needs verification |
| Container image scanning (Trivy/Snyk) | TAA §84 | Needs implementation |
| Digest pinning for immutable deploys | TAA §84 | Needs implementation |
| Private registry for production images | TAA §84 | Needs implementation |
| Container signing and verification | TAA §84 | Needs implementation |

---

## 3. CI/CD Pipeline (TAA §45)

### 3.1 PR Gates

| Task | Reference | Status |
|------|-----------|--------|
| Lint (ESLint) on all packages | TAA §45 | ✅ Implemented |
| TypeScript type checking | TAA §45 | ✅ Implemented |
| Unit tests | TAA §45 | ✅ Implemented |
| Secret scanning | TAA §84 | ✅ Implemented |
| Dependency/security scanning | TAA §84 | Partial |
| Contract tests | TAA §45 | Partial |
| SBOM generation | TAA §84 | Needs implementation |

### 3.2 Build & Deploy

| Task | Reference | Status |
|------|-----------|--------|
| Immutable application/container artifact build | TAA §45 | Partial |
| Auto-deploy to Development after passing gates | TAA §45 | Needs implementation |
| Promotion to Staging with integration/smoke tests | TAA §45 | Needs implementation |
| Production release approval workflow | TAA §45 | Needs implementation |
| Progressive/canary deployment | TAA §45 | Needs implementation |
| Post-deploy smoke checks (auth, catalog, playback) | TAA §45 | Needs implementation |
| Rollback/roll-forward capability | TAA §45 | Needs implementation |

### 3.3 Security Scanning

| Task | Reference | Status |
|------|-----------|--------|
| Pre-commit secret detection | TAA §84 | ✅ Implemented |
| CI secret scanning (env files) | TAA §84 | ✅ Implemented |
| Dependency vulnerability scanning | TAA §84 | Partial |
| Container image scanning | TAA §84 | Needs implementation |
| IaC misconfiguration scanning | TAA §84 | Needs implementation |
| Critical vulnerability block on release | TAA §84 | Needs implementation |

---

## 4. Infrastructure as Code (TAA §44)

| Task | Reference | Status |
|------|-----------|--------|
| Terraform modules for all production infra | ADR-013 | Needs implementation |
| No untracked console-only resources | TAA §44 | Needs verification |
| Environment-specific values as config (not copy-paste) | TAA §44 | Needs implementation |
| IaC plan reviewed in CI before production apply | TAA §44 | Needs implementation |
| Resource tagging (env, domain, owner, cost-centre) | TAA §88 | Needs implementation |
| Terraform state management (remote backend) | TAA §44 | Needs implementation |

---

## 5. Environments (TAA §43)

| Environment | Purpose | Status |
|-------------|---------|--------|
| Local/Developer | Developer feedback/unit tests | ✅ Exists |
| Development | Shared integration | Needs setup |
| Staging | Production-like integration and release rehearsal | Needs setup |
| Closed Beta | Controlled real users | Needs setup |
| Production | Public live service | Needs setup |
| DR/Recovery | Recovery capability | Needs setup |

---

## 6. Database Migration Strategy (TAA §46)

| Task | Reference | Status |
|------|-----------|--------|
| Expand-and-contract migrations | TAA §46 | Needs verification |
| Production-scale migration testing | TAA §46 | Needs implementation |
| Mixed schema tolerance during rolling deploy | TAA §46 | Needs implementation |
| Migration audit trail | TAA §46 | Partial |
| Reversible migrations where practical | TAA §46 | Needs verification |

---

## 7. Dependency Management (TAA §47)

| Task | Reference | Status |
|------|-----------|--------|
| Supported stable runtime/framework releases | TAA §47 | Needs verification |
| Version pinning/lockfiles per release train | TAA §47 | ✅ pnpm-lock.yaml exists |
| No uncontrolled auto-upgrade of majors | TAA §47 | Needs verification |
| Monthly dependency review | TAA §47 | Needs implementation |
| Urgent patch path for critical vulnerabilities | TAA §47 | Needs implementation |
| Framework upgrade compatibility testing | TAA §47 | Needs implementation |

---

## 8. Terraform Modules Needed

| Module | Purpose | Priority |
|--------|---------|----------|
| `modules/vpc` | VPC, subnets, security groups | P0 |
| `modules/rds` | PostgreSQL Multi-AZ | P0 |
| `modules/elasticache` | Redis cluster | P0 |
| `modules/ecs` | ECS/Fargate cluster and services | P0 |
| `modules/s3` | Object storage buckets | P0 |
| `modules/cloudfront` | CDN distribution | P0 |
| `modules/waf` | Web Application Firewall | P0 |
| `modules/route53` | DNS configuration | P0 |
| `modules/acm` | TLS certificates | P0 |
| `modules/secrets-manager` | Secret rotation | P0 |
| `modules/eventbridge` | Event rules and buses | P1 |
| `modules/sqs` | Queue configuration | P1 |
| `modules/cloudwatch` | Dashboards and alarms | P1 |
| `modules/ecs-task` | Individual service task definitions | P1 |
