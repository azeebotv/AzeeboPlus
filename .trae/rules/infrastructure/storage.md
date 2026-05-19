# Azeebo+ Storage Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines storage standards for Azeebo+ including databases, object storage, and caching.

---

## Database Standards

### PostgreSQL

```hcl
# ✅ Good - RDS Configuration
resource "aws_db_instance" "main" {
  identifier           = "azeebo-plus-${var.environment}-db"
  allocated_storage    = 100
  engine               = "postgres"
  engine_version       = "14.9"
  instance_class       = "db.t3.medium"
  db_name              = "azeebo_plus"
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres14"

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.db.arn

  # SSL
  iam_database_authentication_enabled = true

  # Backup
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Multi-AZ
  multi_az = var.environment == "production"

  # Security
  skip_final_snapshot = false
  final_snapshot_identifier = "azeebo-plus-${var.environment}-db-final"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Performance Insights
  performance_insights_enabled = var.environment == "production"

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

### Database Connection Pooling

```yaml
# ✅ Good - Connection pool settings
pool:
  min: 5
  max: 20
  acquireTimeout: 10000
  idleTimeout: 600000
  maxLifetime: 1800000
```

---

## Redis Standards

### Redis Configuration

```hcl
# ✅ Good - ElastiCache Configuration
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "azeebo-plus-${var.environment}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  # Encryption
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  # Security
  security_group_ids = [aws_security_group.redis.id]

  # Backup
  snapshot_window     = "03:00-04:00"
  snapshot_retention_limit = 7

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

### Redis Use Cases

| Use Case | TTL | Eviction Policy |
|----------|-----|-----------------|
| Session cache | 30 min | LRU |
| API response cache | 5 min | LRU |
| Rate limiting | 1 min | TTL only |
| Leaderboards | No expiry | Allkeys-lru |

---

## Object Storage Standards

### S3 Bucket Configuration

```hcl
# ✅ Good - S3 Bucket Configuration
resource "aws_s3_bucket" "media" {
  bucket = "azeebo-plus-${var.environment}-media"
  force_destroy = true

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}
```

### S3 Access Patterns

| Path | Access Pattern | TTL | CDN |
|------|----------------|-----|-----|
| `/public/` | Public | 1 hour | Yes |
| `/premium/` | Private | 15 min | Yes (signed URLs) |
| `/uploads/` | Private | N/A | No |
| `/backups/` | Private | N/A | No |

---

## Media Processing

### Media Pipeline

```
Upload → S3 → Lambda → Transcode → S3 → CloudFront
```

### Lambda Media Processing

```typescript
// ✅ Good - Media processing Lambda
export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    // Skip if already processed
    if (key.includes('/processed/')) {
      return;
    }

    // Process media
    const processedKey = await processMedia(bucket, key);

    // Trigger notification
    await notifyProcessingComplete(processedKey);
  }
};
```

---

## Backup & Recovery

### Database Backup

```hcl
# ✅ Good - Database backup configuration
resource "aws_db_instance" "main" {
  # ... existing config ...

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  skip_final_snapshot = false
}
```

### Backup Schedule

| Environment | Backup Frequency | Retention |
|-------------|------------------|-----------|
| Development | Daily | 7 days |
| Staging | Daily | 14 days |
| Production | Daily | 30 days |

### Disaster Recovery

| RTO | RPO |
|-----|-----|
| 4 hours | 1 hour |

---

## Storage Monitoring

### Database Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| `FreeStorageSpace` | < 10% |
| `DatabaseConnections` | > 80% of max |
| `ReadIOPS` | > 80% of max |
| `WriteIOPS` | > 80% of max |
| `ReplicaLag` | > 10 seconds |

### Redis Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| `FreeableMemory` | < 20% |
| `UsedMemory` | > 80% |
| `EvictedKeys` | > 100/min |
| `KeyspaceHits` | < 90% |

### S3 Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| `4xxErrors` | > 100/min |
| `5xxErrors` | > 10/min |
| `BytesDownloaded` | Spike detection |
| `BytesUploaded` | Spike detection |

---

## Data Classification

| Level | Examples | Encryption | Access |
|-------|----------|------------|--------|
| Public | Content thumbnails | Optional | Public |
| Internal | Logs, analytics | Recommended | Internal |
| Sensitive | User data | AES-256 | Restricted |
| Secret | Payment data | AES-256 + KMS | Minimal |

---

## Data Retention

| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| User data | 7 years | Manual |
| Analytics | 1 year | Auto |
| Logs | 30 days | Auto |
| Media | 1 year | Auto |
| Backups | 30 days | Auto |

---

## Prohibited Actions

- No storing secrets in database
- No disabling encryption
- No public S3 buckets
- No unbounded Redis keys
- No large objects in database
- No direct database access from frontend
- No disabling backups
- No sharing credentials