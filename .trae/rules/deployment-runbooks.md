# Azeebo+ Deployment Runbooks

**Version:** 1.0
**Last Updated:** April 24, 2026

---

## Overview

This document contains deployment runbooks for the Azeebo+ platform.

---

## Environment Overview

| Environment | Purpose | Access |
|-------------|---------|--------|
| Development | Local testing | Developers |
| Staging | Pre-production QA | QA + Developers |
| Production | Live users | Restricted |

---

## Deployment Process

### 1. Pre-Deployment

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Build the application
pnpm build
```

### 2. Database Migrations

```bash
cd services/auth-service
pnpm prisma:migrate deploy
```

### 3. Deploy to Staging

```bash
# Build Docker image
docker build -t azeebo-plus/auth-service:staging ./services/auth-service

# Push to registry
docker push azeebo-plus/auth-service:staging

# Deploy to staging
kubectl apply -f kubernetes/auth-service/staging/
```

### 4. Deploy to Production

```bash
# Build Docker image
docker build -t azeebo-plus/auth-service:prod ./services/auth-service

# Push to registry
docker push azeebo-plus/auth-service:prod

# Deploy to production
kubectl apply -f kubernetes/auth-service/production/
```

---

## Rollback Procedures by Service

### Auth Service
```bash
# Check deployment history
kubectl rollout history deployment/auth-service -n azeebo

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=2 -n azeebo

# Verify rollback
kubectl rollout status deployment/auth-service -n azeebo
kubectl get pods -l app=auth-service -n azeebo
```

### User Service
```bash
kubectl rollout history deployment/user-service -n azeebo
kubectl rollout undo deployment/user-service -n azeebo
kubectl rollout status deployment/user-service -n azeebo
```

### Wallet Service
```bash
kubectl rollout history deployment/wallet-service -n azeebo
kubectl rollout undo deployment/wallet-service -n azeebo
kubectl rollout status deployment/wallet-service -n azeebo
```

### Payment Service
```bash
kubectl rollout history deployment/payment-service -n azeebo
kubectl rollout undo deployment/payment-service -n azeebo
kubectl rollout status deployment/payment-service -n azeebo
```

### Media Service
```bash
kubectl rollout history deployment/media-service -n azeebo
kubectl rollout undo deployment/media-service -n azeebo
kubectl rollout status deployment/media-service -n azeebo
```

### Content Service
```bash
kubectl rollout history deployment/content-service -n azeebo
kubectl rollout undo deployment/content-service -n azeebo
kubectl rollout status deployment/content-service -n azeebo
```

### API Gateway
```bash
kubectl rollout history deployment/api-gateway -n azeebo
kubectl rollout undo deployment/api-gateway -n azeebo
kubectl rollout status deployment/api-gateway -n azeebo
```

### Database Migration Rollback
```bash
# For Prisma migrations
cd services/<service-name>
pnpm prisma migrate status
pnpm prisma migrate down --name <migration-name>
```

---

## Database Migration Rollback

### 1. Identify the Previous Migration

```bash
cd services/auth-service
pnpm prisma migrate status
```

### 2. Rollback to Previous Migration

```bash
pnpm prisma migrate reset --skip-seed
```

---

## Hotfix Procedure

### 1. Create a Hotfix Branch

```bash
git checkout main
git pull origin main
git checkout -b hotfix/issue-description
```

### 2. Make the Fix

```bash
# Make your changes
git add .
git commit -m "fix: hotfix for issue"
```

### 3. Deploy Immediately

```bash
# Build and push Docker image
docker build -t azeebo-plus/auth-service:hotfix .
docker push azeebo-plus/auth-service:hotfix

# Deploy to production
kubectl apply -f kubernetes/auth-service/production/
```

### 4. Create a Follow-up PR

```bash
# Create a PR to develop with proper review
git checkout develop
git merge hotfix/issue-description
```

---

## Environment-Specific Deployments

### Development

```bash
# Start local development
docker-compose up -d

