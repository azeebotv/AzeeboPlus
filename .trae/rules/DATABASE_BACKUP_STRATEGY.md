# Database Migration & Backup Strategy

## Overview
This document outlines the database migration strategy for Azeebo+ production deployment.

---

## Database Migration Strategy

### Pre-Migration Checklist
- [ ] Full backup completed (point-in-time recovery enabled
- [ ] Migration tested on staging first
- [ ] Migration script reviewed by 2+ engineers
- [ ] Rollback plan ready
- [ ] Maintenance window scheduled
- [ ] Stakeholders notified
- [ ] Monitoring alerts enabled
- [ ] Dry run performed

### Migration Steps
1. **Quiesce database (set to read-only)
2. **Take final backup
3. **Apply migration script in transaction
4. **Verify migration success
5. **Bring database back online
6. **Run validation queries
7. **Deploy application
8. **Run smoke tests

### Rollback Plan
- If migration fails within transaction rolls back automatically
- If partial failure: restore from backup
- Point-in-time recovery to before migration started

---

## Backup Strategy

### Backup Schedule
| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full Database Backup | Daily @ 02:00 UTC | 30 days |
| Incremental/Transaction Log Backup | Hourly | 7 days |
| Point-in-Time Recovery (PITR) | Continuous | 7 days |
| Weekly Full Backup | Weekly @ Sunday 00:00 UTC | 90 days |
| Monthly Archive Backup | Monthly @ 1st of month | 1 year |

### Backup Verification
- Daily automated verification: daily @ 04:00 UTC
- Weekly verification of Sunday full backup
- Monthly restore test to staging
- Verify integrity checks:
  - WAL/log shipping
  - Replica integrity
  - Point-in-time recovery

### Backup Locations
- Primary: cloud object storage (S3/GCS) encrypted at rest
- Secondary: cross-region/cross-cloud
- Offline: quarterly archive (optional)
- Tertiary: offsite cold storage

### Backup Retention Policies
| Backup Type | Retention Period | Purge Schedule |
|-------------|------------------|----------------|
| Daily Incremental | 7 days | Daily after 7 days |
| Daily Full | 30 days | Daily after 30 days |
| Weekly Full | 90 days | Weekly after 90 days |
| Monthly Archive | 1 year | Monthly after 1 year |
| Disaster Recovery | 7 years | Manual review |

### Storage Classes
| Backup Type | Storage Class | Replication |
|-------------|---------------|-------------|
| Daily Incremental | Standard | Multi-AZ |
| Daily Full | Standard | Multi-AZ |
| Weekly Full | Standard-IA | Multi-AZ |
| Monthly Archive | Glacier Deep Archive | Cross-region |

### Restore Testing
- Weekly: restore to staging from last full backup
- Monthly: test point-in-time recovery
- Quarterly: test disaster recovery failover

### Restore Procedures

#### PostgreSQL Restore - Full Backup

```bash
# 1. Download backup from S3
aws s3 cp s3://${AWS_S3_BACKUP_BUCKET}/postgres/${BACKUP_FILE} /tmp/backup.sql.gz.gpg

# 2. Decrypt the backup
gpg --batch --decrypt --recipient ${GPG_RECIPIENT} /tmp/backup.sql.gz.gpg | zcat > /tmp/backup.sql

# 3. Stop application services
kubectl scale deployment --all --replicas=0 -n azeebo

# 4. Restore database
psql -h postgres -U ${POSTGRES_USER} -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
psql -h postgres -U ${POSTGRES_USER} -d postgres -c "CREATE DATABASE ${POSTGRES_DB};"
psql -h postgres -U ${POSTGRES_USER} -d ${POSTGRES_DB} < /tmp/backup.sql

# 5. Verify restore
psql -h postgres -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT count(*) FROM users;"

# 6. Start application services
kubectl scale deployment --all --replicas=1 -n azeebo

# 7. Run smoke tests
curl -f http://api.azeebo.com/v1/health || exit 1
```

#### PostgreSQL Restore - Point-in-Time Recovery

```bash
# 1. Identify target timestamp
TARGET_TIME="2024-01-15 10:30:00 UTC"

# 2. Stop application services
kubectl scale deployment --all --replicas=0 -n azeebo

# 3. Restore base backup
pg_basebackup -h postgres -U ${POSTGRES_USER} -D /var/lib/postgresql/data \
  --write-recovery-conf --progress

# 4. Create recovery.conf with target time
cat > /var/lib/postgresql/data/recovery.conf <<EOF
restore_command = 'aws s3 cp s3://${WAL_BUCKET}/%f %p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_action = 'promote'
EOF

# 5. Start postgres
systemctl start postgresql

# 6. Verify recovery
psql -h postgres -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT NOW();"

# 7. Start application services
kubectl scale deployment --all --replicas=1 -n azeebo
```

#### Redis Restore

```bash
# 1. Download backup from S3
aws s3 cp s3://${AWS_S3_BACKUP_BUCKET}/redis/${BACKUP_FILE} /tmp/redis_backup.rdb.gz.gpg

# 2. Decrypt and decompress
gpg --batch --decrypt --recipient ${GPG_RECIPIENT} /tmp/redis_backup.rdb.gz.gpg | zcat > /tmp/dump.rdb

# 3. Stop Redis
kubectl scale statefulset redis --replicas=0 -n azeebo

# 4. Copy backup to data directory
kubectl cp /tmp/dump.rdb redis-0:/data/dump.rdb -n azeebo

# 5. Start Redis
kubectl scale statefulset redis --replicas=3 -n azeebo

# 6. Verify restore
redis-cli -h redis ping
redis-cli -h redis dbsize
```

### Backup Encryption Standards
- **Algorithm:** AES-256-GCM for at-rest encryption
- **Key Management:** AWS KMS / HashiCorp Vault
- **GPG Recipients:** Minimum 2 key holders required for decryption
- **Key Rotation:** Quarterly key rotation
- **Access Control:** IAM policies restricting backup bucket access

### Backup Monitoring & Alerts
- Alert on backup failure (no backup in 24h)
- Alert on verification failure
- Alert on S3 bucket access anomalies
- Alert on encryption key expiration
- Weekly backup status report

---

## Production Database Configuration

### High Availability
- [ ] Primary-replica setup (1 primary, 2+ replicas)
- [ ] Automatic failover configured
- [ ] Synchronous replication for critical data
- [ ] Connection pooling (PgBouncer)
- [ ] Read replicas for read-heavy workloads

### Security
- [ ] Encryption at rest (AES-256)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Network isolation (private subnet only)
- [ ] IAM authentication (if cloud managed db)
- [ ] VPC peering only
- [ ] No public IP
- [ ] Security groups/network policies: restrict access

### Performance
- [ ] Read scaling replicas configured
- [ ] Connection pooling
- [ ] PgBouncer configured
- [ ] Auto-vacuum configured
- [ ] Maintenance window set
- [ ] Query timeout on long queries
- [ ] Slow query logging enabled

### Monitoring & Alerting
- [ ] Connection count alerting
- [ ] Replication lag alerting >5m
- [ ] Disk space alerting >85%
- [ ] CPU >90%
- [ ] Slow queries >1s
- [ ] Deadlocks
- [ ] WAL write stalls
- [ ] Backup failure alerts
- [ ] Failover events

---

## Production Redis Configuration

### High Availability
- [ ] Redis Cluster or Sentinel
- [ ] Auto-failover
- [ ] Persistence (AOF + RDB)
- [ ] Read replicas
- [ ] Connection pooling

### Backup
- [ ] Snapshot backup daily
- [ ] AOF rewrite scheduled
- [ ] Point-in-time via AOF
- [ ] Redis backup to S3

---

## Disaster Recovery Plan

### RTO & RPO
| RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|--------------------------------|----------------------------------|
| 4 hours | 1 hour |

### Recovery Process
1. **Detection: monitoring alerts
2. **Assessment**: failure type/impact
3. **Decision**: failover or restore
4. **Execution**: failover/restore
5. **Validation**: health check
6. **Communication**: update stakeholders
7. **Postmortem**: learnings documented

### Failover Process
1. Promote replica to primary
2. Update DNS/connection strings
3. Verify application re-connect
4. Set up new replica

### Restore from Backup
1. Stop application
2. Restore database
3. Verify database
4. Restart application
5. Validate data integrity
6. Smoke tests

---

## Sign-Off
| Role | Name | Signature | Date |
|------|------|-----------|------|
| DevOps Lead | | | |
| DBA (if applicable) | | | |
| Engineering Lead | | | |
| CTO | | | |

