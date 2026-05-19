# Azeebo+ Disaster Recovery Runbook

## Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| RPO | 4 hours | Maximum acceptable data loss |
| RTO | 2 hours | Maximum acceptable downtime |
| Backup Frequency | Every 4 hours | PostgreSQL and Redis backups |
| Backup Retention | 30 days | Daily backups kept for 30 days |

## Emergency Contacts

| Role | Contact |
|------|---------|
| Engineering On-Call | PagerDuty: azeebo-oncall |
| Database Admin | dba-team@azeebo.com |
| Infrastructure | infra-team@azeebo.com |

## Incident Severity Levels

### SEV-1: Complete Outage
- All services down
- RTO: 1 hour
- Response: Immediate escalation, war room

### SEV-2: Partial Outage
- Some services unavailable
- RTO: 2 hours
- Response: Urgent response within 15 minutes

### SEV-3: Degraded Service
- Performance issues
- RTO: 4 hours
- Response: Business hours response

## Recovery Procedures

### 1. Database Recovery (PostgreSQL)

```bash
# Identify the backup to restore
BACKUP_FILE="azeebo_backup_YYYYMMDD_HHMMSS.sql.gz.gpg"

# Download backup from S3
aws s3 cp s3://azeebo-backups/postgres/${BACKUP_FILE} /tmp/restore/

# Decrypt backup
gpg --batch --decrypt --recipient azeebo@azeebo.com /tmp/restore/${BACKUP_FILE} > /tmp/restore/backup.sql.gz

# Stop all services
kubectl scale deployment --all -n azeebo --replicas=0

# Restore database
gunzip -c /tmp/restore/backup.sql.gz | psql -h postgres.azeebo.svc.cluster.local -U postgres -d azeebo_prod

# Restart services
kubectl scale deployment --all -n azeebo --replicas=1

# Verify restoration
kubectl exec -it postgres-0 -n azeebo -- psql -U postgres -d azeebo_prod -c "SELECT COUNT(*) FROM users;"
```

### 2. Redis Recovery

```bash
# Identify backup
BACKUP_FILE="redis_backup_YYYYMMDD_HHMMSS.rdb.gz.gpg"

# Download and decrypt
aws s3 cp s3://azeebo-backups/redis/${BACKUP_FILE} /tmp/restore/
gpg --batch --decrypt --recipient azeebo@azeebo.com /tmp/restore/${BACKUP_FILE} > /tmp/restore/redis.rdb.gz

# Stop Redis
kubectl scale deployment redis -n azeebo --replicas=0

# Restore
gunzip -c /tmp/restore/redis.rdb.gz > /data/dump.rdb

# Start Redis
kubectl scale deployment redis -n azeebo --replicas=1
```

### 3. Full Service Recovery

```bash
# Run the recovery script
./scripts/full-recovery.sh --backup-timestamp YYYYMMDD_HHMMSS --environment production

# Verify all services are healthy
./scripts/health-check.sh --all-services

# Run smoke tests
./scripts/smoke-tests.sh --environment production
```

### 4. Rollback Deployment

```bash
# Immediate rollback to previous version
kubectl rollout undo deployment/api-gateway -n azeebo
kubectl rollout undo deployment/auth-service -n azeebo
kubectl rollout undo deployment/user-service -n azeebo
kubectl rollout undo deployment/wallet-service -n azeebo
kubectl rollout undo deployment/payment-service -n azeebo
kubectl rollout undo deployment/content-service -n azeebo

# Verify rollback
kubectl rollout status deployment/api-gateway -n azeebo
```

## Backup Verification Checklist

- [ ] PostgreSQL backup exists in S3
- [ ] Redis backup exists in S3
- [ ] Backups are less than 24 hours old
- [ ] Backup verification job succeeded
- [ ] Test restore completed successfully (quarterly)

## Restore Drill Schedule

| Frequency | Scope | Owner |
|-----------|-------|-------|
| Monthly | PostgreSQL restore test | DBA Team |
| Quarterly | Full disaster simulation | Engineering |
| Annually | Complete RTO/RPO verification | CTO |

## Checklist for Complete Outage

- [ ] Assess scope of outage
- [ ] Notify stakeholders via status page
- [ ] Identify root cause
- [ ] Execute recovery procedures
- [ ] Verify data integrity
- [ ] Confirm service health
- [ ] Update status page
- [ ] Post-incident review within 48 hours