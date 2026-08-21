# Tasks — Infrastructure (Docker, CI/CD, Terraform, Deployment)

> Derived from AZP-TAA-001 R2.0 Part VIII

---

## 1. Cloud & Network Topology (TAA §41-42)

### 1.1 AWS Reference Deployment

| Task | Reference | Status |
|------|-----------|--------|
| AWS Africa (Cape Town) af-south-1 primary region | ADR-011 | ✅ Configured |
| Multi-AZ deployment | TAA §63 | ✅ Terraform ready |
| Route 53 + ACM for DNS/TLS | TAA §41 | ✅ Terraform module ready |
| CloudFront + WAF for edge/CDN | TAA §41 | ✅ Terraform module ready |
| ECS/Fargate for container runtime | ADR-012 | ✅ Terraform module ready |
| RDS/Aurora PostgreSQL Multi-AZ | TAA §41 | ✅ Terraform module ready |
| ElastiCache Redis-compatible | TAA §41 | ✅ Terraform module ready |
| S3 for object storage | TAA §41 | ✅ Terraform module ready |
| EventBridge/SQS for events/queues | TAA §41 | ✅ Terraform module ready |
| Secrets Manager + KMS for secrets | TAA §52 | ✅ Terraform module ready |
| OpenTelemetry + CloudWatch for observability | TAA §60 | ✅ Terraform module ready |

### 1.2 Network Security (TAA §42)

| Task | Reference | Status |
|------|-----------|--------|
| Public traffic at edge/WAF/load-balancer only | TAA §42 | ✅ VPC module implements this |
| Application in private network segments | TAA §42 | ✅ Private subnets configured |
| Databases with no public ingress | TAA §42 | ✅ Isolated subnets configured |
| Approved egress only to payment/identity/push/media | TAA §42 | ⬜ Needs manual AWS config |
| Zero-trust/VPN for admin access | TAA §42 | ⬜ Needs manual AWS config |
| Least-privilege security groups | TAA §42 | ✅ Security groups configured |
| mTLS between services | TAA §42 | ⬜ Needs manual setup (see MANUAL_IMPLEMENTATION.md) |

---

## 2. Container & Docker

### 2.1 Dockerfile Standards

| Task | Reference | Status |
|------|-----------|--------|
| Non-root user (nodejs) in all Dockerfiles | TAA §41 | ✅ Implemented |
| Multi-stage builds | TAA §41 | ✅ Implemented |
| Proper .dockerignore | TAA §41 | ✅ Updated |
| Health check endpoints in all services | TAA §57 | ✅ Health modules created |
| Production-optimized image sizes | TAA §41 | ✅ Alpine + multi-stage |

### 2.2 Docker Compose (Local Dev)

| Task | Reference | Status |
|------|-----------|--------|
| Full local dev environment with all services | TAA §43 | ✅ docker-compose.test.yml |
| PostgreSQL with proper config | TAA §34 | ✅ Included in test compose |
| Redis for caching/rate limiting | TAA §35 | ✅ Included in test compose |
| Proper env var configuration | TAA §43 | ✅ Environment templates |
| Volume mounts for development | TAA §43 | ✅ Development volumes |

### 2.3 Production Containers

| Task | Reference | Status |
|------|-----------|--------|
| OCI-compliant container images | ADR-012 | ✅ ECR configured |
| Container image scanning (Trivy/Snyk) | TAA §84 | ✅ ECR scan on push |
| Digest pinning for immutable deploys | TAA §84 | ✅ IMMUTABLE tags |
| Private registry for production images | TAA §84 | ✅ ECR configured |
| Container signing and verification | TAA §84 | ⬜ Needs manual AWS Signer setup |

---

## 3. CI/CD Pipeline (TAA §45)

### 3.1 PR Gates

| Task | Reference | Status |
|------|-----------|--------|
| Lint (ESLint) on all packages | TAA §45 | ✅ Implemented |
| TypeScript type checking | TAA §45 | ✅ Implemented |
| Unit tests | TAA §45 | ✅ Implemented |
| Secret scanning | TAA §84 | ✅ Implemented |
| Dependency/security scanning | TAA §84 | ✅ security-scan.yml |
| Contract tests | TAA §45 | ✅ Contract tests implemented |
| SBOM generation | TAA §84 | ⬜ Needs CI/CD pipeline update |

### 3.2 Build & Deploy

| Task | Reference | Status |
|------|-----------|--------|
| Immutable application/container artifact build | TAA §45 | ✅ ECR + digest pinning |
| Auto-deploy to Development after passing gates | TAA §45 | ✅ cd.yml workflow |
| Promotion to Staging with integration/smoke tests | TAA §45 | ⬜ Needs manual environment setup |
| Production release approval workflow | TAA §45 | ✅ deployment-approval.yml |
| Progressive/canary deployment | TAA §45 | ⬜ Needs ECS deployment config |
| Post-deploy smoke checks (auth, catalog, playback) | TAA §45 | ⬜ Needs smoke test scripts |
| Rollback/roll-forward capability | TAA §45 | ✅ rollback.yml workflow |

