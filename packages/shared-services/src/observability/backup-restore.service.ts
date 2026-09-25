/**
 * Backup & Restore Service (TAA §62, §63)
 *
 * Manages backup and restore operations:
 * - Automated encrypted database backups
 * - Point-in-time recovery support
 * - Object-store versioning/lifecycle
 * - Restore test scheduling
 * - DR exercise tracking
 */

export type BackupType = 'database' | 'object-store' | 'config' | 'secrets';

export type BackupStatus = 'scheduled' | 'running' | 'completed' | 'failed';

export type RestoreTestStatus = 'scheduled' | 'running' | 'passed' | 'failed';

export interface BackupSchedule {
  /** Schedule ID */
  id: string;
  /** Schedule name */
  name: string;
  /** Backup type */
  type: BackupType;
  /** Service/resource */
  service: string;
  /** Cron expression */
  cronExpression: string;
  /** Retention period (days) */
  retentionDays: number;
  /** Encryption enabled */
  encrypted: boolean;
  /** Cross-region replication */
  crossRegionReplication: boolean;
  /** Enabled */
  enabled: boolean;
}

export interface BackupRecord {
  /** Backup ID */
  id: string;
  /** Schedule ID */
  scheduleId: string;
  /** Backup type */
  type: BackupType;
  /** Service */
  service: string;
  /** Status */
  status: BackupStatus;
  /** Size in bytes */
  sizeBytes: number;
  /** Location */
  location: string;
  /** Encryption key ID */
  encryptionKeyId?: string;
  /** Created at */
  createdAt: Date;
  /** Completed at */
  completedAt?: Date;
  /** Error message */
  error?: string;
}

export interface RestoreTest {
  /** Test ID */
  id: string;
  /** Backup ID */
  backupId: string;
  /** Service */
  service: string;
  /** Status */
  status: RestoreTestStatus;
  /** RTO achieved (minutes) */
  rtoAchieved: number;
  /** RPO achieved (minutes) */
  rpoAchieved: number;
  /** Notes */
  notes: string;
  /** Scheduled at */
  scheduledAt: Date;
  /** Completed at */
  completedAt?: Date;
}

export interface DRExercise {
  /** Exercise ID */
  id: string;
  /** Exercise name */
  name: string;
  /** Exercise type */
  type: 'tabletop' | 'technical' | 'full';
  /** Frequency */
  frequency: 'quarterly' | 'semi-annually' | 'annually';
  /** Last executed */
  lastExecuted: Date;
  /** Next scheduled */
  nextScheduled: Date;
  /** Participants */
  participants: string[];
  /** Results */
  results?: string;
}

export interface RecoveryTier {
  /** Tier name */
  name: string;
  /** Tier description */
  description: string;
  /** RTO target (minutes) */
  rtoTarget: number;
  /** RPO target (minutes) */
  rpoTarget: number;
  /** Components covered */
  components: string[];
}

/** Recovery tiers (TAA §63) */
export const RECOVERY_TIERS: RecoveryTier[] = [
  {
    name: 'Tier A',
    description: 'Instance/AZ/service failure',
    rtoTarget: 60,
    rpoTarget: 5,
    components: ['auth-service', 'content-service', 'api-gateway', 'media-service'],
  },
  {
    name: 'Tier B',
    description: 'Destructive data incident',
    rtoTarget: 240,
    rpoTarget: 0, // PITR
    components: ['database', 'object-store'],
  },
  {
    name: 'Tier C',
    description: 'Primary-region loss',
    rtoTarget: 480,
    rpoTarget: 15,
    components: ['all-services', 'database', 'object-store', 'cdn'],
  },
  {
    name: 'Tier D',
    description: 'Vendor ecosystem failure',
    rtoTarget: 0, // Per provider runbook
    rpoTarget: 0,
    components: ['external-providers'],
  },
];

