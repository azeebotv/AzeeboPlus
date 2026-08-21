# Manual Implementation Requirements

> This document details infrastructure tasks that require manual setup, cloud provider access, or operational decisions that cannot be automated through code alone.

---

## 1. AWS Account Setup & Configuration

### 1.1 Account Structure
- [ ] Create AWS Organization with separate accounts for:
  - **Management** (billing, SSO)
  - **Development** (shared dev environment)
  - **Staging** (pre-production)
  - **Production** (live service)
  - **Security** (audit, logging)
- [ ] Enable AWS Organizations SCPs for:
  - Deny root user access
  - Deny leaving organization
  - Enforce MFA
  - Deny region restrictions (af-south-1 only)

### 1.2 IAM & SSO
- [ ] Configure AWS SSO (IAM Identity Center) with IdP integration
- [ ] Create permission sets:
  - `AzeeboAdmin` (full access)
  - `AzeeboDeveloper` (ECS, ECR, CloudWatch, S3 read-only)
  - `AzeeboReadOnly` (all read-only)
- [ ] Set up MFA enforcement for all users
- [ ] Create service accounts for CI/CD with least-privilege

### 1.3 Billing & Cost Management
- [ ] Set up AWS Budgets with alerts at 50%, 80%, 100% of monthly budget
- [ ] Enable Cost Explorer and Cost Allocation Tags
- [ ] Set up Reserved Instance recommendations
- [ ] Configure Savings Plans

---

## 2. DNS & TLS (TAA §41)

### 2.1 Route 53
- [ ] Register `azeebo.plus` domain (or transfer existing)
- [ ] Create hosted zones for:
  - `azeebo.plus` (production)
  - `dev.azeebo.plus` (development)
  - `staging.azeebo.plus` (staging)
- [ ] Configure DNS records:
  - A/CNAME records for CloudFront distribution
  - MX records for email
  - TXT records for SPF/DKIM

### 2.2 ACM Certificates
- [ ] Request certificates for:
  - `*.azeebo.plus` (wildcard)
  - `azeebo.plus` (root)
- [ ] Validate via DNS (Route 53)
- [ ] Set up auto-renewal monitoring

---

## 3. Network Security (TAA §42)

### 3.1 VPC Configuration
- [ ] Deploy VPC module (`terraform apply -target=module.vpc`)
- [ ] Verify public subnets have internet access via NAT Gateway
- [ ] Verify private subnets can reach internet (for package updates)
- [ ] Verify database subnets have NO internet access
- [ ] Configure VPC Flow Logs to CloudWatch

### 3.2 Security Groups
- [ ] Review and customize security group rules:
  - ALB: Allow 443/80 from 0.0.0.0/0
  - App: Allow 3000 from ALB only
  - Database: Allow 5432 from App only
  - Redis: Allow 6379 from App only
- [ ] Test network connectivity between tiers

### 3.3 mTLS Between Services
- [ ] Set up AWS Private CA or use ACM Private Certificate Authority
- [ ] Create service mesh (AWS App Mesh or Istio)
- [ ] Configure mTLS certificates for all services
- [ ] Test service-to-service authentication

---

## 4. Database Setup (TAA §41, §79)

### 4.1 RDS Aurora
- [ ] Deploy RDS module (`terraform apply -target=module.rds`)
- [ ] Retrieve master password from Secrets Manager
- [ ] Create application database roles per TAA §79:
  ```sql
  -- Migration role (privileged)
  CREATE ROLE azeebo_migration WITH LOGIN PASSWORD '<secure>';

  -- Domain roles
  CREATE ROLE azeebo_identity WITH LOGIN PASSWORD '<secure>';
  CREATE ROLE azeebo_catalog WITH LOGIN PASSWORD '<secure>';
  CREATE ROLE azeebo_knowledge WITH LOGIN PASSWORD '<secure>';
  -- ... (see database-roles.service.ts for full list)
  ```
- [ ] Grant schema permissions per role
- [ ] Set up cross-schema write denial

### 4.2 Schema Migrations
- [ ] Run `prisma migrate deploy` for each service
- [ ] Verify expand-and-contract migration strategy
- [ ] Set up migration audit trail
- [ ] Test rollback procedures

### 4.3 Backups
- [ ] Verify automated backups (30-day retention for production)
- [ ] Test point-in-time recovery
- [ ] Set up cross-region backup replication
- [ ] Document backup restoration procedures

