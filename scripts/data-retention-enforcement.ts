#!/usr/bin/env ts-node

/**
 * Data Retention Policy Enforcement Job
 * This script runs daily to enforce data retention policies and clean up expired user data
 */

import { PrismaClient } from '@prisma/client';
import { DataClassification, PiiCategory, DEFAULT_RETENTION_POLICIES } from '@azeebo/shared-types';

const prisma = new PrismaClient();

interface RetentionResult {
  deletedCount: number;
  archivedCount: number;
  errors: string[];
}

async function enforceDataRetention(): Promise<RetentionResult> {
  const results: RetentionResult = {
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
  };

  for (const policy of DEFAULT_RETENTION_POLICIES) {
    try {
      const cutoffDate = calculateCutoffDate(policy.retentionPeriod);

      // Delete analytics PII after retention period
      if (policy.classification === DataClassification.PII) {
        const deleteResult = await prisma.analyticsEvent.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            category: 'PII_ACCESS',
          },
        });
        results.deletedCount += deleteResult.count;
      }

      // Archive messages older than retention period
      if (policy.classification === DataClassification.COMMUNICATIONS) {
        const archiveResult = await prisma.message.updateMany({
          where: {
            createdAt: { lt: cutoffDate },
            archived: false,
          },
          data: { archived: true },
        });
        results.archivedCount += archiveResult.count;
      }

      // Hard delete old audit logs (keep summary only)
      const auditDeleteResult = await prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          action: { in: ['VIEW', 'DOWNLOAD'] },
        },
      });
      results.deletedCount += auditDeleteResult.count;
    } catch (error) {
      results.errors.push(`Error processing ${policy.classification}: ${(error as Error).message}`);
    }
  }

  return results;
}

function calculateCutoffDate(duration: string): Date {
  // Parse ISO 8601 duration format
  // P1095D = 1095 days (3 years)
  const daysMatch = duration.match(/P(\d+)D/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
  // PINF = infinite (never delete)
  return new Date(0);
}

// Run the retention job
enforceDataRetention()
  .then((results) => {
    console.log(
      `Data retention enforcement complete: ${results.deletedCount} records deleted, ${results.archivedCount} archived`
    );
    if (results.errors.length > 0) {
      console.error('Errors:', results.errors);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Data retention enforcement failed:', error);
    process.exit(1);
  });
