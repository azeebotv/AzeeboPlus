# Deployment Runbooks

**Last Updated:** June 2, 2026  
**Version:** 1.0  
**Platform:** Kubernetes (Coolify)  

---

## 1. Overview

This document provides step-by-step runbooks for deploying Azeebo+ services to various environments.

### 1.1 Environments

| Environment | URL | Purpose | Access |
|-------------|-----|---------|--------|
| Development | http://localhost:* | Local development | Developers |
| Staging | https://staging.azeebo.com | Pre-production testing | QA + Developers |
| Production | https://azeebo.com | Live users | Restricted |

### 1.2 Deployment Architecture

```
GitHub → GitHub Actions → Docker Registry → Kubernetes → Services
```

---

## 2. Pre-Deployment Checklist

### 2.1 Code Readiness

- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review approved (minimum 1 approval)
- [ ] Security scan passed (no high/critical vulnerabilities)
- [ ] Linting and type checking passed
- [ ] Documentation updated

### 2.2 Infrastructure Readiness

- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] Secrets updated in secret manager
- [ ] Resource limits defined (CPU, memory)
- [ ] Health checks configured

### 2.3 Communication

- [ ] Deployment scheduled and announced
- [ ] Rollback plan documented
- [ ] On-call engineer identified
- [ ] Stakeholders notified (if production)

---

## 3. Deployment Procedures

### 3.1 Deploying a Single Service

#### Step 1: Prepare the Service

```bash
# Navigate to service directory
cd services/<service-name>

# Run tests
pnpm test

# Build the service
pnpm build

# Generate Prisma client
npx prisma generate
```

#### Step 2: Create Migration (if schema changed)

```bash
# Create migration
npx prisma migrate dev --name <migration_name>

# Test migration locally
npx prisma migrate reset
```

#### Step 3: Push to Repository

```bash
git add .
git commit -m "feat(<service>): <description>"
git push origin <branch>
```

#### Step 4: Create Pull Request

- Create PR with detailed description
- Link to related issues
- Include migration notes (if applicable)
- Request review from team lead

#### Step 5: CI/CD Pipeline

The GitHub Actions pipeline will automatically:
1. Run tests
2. Run security scan
3. Build Docker image
4. Push to registry
5. Deploy to staging

#### Step 6: Verify Staging Deployment

```bash
# Check service health
curl https://staging.azeebo.com/<service>/health

# Check service readiness
curl https://staging.azeebo.com/<service>/ready

# Check logs
kubectl logs -f deployment/<service-name> -n staging
```

#### Step 7: Deploy to Production

```bash
# Via Coolify dashboard or kubectl
kubectl apply -f k8s/production/<service-name>.yaml

# Or trigger via GitHub Actions
# Go to Actions → Deploy to Production → Run workflow
```

#### Step 8: Verify Production Deployment

```bash
# Check service health
curl https://api.azeebo.com/<service>/health

# Check service readiness
curl https://api.azeebo.com/<service>/ready

# Monitor error rates
# Check Grafana dashboard
```

---

### 3.2 Deploying All Services

#### Step 1: Update Version Tags

```bash
# Update docker-compose.yml or k8s manifests
# Update service versions to latest
```

#### Step 2: Run Full CI/CD Pipeline

```bash
# Trigger full deployment pipeline
# Go to Actions → Deploy All Services → Run workflow
```

#### Step 3: Monitor Deployment

```bash
# Watch deployment status
kubectl get pods -n production --watch

# Check for errors
kubectl get events -n production --sort-by='.lastTimestamp'
```

#### Step 4: Run Smoke Tests

```bash
# Run smoke test suite
npm run test:smoke

# Or manually verify critical paths
curl https://api.azeebo.com/auth/health
curl https://api.azeebo.com/content/health
curl https://api.azeebo.com/wallet/health
curl https://api.azeebo.com/payment/health
```

---

### 3.3 Database Migration Deployment

#### Step 1: Test Migration on Staging

```bash
# Connect to staging database
kubectl exec -it <postgres-pod> -n staging -- psql -U postgres -d azeebo

# Apply migration
npx prisma migrate deploy
```

#### Step 2: Verify Migration

```bash
# Check schema version
npx prisma migrate status

# Verify tables
\dt

# Check data integrity
SELECT COUNT(*) FROM users;
```

#### Step 3: Apply to Production

```bash
# Backup production database first
kubectl exec -it <postgres-pod> -n production -- pg_dump -U postgres azeebo > backup.sql

# Apply migration
npx prisma migrate deploy
```

#### Step 4: Verify Production Migration

```bash
# Check schema version
npx prisma migrate status

# Run data validation queries
# Check application functionality
```

---

## 4. Rollback Procedures

### 4.1 Service Rollback

#### Step 1: Identify Issue

```bash
# Check logs for errors
kubectl logs deployment/<service-name> -n production --tail=100

# Check metrics
# Grafana → Service Dashboard → Error Rate
```

#### Step 2: Rollback to Previous Version

```bash
# Via kubectl
kubectl rollout undo deployment/<service-name> -n production

# Or via Coolify dashboard
# Select previous deployment → Rollback
```