/** Recovery order (TAA §63) */
export const RECOVERY_ORDER = [
  'Identity/secrets/network',
  'Authoritative database/ledgers',
  'Rights/entitlement policy',
  'Core API',
  'Media authorisation',
  'Admin/support',
  'Rewards/participation',
  'Notifications/analytics/noncritical',
];

export class BackupRestoreService {
  private readonly schedules: Map<string, BackupSchedule> = new Map();
  private readonly backups: BackupRecord[] = [];
  private readonly restoreTests: RestoreTest[] = [];
  private readonly drExercises: DRExercise[] = [];

  /**
   * Add a backup schedule
   */
  addSchedule(schedule: BackupSchedule): void {
    this.schedules.set(schedule.id, schedule);
  }

  /**
   * Record a backup
   */
  recordBackup(record: Omit<BackupRecord, 'id'>): BackupRecord {
    const newRecord: BackupRecord = {
      ...record,
      id: `backup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    this.backups.push(newRecord);
    return newRecord;
  }

  /**
   * Get backups for a service
   */
  getBackupsForService(service: string): BackupRecord[] {
    return this.backups
      .filter((b) => b.service === service)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get latest backup for a service
   */
  getLatestBackup(service: string): BackupRecord | undefined {
    return this.getBackupsForService(service)[0];
  }

  /**
   * Record a restore test
   */
  recordRestoreTest(test: Omit<RestoreTest, 'id'>): RestoreTest {
    const newTest: RestoreTest = {
      ...test,
      id: `restore_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    this.restoreTests.push(newTest);
    return newTest;
  }

  /**
   * Get restore test history
   */
  getRestoreTestHistory(service?: string): RestoreTest[] {
    let tests = this.restoreTests;
    if (service) {
      tests = tests.filter((t) => t.service === service);
    }
    return tests.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
  }

  /**
   * Add a DR exercise
   */
  addDRExercise(exercise: DRExercise): void {
    this.drExercises.push(exercise);
  }

  /**
   * Get DR exercises
   */
  getDRExercises(): DRExercise[] {
    return this.drExercises;
  }

  /**
   * Get pending DR exercises
   */
  getPendingDRExercises(): DRExercise[] {
    const now = new Date();
    return this.drExercises.filter((e) => e.nextScheduled <= now);
  }

  /**
   * Get backup summary
   */
  getSummary(): {
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    lastBackupDate: Date | null;
    restoreTestsPassed: number;
    restoreTestsFailed: number;
    pendingDRExercises: number;
  } {
    const successfulBackups = this.backups.filter((b) => b.status === 'completed').length;
    const failedBackups = this.backups.filter((b) => b.status === 'failed').length;
    const lastBackup = this.backups
      .filter((b) => b.status === 'completed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      totalBackups: this.backups.length,
      successfulBackups,
      failedBackups,
      lastBackupDate: lastBackup?.createdAt || null,
      restoreTestsPassed: this.restoreTests.filter((t) => t.status === 'passed').length,
      restoreTestsFailed: this.restoreTests.filter((t) => t.status === 'failed').length,
      pendingDRExercises: this.getPendingDRExercises().length,
    };
  }

  /**
   * Check if backup is within SLA
   */
  checkBackupSLA(service: string): {
    compliant: boolean;
    lastBackupAge: number;
    issues: string[];
  } {
    const latestBackup = this.getLatestBackup(service);
    const issues: string[] = [];

    if (!latestBackup) {
      return {
        compliant: false,
        lastBackupAge: Infinity,
        issues: ['No backups found for service'],
      };
    }

    const lastBackupAge = (Date.now() - latestBackup.createdAt.getTime()) / (1000 * 60 * 60);

    if (lastBackupAge > 24) {
      issues.push(`Last backup is ${Math.round(lastBackupAge)} hours old`);
    }

    if (latestBackup.status === 'failed') {
      issues.push('Latest backup failed');
    }

    return {
      compliant: issues.length === 0,
      lastBackupAge: Math.round(lastBackupAge * 100) / 100,
      issues,
    };
  }
}
