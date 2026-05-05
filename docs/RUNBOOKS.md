# Azeebo+ Operator Runbooks

This document contains step-by-step procedures for operating Azeebo+ in production.

---

## Deployments

### Standard Deployment (Staging)

**When to Use**: Regular feature releases to staging environment.

**Prerequisites**:
- PR approved and merged to `main`
- CI pipeline passed
- No pending database migrations requiring approval

**Steps**:

1. **Check Out Latest Code**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify Environment**:
   ```bash
   # Ensure you're targeting staging
   kubectl config use-context staging
   ```

3. **Run Database Migrations**:
   ```bash
   # Deploy migration job first
   kubectl apply -f infra/k8s/jobs/migrate.yaml
   
   # Wait for migration to complete
   kubectl wait --for=condition=complete job/migrate --timeout=5m
   
   # Verify migration status
   kubectl logs job/migrate
   ```

4. **Deploy Services**:
   ```bash
   # Apply all manifests
   kubectl apply -f infra/k8s/
   
   # Watch rollout status
   kubectl rollout status deployment/api-gateway
   kubectl rollout status deployment/auth-service
   kubectl rollout status deployment/wallet-service
   # ... repeat for all services
   ```

5. **Run Smoke Tests**:
   ```bash
   # Test health endpoints
   curl https://staging.azeebo.com/health
   
   # Test API endpoints
   curl https://staging.azeebo.com/api/v1/health
   ```

6. **Verify in Dashboard**:
   - Check Kubernetes pods are running
   - Check metrics in Grafana/Prometheus
   - Verify error rates are normal

**Rollback If Needed**:
```bash
# If deployment fails, roll back
kubectl rollout undo deployment/api-gateway
kubectl rollout undo deployment/auth-service
# ... repeat for affected services
```

---

### Production Deployment

**When to Use**: Deploying to production.

**Additional Prerequisites**:
- Staging smoke tests passed
- Staging soak tested for at least 4 hours
- Change approved in deployment calendar
- On-call team notified

**Steps**:

1. **Pre-Deployment Checks**:
   ```bash
   kubectl config use-context production
   
   # Verify all production services healthy
   kubectl get pods
   kubectl get hpa
   ```

2. **Backup Database (Critical!)**:
   ```bash
   # Create database backup before migrations
   # Use your cloud provider's backup tool or pg_dump
   pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Deploy Migrations**:
   ```bash
   kubectl apply -f infra/k8s/jobs/migrate.yaml
   kubectl wait --for=condition=complete job/migrate --timeout=10m
   kubectl logs job/migrate
   ```

4. **Canary Deploy (Optional but Recommended)**:
   ```bash
   # Deploy to 10% of traffic first
   # (Requires service mesh or ingress controller with canary support)
   ```

5. **Full Deploy**:
   ```bash
   kubectl apply -f infra/k8s/
   
   # Monitor rollout closely
   kubectl rollout status deployment/api-gateway --watch
   ```

6. **Post-Deployment Verification**:
   - Check error rates for 15 minutes
   - Verify payment webhooks are working
   - Confirm search and recommendations are functional
   - Spot-check frontend pages

7. **Notify Stakeholders**:
   - Post in #deployments Slack channel
   - Update deployment calendar

**Production Rollback**:
```bash
# Restore database from backup (if needed)
# Then roll back deployments
kubectl rollout undo deployment/api-gateway
# ... etc
```

---

## Migrations

### Running Database Migrations

**Safe Migration Practices**:
- Always backup first
- Test migrations in staging
- Run during low-traffic hours
- Use transactions when possible
- Avoid table locks on large tables

**Migration Types**:

1. **Safe Migrations (Auto-Apply)**:
   - Adding nullable columns
   - Creating indexes CONCURRENTLY
   - Adding new tables

2. **Risky Migrations (Require Approval)**:
   - Dropping columns/tables
   - Altering column types
   - Data migrations on large tables

**Step-by-Step**:

1. **Review Migration**:
   ```bash
   # Check what migration will do
   pnpm prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
   ```

2. **Create Migration**:
   ```bash
   pnpm prisma migrate dev --name descriptive_migration_name
   ```

3. **Test Locally**:
   ```bash
   pnpm prisma migrate deploy
   pnpm -r test
   ```

4. **Deploy to Staging**:
   See [Standard Deployment](#standard-deployment-staging)

5. **Deploy to Production**:
   See [Production Deployment](#production-deployment)

**Check Migration Status**:
```bash
# Via Prisma
pnpm prisma migrate status