---

## 5. Redis Setup (TAA §35)

### 5.1 ElastiCache
- [ ] Deploy ElastiCache module (`terraform apply -target=module.elasticache`)
- [ ] Configure Redis cluster:
  - 3 nodes for production (1 primary, 2 replicas)
  - Encryption at rest (KMS)
  - Encryption in transit (TLS)
  - AUTH token for access control
- [ ] Set up Redis connection strings in Secrets Manager
- [ ] Configure eviction policies:
  - Cache: `allkeys-lru`
  - Rate limiting: `noeviction`
  - Session: `volatile-ttl`

---

## 6. Container Registry (TAA §84)

### 6.1 ECR Setup
- [ ] Create ECR repositories for all services
- [ ] Configure image scanning on push
- [ ] Set up lifecycle policies:
  - Keep last 10 images
  - Delete untagged images after 7 days
- [ ] Enable image signing with AWS Signer
- [ ] Set up cross-account replication if needed

### 6.2 Image Security
- [ ] Configure Trivy/Snyk scanning in CI/CD
- [ ] Set up SBOM generation
- [ ] Block deployment of images with critical vulnerabilities
- [ ] Set up image digest pinning for immutable deploys

---

## 7. CI/CD Pipeline (TAA §45)

### 7.1 GitHub Actions Secrets
Configure these secrets in GitHub repository settings:
- [ ] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (for CI/CD)
- [ ] `SONAR_TOKEN` (for code quality)
- [ ] `SNYK_TOKEN` (for dependency scanning)
- [ ] `TRIVY_USERNAME` / `TRIVY_PASSWORD` (for container scanning)
- [ ] `SLACK_WEBHOOK_URL` (for notifications)

### 7.2 Branch Protection Rules
- [ ] Require PR reviews (2 approvals for main)
- [ ] Require status checks to pass:
  - `lint`
  - `typecheck`
  - `unit-tests`
  - `integration-tests`
  - `security-scan`
- [ ] Require branches to be up to date
- [ ] Require signed commits
- [ ] Restrict force pushes to main

### 7.3 Deployment Environments
- [ ] Set up GitHub Environments:
  - `development` (auto-deploy on merge to develop)
  - `staging` (manual approval)
  - `production` (manual approval + 2 reviewers)
- [ ] Configure environment protection rules
- [ ] Set up deployment locks for maintenance windows

---

## 8. Secrets Management (TAA §52)

### 8.1 Secrets Manager
- [ ] Create secrets for each service:
  - `azeebo/production/{service}/database-url`
  - `azeebo/production/{service}/redis-url`
  - `azeebo/production/{service}/jwt-secret`
  - `azeebo/production/{service}/api-key`
- [ ] Configure automatic rotation:
  - Database passwords: 90 days
  - API keys: 180 days
  - JWT secrets: 365 days
- [ ] Set up Lambda rotation functions

### 8.2 KMS Keys
- [ ] Create KMS keys for:
  - Database encryption
  - S3 bucket encryption
  - Secrets Manager encryption
  - EBS encryption
- [ ] Set up key rotation (annual)
- [ ] Configure key policies for cross-service access

---

## 9. Monitoring & Observability (TAA §60)

### 9.1 CloudWatch
- [ ] Deploy CloudWatch module (`terraform apply -target=module.cloudwatch`)
- [ ] Create dashboards:
  - Service Health (CPU, memory, request count)
  - Database (connections, query latency, deadlocks)
  - Redis (memory, hit rate, evictions)
  - API Gateway (latency, error rates, throttle)
- [ ] Set up alarms:
  - High error rate (>1% 5xx)
  - High latency (P95 > 2s)
  - Database connections (>80%)
  - Redis memory (>80%)
  - Deployment failures

### 9.2 OpenTelemetry
- [ ] Configure OpenTelemetry Collector
- [ ] Set up trace sampling:
  - Production: 10% sampling
  - Staging: 100% sampling
- [ ] Configure metrics export to CloudWatch
- [ ] Set up Jaeger or X-Ray for trace visualization

### 9.3 Log Aggregation
- [ ] Configure CloudWatch Logs Insights queries
- [ ] Set up log subscription filters for real-time alerting
- [ ] Configure log retention:
  - Application logs: 30 days
  - Audit logs: 365 days
  - Security logs: 730 days

---

## 10. Security Hardening (TAA §84)