# Run migrations
cd services/auth-service
pnpm prisma:migrate

# Start service
pnpm run start:dev
```

### Staging

```bash
# Deploy to staging
kubectl apply -f kubernetes/auth-service/staging/

# Verify deployment
kubectl rollout status deployment/auth-service -n staging
```

### Production

```bash
# Deploy to production
kubectl apply -f kubernetes/auth-service/production/

# Verify deployment
kubectl rollout status deployment/auth-service -n production
```

---

## Monitoring Deployments

### Check Deployment Status

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

### View Logs

```bash
kubectl logs -f deployment/auth-service
```

### Check Health

```bash
curl http://localhost:3000/health
```

---

## Troubleshooting Guide

### Pod Not Starting
**Symptoms:** Pod stuck in Pending/CrashLoopBackOff/ImagePullBackOff

**Steps:**
```bash
# Check pod status and events
kubectl describe pod <pod-name> -n azeebo

# Check pod logs (including previous container)
kubectl logs <pod-name> -n azeebo
kubectl logs <pod-name> -n azeebo --previous

# Check resource availability
kubectl describe nodes

# Check image pull secrets
kubectl get secret regcred -n azeebo
```

**Common Causes:**
- Image pull failure (check registry credentials)
- Insufficient resources (check node capacity)
- ConfigMap/Secret not found
- Invalid volume mount

### Database Connection Issues
**Symptoms:** Application pods failing to connect to database

**Steps:**
```bash
# Check database service status
kubectl get services postgres -n azeebo
kubectl get endpoints postgres -n azeebo

# Check database pod status
kubectl get pods -l app=postgres -n azeebo
kubectl logs -f deployment/postgres -n azeebo

# Test database connectivity from application pod
kubectl exec -it <app-pod> -n azeebo -- psql -h postgres -U <user> -d <dbname>

# Check network policies
kubectl get networkpolicy -n azeebo
```

### Service Not Responding
**Symptoms:** 503/502 errors, service unavailable

**Steps:**
```bash
# Check service endpoints
kubectl get endpoints <service-name> -n azeebo

# Check deployment status
kubectl rollout status deployment/<service-name> -n azeebo

# Check pod readiness
kubectl get pods -l app=<service-name> -n azeebo -o wide

# Check ingress configuration
kubectl describe ingress <ingress-name> -n azeebo

# Check load balancer status
kubectl get svc -n azeebo | grep LoadBalancer
```

### High Error Rates
**Symptoms:** Increased 5xx errors in monitoring

**Steps:**
```bash
# Check pod logs for errors
kubectl logs -f deployment/<service-name> -n azeebo | grep -E "(ERROR|Error|error)"

# Check resource usage
kubectl top pods -l app=<service-name> -n azeebo

# Check Prometheus metrics
kubectl port-forward service/prometheus-server 9090:80 -n monitoring
# Visit http://localhost:9090/graph

# Check Kubernetes events
kubectl get events -n azeebo --sort-by='.lastTimestamp' | tail -20
```

### Redis Connection Issues
**Symptoms:** Cache operations failing, increased latency

**Steps:**
```bash
# Check Redis service
kubectl get services redis -n azeebo

# Check Redis cluster status
kubectl exec -it redis-0 -n azeebo -- redis-cli cluster info

# Test Redis connectivity
kubectl exec -it <app-pod> -n azeebo -- redis-cli -h redis ping
```

### Memory/CPU Issues
**Symptoms:** OOM kills, CPU throttling, slow response

**Steps:**
```bash
# Check resource usage
kubectl top pods -n azeebo
kubectl top nodes

# Check evictions
kubectl get events -n azeebo | grep Evicted

# Check pod resource limits
kubectl describe pod <pod-name> -n azeebo | grep -A5 Resources

