# Data Retention & Archival Policy

**Version:** 1.0
**Last Updated:** May 15, 2026

---

## Overview

This document outlines the data retention and archival policies for the Azeebo+ platform to ensure compliance with GDPR, data privacy regulations, and storage cost optimization.

---

## Retention Schedule

### User Data

| Data Type | Retention Period | Archival Trigger | Deletion Trigger |
|-----------|-----------------|-------------------|------------------|
| User accounts (active) | Indefinite | N/A | Account deletion request |
| User accounts (inactive) | 2 years after last activity | After 1 year of inactivity | After 2 years of inactivity |
| User profile data | Indefinite | N/A | Account deletion request |
| User preferences | Until account deletion | N/A | Account deletion request |

### Financial Data

| Data Type | Retention Period | Legal Requirement |
|-----------|-----------------|-------------------|
| Wallet transactions | 7 years | Tax/Financial regulations |
| Payment records | 7 years | Tax/Financial regulations |
| Subscription records | 7 years after subscription ends | Tax/Financial regulations |
| Invoice records | 7 years | Tax/Financial regulations |
| Refund records | 7 years | Tax/Financial regulations |

### Content Data

| Data Type | Retention Period | Archival Trigger | Deletion Trigger |
|-----------|-----------------|-------------------|------------------|
| Published content | Indefinite | N/A | Takedown request/Copyright |
| Draft content | 90 days | After 60 days of no edit | After 90 days of no edit |
| Deleted content (soft) | 30 days | Immediately after soft delete | After 30 days |
| Content views/analytics | 2 years | After 1 year | After 2 years |
| Comments | 1 year after content deletion | N/A | Content deletion |

### Activity Logs

| Data Type | Retention Period | Archival Trigger |
|-----------|-----------------|------------------|
| Authentication logs | 2 years | After 1 year |
| Audit logs | 2 years | After 1 year |
| Access logs | 90 days | After 60 days |
| Error logs | 30 days | After 15 days |
| Performance logs | 30 days | After 15 days |

### Marketing & Communications

| Data Type | Retention Period | Deletion Trigger |
|-----------|-----------------|------------------|
| Email subscriptions | Until unsubscribed | Unsubscribe request |
| Push notification history | 30 days | Immediately |
| Campaign analytics | 2 years | After 1 year |

---

## Archival Procedures

### Automated Archival (Cronjob)

```bash
# Archive inactive users
0 2 * * * /app/scripts/archive-inactive-users.sh

# Archive old logs
0 3 * * * /app/scripts/archive-old-logs.sh

# Delete soft-deleted content after 30 days
0 4 * * * /app/scripts/purge-deleted-content.sh

# Archive old analytics data
0 5 * * * /app/scripts/archive-analytics.sh
```

### Archival Shell Scripts

#### archive-inactive-users.sh

```bash
#!/bin/bash
# Archives user data after 1 year of inactivity
INACTIVE_DATE=$(date -d "1 year ago" +%Y-%m-%d)

psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
UPDATE users
SET archived = true, archived_at = NOW()
WHERE last_activity < '$INACTIVE_DATE'
AND archived = false
AND status != 'suspended';
EOF

echo "Archived users inactive since $INACTIVE_DATE"
```

#### purge-deleted-content.sh

```bash
#!/bin/bash
# Permanently deletes content that has been soft-deleted for 30+ days
DELETE_DATE=$(date -d "30 days ago" +%Y-%m-%d)

psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
DELETE FROM content
WHERE deleted_at IS NOT NULL
AND deleted_at < '$DELETE_DATE';
EOF

echo "Purged content deleted before $DELETE_DATE"
```

---

## Data Deletion Procedures

### User-Initiated Deletion (GDPR Right to Erasure)

When a user requests account deletion:

1. **Immediate Actions:**
   - Revoke all active sessions and tokens
   - Disable login access
   - Remove PII from marketing databases

2. **Delayed Deletion (30-day grace period):**
   - Keep account disabled
   - Process any pending transactions
   - Retain data for legal compliance

3. **Permanent Deletion (after grace period):**
   - Anonymize transaction records (keep for 7 years)
   - Delete personal profile data
   - Remove from all user tables
   - Delete associated content or transfer ownership

### Deletion Request Workflow

```typescript
// UserService.deleteUser()
async deleteUser(userId: string, gracePeriodDays: number = 30): Promise<void> {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  // Soft delete immediately
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      status: 'pending_deletion',
    },
  });

  // Schedule permanent deletion
  await this.schedulePermanentDeletion(userId, gracePeriodDays);

  // Remove from marketing systems
  await this.emailService.unsubscribe(user.email);
  await this.pushService.removeDeviceTokens(userId);
}

// Permanent deletion after grace period
async permanentlyDeleteUser(userId: string): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // Anonymize financial records
    await tx.walletTransaction.updateMany({
      where: { wallet: { userId } },
      data: {
        userId: null,
        metadata: { anonymized: true, originalUserId: userId },
      },
    });

    // Delete user profile
    await tx.user.delete({ where: { id: userId } });
  });

  // Clear CDN assets
  await this.cdnService.deleteUserAssets(userId);
}
```

---

## Data Anonymization

For analytics and reporting that require historical data:

```typescript
// AnonymizeUserData
async anonymizeUserData(userId: string): Promise<void> {
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@anonymized.local`,
      phone: null,
      firstName: 'Deleted',
      lastName: 'User',
      avatar: null,
      metadata: { anonymized: true, anonymizedAt: new Date() },
    },
  });
}
```

---

## Compliance Requirements

### GDPR Compliance

- [ ] Right to access: Implemented via data export endpoint
- [ ] Right to rectification: Implemented via profile update
- [ ] Right to erasure: Implemented via deletion workflow
- [ ] Right to data portability: Export to JSON format
- [ ] Data minimization: Only collect necessary data

### Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| Public | Content, profiles | No special handling |
| Internal | Logs, analytics | Access control only |
| Sensitive | Payments, PII | Encryption + access control |
| Confidential | Secrets, keys | Encryption + audit logging |

---

## Monitoring & Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| DataRetentionViolation | Data older than retention period not archived | Immediate investigation |
| DeletionRequestBacklog | >100 pending deletion requests | Scale up deletion workers |
| ArchivalFailure | Archive job fails 3 consecutive times | Page on-call |

---

## Review & Updates

This policy is reviewed quarterly and updated as needed to comply with:
- GDPR and ePrivacy regulations
- Local data protection laws
- Industry best practices
- Business requirements

**Last Updated:** May 15, 2026
**Next Review:** August 15, 2026