#### Step 3: Verify Rollback

```bash
# Check service health
curl https://api.azeebo.com/<service>/health

# Monitor error rates
# Grafana → Service Dashboard
```

---

### 4.2 Database Migration Rollback

**⚠️ WARNING: Database rollbacks are complex and may result in data loss**

#### Step 1: Assess Impact

- Determine if rollback is necessary
- Identify affected data
- Consult with team lead

#### Step 2: Restore from Backup

```bash
# Restore from backup
kubectl exec -it <postgres-pod> -n production -- psql -U postgres -d azeebo < backup.sql
```

#### Step 3: Verify Restoration

```bash
# Check data integrity
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM content_items;

# Verify application functionality
```

---

## 5. Environment Configuration

### 5.1 Environment Variables

Each service requires the following environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3000
CONTENT_SERVICE_URL=http://content-service:3001
WALLET_SERVICE_URL=http://wallet-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3003

# Payment Providers
PAYSTACK_SECRET_KEY=sk_xxx
FLUTTERWAVE_SECRET_KEY=sk_xxx

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
PROMETHEUS_URL=http://prometheus:9090
```

### 5.2 Secrets Management

Secrets are managed via:
- **Development:** `.env.local` files (not committed)
- **Staging/Production:** Kubernetes Secrets or external secret manager

```bash
# Create Kubernetes secret
kubectl create secret generic <service>-secrets \
  --from-literal=JWT_SECRET=xxx \
  --from-literal=DATABASE_URL=xxx \
  -n production
```

---

## 6. Monitoring & Alerting

### 6.1 Health Checks

All services expose:

- `GET /health` - Basic health check
- `GET /ready` - Readiness probe (dependencies ready)
- `GET /live` - Liveness probe (service alive)

### 6.2 Grafana Dashboards

- **Service Overview:** Error rate, latency, throughput
- **Database:** Connection pool, query performance
- **Cache:** Hit rate, memory usage
- **Payments:** Success rate, failure reasons

### 6.3 Alert Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| HighErrorRate | >5% for 5m | Critical | Page on-call |
| HighLatency | p95 >1s for 5m | Warning | Investigate |
| ServiceDown | Pod not ready | Critical | Auto-restart + page |
| PaymentFailureRate | >10% for 5m | Critical | Page payments team |
| DatabaseConnectionPool | >80% utilized | Warning | Scale up |

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Service Not Starting

```bash
# Check logs
kubectl logs deployment/<service-name> -n production

# Check environment variables
kubectl describe pod <pod-name> -n production

# Check resource limits
kubectl top pod <pod-name> -n production
```

#### Database Connection Issues

```bash
# Test database connection
kubectl exec -it <service-pod> -n production -- nc -zv postgres 5432

# Check connection pool
kubectl exec -it <postgres-pod> -n production -- psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

#### Cache Issues

```bash
# Test Redis connection
kubectl exec -it <service-pod> -n production -- nc -zv redis 6379

# Check Redis memory
kubectl exec -it <redis-pod> -n production -- redis-cli INFO memory
```

---

## 8. Post-Deployment Verification

### 8.1 Automated Checks

```bash
# Run health checks
./scripts/health-check.sh

# Run smoke tests
npm run test:smoke

# Run API contract tests
npm run test:contract
```

### 8.2 Manual Checks

- [ ] Login flow works
- [ ] Content loading works
- [ ] Payment flow works (test mode)
- [ ] Wallet operations work
- [ ] Error pages display correctly
- [ ] Mobile app connects to API

### 8.3 Monitoring Period

Monitor for **30 minutes** after deployment:
- Error rates
- Response times
- Payment success rates
- Database performance
- Cache hit rates

---

## 9. Emergency Procedures

### 9.1 Service Outage

1. **Identify affected service(s)**
2. **Check Grafana for error patterns**
3. **Rollback if recent deployment**
4. **Scale up if resource issue**
5. **Restart if stuck state**
6. **Escalate if unresolved in 15 minutes**

### 9.2 Database Outage

1. **Check database status**
2. **Restart database pod if stuck**
3. **Restore from backup if corrupted**
4. **Failover to replica if available**
5. **Escalate immediately**

### 9.3 Payment System Outage

1. **Switch to backup payment provider**
2. **Notify payment team**
3. **Monitor failed payments**
4. **Process retries when resolved**
5. **Communicate with affected users**

---

## 10. Deployment Schedule

### 10.1 Recommended Deployment Windows

| Environment | Window | Frequency |
|-------------|--------|-----------|
| Staging | Any time | As needed |
| Production | Tuesday-Thursday, 10:00-14:00 UTC | Weekly or bi-weekly |

### 10.2 Blackout Periods

- **Monday mornings** - High traffic period
- **Friday afternoons** - Weekend coverage concerns
- **Holiday periods** - Limited support availability
- **End of month** - Financial reporting period

---

**Document Owner:** DevOps Team  
**Review Frequency:** Quarterly  
**Next Review:** September 2, 2026