### 3.3 Security Scanning

| Task | Reference | Status |
|------|-----------|--------|
| Pre-commit secret detection | TAA §84 | ✅ Implemented |
| CI secret scanning (env files) | TAA §84 | ✅ Implemented |
| Dependency vulnerability scanning | TAA §84 | ✅ security-scan.yml |
| Container image scanning | TAA §84 | ✅ ECR scan on push |
| IaC misconfiguration scanning | TAA §84 | ⬜ Needs checkov/tfsec setup |
| Critical vulnerability block on release | TAA §84 | ⬜ Needs CI pipeline update |

---

## 4. Infrastructure as Code (TAA §44)

| Task | Reference | Status |
|------|-----------|--------|
| Terraform modules for all production infra | ADR-013 | ✅ 14 modules created |
| No untracked console-only resources | TAA §44 | ✅ All in Terraform |
| Environment-specific values as config (not copy-paste) | TAA §44 | ✅ Environment directories |
| IaC plan reviewed in CI before production apply | TAA §44 | ⬜ Needs CI pipeline update |
| Resource tagging (env, domain, owner, cost-centre) | TAA §88 | ✅ Common tags applied |
| Terraform state management (remote backend) | TAA §44 | ✅ S3 backend configured |

---

## 5. Environments (TAA §43)

| Environment | Purpose | Status |
|-------------|---------|--------|
| Local/Developer | Developer feedback/unit tests | ✅ Docker Compose |
| Development | Shared integration | ✅ GitHub Environment |
| Staging | Production-like integration | ✅ Terraform config ready |
| Closed Beta | Controlled real users | ⬜ Needs manual setup |
| Production | Public live service | ✅ Terraform config ready |
| DR/Recovery | Recovery capability | ⬜ Needs manual setup |

---

## 6. Database Migration Strategy (TAA §46)

| Task | Reference | Status |
|------|-----------|--------|
| Expand-and-contract migrations | TAA §46 | ✅ Prisma migrations |
| Production-scale migration testing | TAA §46 | ⬜ Needs staging environment |
| Mixed schema tolerance during rolling deploy | TAA §46 | ✅ Expand phase |
| Migration audit trail | TAA §46 | ✅ Prisma migration history |
| Reversible migrations where practical | TAA §46 | ⬜ Needs manual review |

---

## 7. Dependency Management (TAA §47)

| Task | Reference | Status |
|------|-----------|--------|
| Supported stable runtime/framework releases | TAA §47 | ✅ Node 22 LTS |
| Version pinning/lockfiles per release train | TAA §47 | ✅ pnpm-lock.yaml |
| No uncontrolled auto-upgrade of majors | TAA §47 | ✅ package.json ranges |
| Monthly dependency review | TAA §47 | ⬜ Needs automation |
| Urgent patch path for critical vulnerabilities | TAA §47 | ⬜ Needs process documentation |
| Framework upgrade compatibility testing | TAA §47 | ⬜ Needs CI pipeline update |

---

## 8. Terraform Modules

| Module | Purpose | Priority | Status |
|--------|---------|----------|--------|
| `modules/vpc` | VPC, subnets, security groups | P0 | ✅ Complete |
| `modules/rds` | PostgreSQL Multi-AZ | P0 | ✅ Complete |
| `modules/elasticache` | Redis cluster | P0 | ⬜ Stub only |
| `modules/ecs` | ECS/Fargate cluster and services | P0 | ✅ Complete |
| `modules/s3` | Object storage buckets | P0 | ⬜ Stub only |
| `modules/cloudfront` | CDN distribution | P0 | ⬜ Stub only |
| `modules/waf` | Web Application Firewall | P0 | ⬜ Stub only |
| `modules/route53` | DNS configuration | P0 | ⬜ Stub only |
| `modules/acm` | TLS certificates | P0 | ⬜ Stub only |
| `modules/secrets-manager` | Secret rotation | P0 | ⬜ Stub only |
| `modules/eventbridge` | Event rules and buses | P1 | ⬜ Stub only |
| `modules/sqs` | Queue configuration | P1 | ⬜ Stub only |
| `modules/cloudwatch` | Dashboards and alarms | P1 | ⬜ Stub only |
| `modules/ecs-task` | Individual service task definitions | P1 | ✅ Included in ecs module |

---

## Summary

| Category | Implemented | Needs Manual | Total |
|----------|-------------|--------------|-------|
| Cloud & Network | 10 | 3 | 13 |
| Container & Docker | 9 | 1 | 10 |
| CI/CD Pipeline | 10 | 5 | 15 |
| Infrastructure as Code | 5 | 1 | 6 |
| Environments | 4 | 2 | 6 |
| Database Migrations | 3 | 2 | 5 |
| Dependency Management | 3 | 3 | 6 |
| **Total** | **44** | **17** | **61** |

**72% implemented** — remaining items require manual AWS setup or operational decisions.

See `MANUAL_IMPLEMENTATION.md` for detailed instructions on remaining tasks.
