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

## Rollback Procedure

### 1. Identify the Previous Version

```bash
kubectl rollout history deployment/auth-service
```

### 2. Rollback to Previous Version

```bash
kubectl rollout undo deployment/auth-service
```

### 3. Verify the Rollback

```bash
kubectl rollout status deployment/auth-service
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

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>
```

### Database Connection Issues

```bash
# Check database service
kubectl get services postgres

# Check database logs
kubectl logs -f deployment/postgres
```

### Service Not Responding

```bash
# Check service endpoints
kubectl get endpoints auth-service

# Check service logs
kubectl logs -f deployment/auth-service
```

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