# Via Kubernetes
kubectl logs job/migrate
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| SEV-1 | Complete outage, all users affected | 15 mins |
| SEV-2 | Partial outage, critical features broken | 1 hour |
| SEV-3 | Minor issues, non-critical features | 4 hours |

### SEV-1 Incident Response

1. **Detection & Alerting**:
   - On-call engineer paged via PagerDuty
   - #incident Slack channel auto-created

2. **Assemble Team**:
   - On-call engineer (lead)
   - Engineering manager
   - Product manager (if needed)

3. **Initial Assessment (10 mins)**:
   - Check monitoring dashboards
   - Look at recent deploys
   - Check logs for errors
   - Post summary in #incident

4. **Containment**:
   - Roll back bad deploy if suspected
   - Scale up resources if load-related
   - Disable non-critical features if needed

5. **Mitigation**:
   - Implement temporary fix
   - Restore service as quickly as possible

6. **Resolution**:
   - Deploy permanent fix
   - Verify service restored
   - Monitor for 30 minutes

7. **Post-Incident**:
   - Write incident report within 24 hours
   - Schedule review meeting within 5 days
   - Implement preventive actions

### Useful Incident Commands

```bash
# Check all pods
kubectl get pods -o wide

# Check pod logs
kubectl logs -f deployment/api-gateway

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resources
kubectl top pods
kubectl top nodes

# Exec into pod
kubectl exec -it <pod-name> -- /bin/sh

# Check service status
kubectl get svc
kubectl describe svc <service-name>
```

---

## Provider Outages (Paystack, Flutterwave)

### Paystack Outage

**Detection**:
- Payment webhooks failing
- Payment success rate dropping
- Paystack status page shows outage

**Response**:

1. **Verify Outage**:
   - Check [Paystack Status](https://status.paystack.com)
   - Confirm in our logs

2. **Temporary Measures**:
   - Display status banner on payment pages
   - Queue payment callbacks to process later
   - Disable new payment initiations if severe
   - Fall back to Flutterwave if possible

3. **Monitor**:
   - Watch Paystack status page
   - Monitor our queue backlog

4. **Recovery**:
   - When Paystack recovers:
     - Process queued callbacks
     - Reconcile any missing transactions
     - Verify wallet balances

**Useful Commands**:
```bash
# Check payment queue depth
kubectl exec -it deployment/wallet-service -- curl http://localhost:3000/metrics | grep queue_depth

# List failed payments in last hour
# Run query in admin dashboard or database
```

### Flutterwave Outage

Similar to Paystack outage response.

---

## Failed Payments

### Investigation Steps

1. **Check Payment Intent**:
   ```sql
   SELECT * FROM PaymentIntent
   WHERE id = 'payment-intent-id';
   ```

2. **Check Provider Response**:
   - Look at `providerResponse` JSON field
   - Check provider dashboard for more details

3. **Check Webhook Logs**:
   ```sql
   SELECT * FROM WebhookLog
   WHERE paymentIntentId = 'payment-intent-id'
   ORDER BY createdAt DESC;
   ```

4. **Common Failure Reasons**:
   - Insufficient funds
   - Card declined
   - Expired card
   - Network error
   - Fraud suspicion

### Retrying Failed Payments

For transient failures (network, provider issues):

1. **Manual Retry via Admin**:
   - Admin dashboard → Payments → Failed
   - Select payment → Retry

2. **Automated Retries**:
   - System automatically retries network failures up to 3 times
   - Exponential backoff: 1min, 5min, 15min

3. **User-Initiated Retry**:
   - User can retry from their payment history

### Reconciliation

**Weekly Reconciliation**:
1. Export transactions from payment provider
2. Compare with PaymentIntent table
3. Identify mismatches
4. Resolve discrepancies

---

## Queue Backlog

### Detection

- Alert when queue depth > 1000 for 5 minutes
- Metrics visible in Grafana

### Response

1. **Identify Which Queue**:
   ```bash
   # Check queue metrics
   kubectl exec -it deployment/queue-service -- curl http://localhost:3000/metrics
   ```

2. **Scale Up Workers**:
   ```bash
   # Increase HPA max replicas or manually scale
   kubectl scale deployment/queue-worker --replicas=10
   ```

3. **Investigate Backlog Cause**:
   - Check worker logs for errors
   - Are external providers slow/unavailable?
   - Did a spike in traffic occur?

4. **Process Stuck Jobs**:
   ```bash
   # If using Bull:
   # Access Bull Board to retry failed jobs
   # Or use API to bulk retry
   ```

5. **Prevent Recurrence**:
   - Adjust autoscaling thresholds
   - Add circuit breakers if external provider issue
   - Optimize slow jobs

---

## Media Processing Failures

### Detection

- Media service logs show failures
- Uploads stuck in "processing" state
- Alert for failed jobs rate

### Troubleshooting Steps

1. **Check Media Service Logs**:
   ```bash
   kubectl logs -f deployment/media-service
   ```

2. **Check Failed Jobs**:
   ```sql
   SELECT * FROM MediaJob
   WHERE status = 'failed'
   ORDER BY createdAt DESC
   LIMIT 50;
   ```

3. **Common Failures**:
   - File corrupted
   - Unsupported format
   - Out of disk space
   - FFmpeg error
   - S3 connection issues

4. **Retry Failed Jobs**:
   ```bash
   # Via admin dashboard or API
   POST /api/v1/admin/media/jobs/:id/retry
   ```

5. **Preventive Measures**:
   - Validate files before accepting upload
   - Set reasonable file size limits
   - Monitor disk space
   - Alert on high failure rate

---

## Database Restore

### When to Restore

- Accidental data deletion
- Corrupted data
- Failed migration
- Security breach

### Restore Process

**Prerequisites**:
- Recent backup available
- Maintenance window approved
- Users notified

**Steps**:

1. **Stop All Services**:
   ```bash
   kubectl scale deployment --all --replicas=0
   ```

2. **Restore Database**:
   ```bash
   # Using pg_dump backup
   psql -h $DB_HOST -U $DB_USER $DB_NAME < backup_20250101_120000.sql
   
   # Or using cloud provider restore
   # Follow AWS RDS / GCP Cloud SQL / Azure Database restore process
   ```

3. **Verify Restore**:
   ```sql
   -- Check critical tables have data
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM Wallet;
   SELECT COUNT(*) FROM PaymentIntent;
   ```

4. **Run Migrations (If Needed)**:
   - If restoring to an older version, you may need to re-run migrations

5. **Restart Services**:
   ```bash
   kubectl scale deployment --all --replicas=1
   # Wait for HPA to scale up as needed
   ```

6. **Verify Functionality**:
   - Run smoke tests
   - Check critical flows work
   - Monitor for 30 minutes

---

## On-Call Rotation

### Schedule

- 1 week shifts
- Handover every Monday at 9 AM
- Secondary on-call for backup

### Handover Checklist

1. **Review Ongoing Issues**:
   - Any pending incidents?
   - Any known issues to watch?

2. **Review Alerts**:
   - Are any alerts firing?
   - Any alerts that need tuning?

3. **Access**:
   - Confirm on-call has all necessary access
   - PagerDuty, AWS, Kubernetes, databases

4. **Documentation**:
   - Point to relevant runbooks
   - Note any recent changes

### Tools

- **PagerDuty**: Alerting
- **Slack**: Communication
- **Grafana**: Metrics
- **Kibana/CloudWatch**: Logs

---

## Quick Reference

### Useful Kubernetes Commands

```bash
# Get all resources
kubectl get all

# Describe resource
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>

# Port forward
kubectl port-forward svc/api-gateway 3000:80

# Check config maps
kubectl get configmaps
kubectl get configmap <config-name> -o yaml

# Check secrets (redacted)
kubectl get secrets
kubectl get secret <secret-name> -o yaml

# Force delete pod (if stuck)
kubectl delete pod <pod-name> --grace-period=0 --force
```

### Useful Database Queries

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

Last Updated: 2025