# Scale up if needed
kubectl scale deployment/<service-name> --replicas=4 -n azeebo
```

---

## Monitoring Alert Thresholds

### Critical Alerts
| Alert | Threshold | Action |
|-------|-----------|--------|
| HighAuthFailureRate | >10% failure rate over 5min | Immediate investigation |
| PaymentFailureRate | >5% failure rate | Immediate investigation |
| BackupFailed | No backup in 24h | Immediate action |
| PodCrashLoopBackOff | >3 restarts | Immediate investigation |
| DatabaseDown | No response for 2min | Immediate investigation |

### Warning Alerts
| Alert | Threshold | Action |
|-------|-----------|--------|
| HighErrorRate | >5% error rate over 5min | Investigate within 15min |
| HighLatency | p95 > 500ms | Investigate within 30min |
| HighMemoryUsage | >85% memory | Investigate within 1h |
| HighCPUUsage | >90% CPU | Investigate within 1h |
| RateLimitViolations | >10 violations/min | Investigate within 1h |

### Informational Alerts
| Alert | Threshold | Action |
|-------|-----------|--------|
| DeploymentRollout | New deployment detected | Verify success |
| CertificateExpiring | TLS cert <30 days | Schedule renewal |
| HighCacheMissRate | >30% miss rate | Optimize caching |

---

## Incident Response Procedures

### Severity Levels
| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 - Critical | Production down, data loss, security breach | <15min |
| P2 - High | Major service degradation, high error rates | <1h |
| P3 - Medium | Partial functionality loss, minor errors | <4h |
| P4 - Low | Cosmetic issues, non-critical bugs | Next business day |

### P1 Incident Response
1. **Detection:** Alert triggers in PagerDuty
2. **Acknowledgment:** On-call engineer acknowledges within 5min
3. **Initial Assessment:**
   ```bash
   # Check overall cluster health
   kubectl get nodes -n azeebo
   kubectl get pods -n azeebo --field-selector=status.phase!=Running
   
   # Check critical services
   kubectl rollout status deployment/auth-service -n azeebo
   kubectl rollout status deployment/wallet-service -n azeebo
   kubectl rollout status deployment/payment-service -n azeebo
   ```
4. **Isolation:** Identify affected components
5. **Recovery:** Execute rollback if needed
6. **Communication:** Update stakeholders via Slack/PagerDuty
7. **Postmortem:** Document root cause within 24h

### P2 Incident Response
1. **Detection:** Alert triggers in Slack/PagerDuty
2. **Acknowledgment:** Engineer acknowledges within 30min
3. **Investigation:** Analyze logs and metrics
4. **Resolution:** Apply fix or workaround
5. **Verification:** Confirm service recovery
6. **Documentation:** Update incident tracking

### Communication Channels
- **PagerDuty:** Critical alerts, on-call notifications
- **Slack #incidents:** Real-time incident communication
- **Slack #engineering:** General updates
- **Email:** Post-incident summaries
- **Status Page:** Public status updates

### Post-Incident Review
- Document root cause
- Identify preventive measures
- Update runbooks/procedures
- Schedule follow-up actions
- Share learnings with team

---

## Backup & Recovery

### Database Backup

```bash
# Create backup
pg_dump -h localhost -U postgres azeebo_plus > backup.sql

# Restore backup
pg_restore -h localhost -U postgres -d azeebo_plus backup.sql
```

### Redis Cache Clear

```bash
# Clear Redis cache
redis-cli FLUSHALL
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Linting passed
- [ ] Type checking passed
- [ ] Database migrations created
- [ ] Environment variables updated
- [ ] Security scan passed

### Post-Deployment

- [ ] All pods running
- [ ] Health checks passing
- [ ] Logs are clean
- [ ] Performance metrics are normal
- [ ] Error rates are within threshold

---

## Contact

For deployment issues:

- **Critical:** PagerDuty
- **High:** Slack #deployment channel
- **Medium:** Email to dev team