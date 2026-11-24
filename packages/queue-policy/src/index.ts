// ============================================================================
// Shared BullMQ job-retention policy
// ============================================================================
//
// queue-service and engagement-service both register `BullModule.forRoot()`.
// Keeping the completed/failed job retention windows in this one place (rather
// than hand-copying them into each service's `defaultJobOptions`) means the two
// services can't silently drift on how long finished jobs are kept around.
//
// Pass the policy as `defaultJobOptions`:
//
//   BullModule.forRoot({
//     connection: { ... },
//     defaultJobOptions: JOB_RETENTION_POLICY,
//   })
// ============================================================================

/** Retention window for one finished-job bucket (BullMQ `KeepJobs` shape). */
export interface KeepJobsPolicy {
  /** Keep finished jobs for this many seconds before removing them. */
  age: number;
  /** Keep at most this many finished jobs (most recent first). */
  count?: number;
  /** Maximum quantity of jobs to remove in a single cleanup pass. */
  limit?: number;
}

/** Completed/failed retention policy applied to every queue in the service. */
export interface JobRetentionPolicy {
  removeOnComplete: KeepJobsPolicy;
  removeOnFail: KeepJobsPolicy;
}

/** Worker-level lock settings shared by every BullMQ worker in the repo. */
export interface WorkerLockSettings {
  /** How long (ms) a worker holds a job's lock before it can be declared stalled and handed to another worker. */
  lockDuration: number;
  /** How often (ms) the worker renews its locks (the stalled-job check cadence). */
  stalledInterval: number;
}

/**
 * Canonical worker lock settings for every `BullModule.registerQueue` in the
 * repo. BullMQ's default lockDuration is 30s: payment jobs that call external
 * providers (Paystack/Flutterwave) can exceed it, after which BullMQ declares
 * the job stalled and re-runs it — duplicate-charge territory. stalledInterval
 * must stay shorter than lockDuration so locks are renewed well before expiry.
 */
export const WORKER_LOCK_SETTINGS: WorkerLockSettings = {
  lockDuration: 120000, // 2 minutes
  stalledInterval: 30000,
};

/**
 * Canonical job-retention policy for every `BullModule.forRoot` in the repo.
 *
 * - Completed jobs are pruned after 1 day, or once 1000 remain (whichever first).
 * - Failed jobs — the ones ops may need to inspect or re-run — are kept for a
 *   full week, or until 5000 remain.
 */
export const JOB_RETENTION_POLICY: JobRetentionPolicy = {
  removeOnComplete: {
    age: 86400, // 1 day
    count: 1000,
  },
  removeOnFail: {
    age: 604800, // 7 days
    count: 5000,
  },
};