### 10.1 WAF Configuration
- [ ] Deploy WAF module (`terraform apply -target=module.waf`)
- [ ] Configure WAF rules:
  - Rate limiting (1000 requests/5 min per IP)
  - SQL injection protection
  - XSS protection
  - Geographic blocking (if needed)
  - Bot control
- [ ] Set up WAF logging to S3
- [ ] Configure WAF alerts

### 10.2 GuardDuty
- [ ] Enable GuardDuty in all accounts
- [ ] Configure finding publishing to Security account
- [ ] Set up automated remediation for common findings

### 10.3 Security Hub
- [ ] Enable Security Hub
- [ ] Enable standards:
  - AWS Foundational Security Best Practices
  - CIS AWS Foundations Benchmark
- [ ] Set up automated compliance checks

---

## 11. Disaster Recovery (TAA §56)

### 11.1 Backup Strategy
- [ ] Configure AWS Backup for:
  - RDS: Daily snapshots, 30-day retention
  - EBS: Daily snapshots, 14-day retention
  - ECR: Cross-region replication
- [ ] Test backup restoration procedures
- [ ] Document RTO/RPO targets:
  - RTO: 4 hours
  - RPO: 1 hour

### 11.2 Multi-Region Strategy
- [ ] Set up cross-region RDS read replica
- [ ] Configure Route 53 health checks and failover
- [ ] Set up S3 cross-region replication
- [ ] Test failover procedures

---

## 12. Cost Optimization

### 12.1 Reserved Capacity
- [ ] Purchase RDS Reserved Instances (1-year, all upfront)
- [ ] Purchase ElastiCache Reserved Nodes (1-year)
- [ ] Set up Savings Plans for ECS Fargate

### 12.2 Auto-Scaling
- [ ] Configure ECS auto-scaling:
  - Min: 1 task per service
  - Max: 10 tasks per service
  - Target: 70% CPU utilization
- [ ] Configure RDS auto-scaling (read replicas)
- [ ] Set up scheduled scaling for known traffic patterns

---

## 13. Compliance & Audit

### 13.1 CloudTrail
- [ ] Enable CloudTrail in all accounts
- [ ] Configure log file validation
- [ ] Set up S3 bucket for trail logs
- [ ] Configure CloudWatch Logs integration

### 13.2 Config Rules
- [ ] Enable AWS Config
- [ ] Set up compliance rules:
  - Encrypted volumes
  - Restricted SSH
  - MFA enabled
  - Root user usage
  - S3 bucket public access

---

## 14. Documentation

### 14.1 Runbooks
Create operational runbooks for:
- [ ] Service deployment procedures
- [ ] Database migration procedures
- [ ] Incident response procedures
- [ ] Disaster recovery procedures
- [ ] Secret rotation procedures

### 14.2 Architecture Diagrams
Create and maintain:
- [ ] Network topology diagram
- [ ] Data flow diagram
- [ ] Service dependency diagram
- [ ] Security architecture diagram

---

## 15. Testing

### 15.1 Load Testing
- [ ] Set up k6 or Artillery for load testing
- [ ] Create load test scripts for:
  - Authentication flow
  - Content listing
  - Search
  - Payment processing
- [ ] Establish performance baselines
- [ ] Set up performance regression detection

### 15.2 Chaos Engineering
- [ ] Set up AWS Fault Injection Simulator
- [ ] Create chaos experiments:
  - Database failover
  - Redis failure
  - Network partition
  - Service degradation
- [ ] Document chaos experiment results

---

## Priority Order

1. **P0 (Critical Path)** — Complete before production launch:
   - AWS account setup (Section 1)
   - VPC & networking (Section 3)
   - RDS & database setup (Section 4)
   - Redis setup (Section 5)
   - Secrets management (Section 8)
   - CI/CD pipeline (Section 7)
   - Basic monitoring (Section 9)

2. **P1 (Important)** — Complete within first month:
   - Container registry (Section 6)
   - DNS & TLS (Section 2)
   - Security hardening (Section 10)
   - Backup strategy (Section 11)

3. **P2 (Enhancement)** — Complete within first quarter:
   - mTLS between services (Section 3.3)
   - Advanced monitoring (Section 9.2-9.3)
   - Cost optimization (Section 12)
   - Compliance & audit (Section 13)

4. **P3 (Continuous)** — Ongoing:
   - Documentation (Section 14)
   - Testing (Section 15)
   - Disaster recovery testing (Section 11.2)
