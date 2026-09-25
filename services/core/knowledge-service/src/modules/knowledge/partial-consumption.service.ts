import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Partial Consumption Tracking (AZP-KNOW-007)
//
// Tracks partial consumption of content to enable:
// - Resume functionality
// - Knowledge unlock at specific checkpoints
// - Progress-based recommendations
// ============================================================================

export interface ConsumptionProgress {
  userId: string;
  contentId: string;
  /** Percentage completed (0-100) */
  progressPercent: number;
  /** Time spent in seconds */
  timeSpentSeconds: number;
  /** Total duration in seconds */
  totalDurationSeconds: number;
  /** Last position in seconds */
  lastPositionSeconds: number;
  /** Checkpoints reached */
  checkpointsReached: string[];
  /** Whether completed */
  completed: boolean;
  /** First started at */
  startedAt: Date;
  /** Last updated at */
  updatedAt: Date;
}

export interface ConsumptionCheckpoint {
  id: string;
  contentId: string;
  /** Position in seconds */
  positionSeconds: number;
  /** Percentage of content */
  percentPosition: number;
  /** Knowledge units to grant */
  knowledgeUnitIds: string[];
  /** Whether this is a spoiler checkpoint */
  isSpoilerCheckpoint: boolean;
}

@Injectable()
export class PartialConsumptionService {
  private readonly logger = new Logger(PartialConsumptionService.name);

  // In-memory store (would be database in production)
  private readonly progressStore = new Map<string, ConsumptionProgress>();
  private readonly checkpointStore = new Map<string, ConsumptionCheckpoint[]>();

  /**
   * Update consumption progress
   */
  async updateProgress(
    userId: string,
    contentId: string,
    positionSeconds: number,
    totalDurationSeconds: number
  ): Promise<ConsumptionProgress> {
    const key = `${userId}:${contentId}`;
    const existing = this.progressStore.get(key);

    const progressPercent =
      totalDurationSeconds > 0 ? Math.min(100, (positionSeconds / totalDurationSeconds) * 100) : 0;

    const progress: ConsumptionProgress = {
      userId,
      contentId,
      progressPercent: Math.round(progressPercent * 100) / 100,
      timeSpentSeconds: existing
        ? existing.timeSpentSeconds + (positionSeconds - existing.lastPositionSeconds)
        : positionSeconds,
      totalDurationSeconds,
      lastPositionSeconds: positionSeconds,
      checkpointsReached: existing?.checkpointsReached || [],
      completed: progressPercent >= 95, // Consider 95%+ as completed
      startedAt: existing?.startedAt || new Date(),
      updatedAt: new Date(),
    };

    // Check for new checkpoints reached
    const checkpoints = this.checkpointStore.get(contentId) || [];
    for (const checkpoint of checkpoints) {
      if (
        positionSeconds >= checkpoint.positionSeconds &&
        !progress.checkpointsReached.includes(checkpoint.id)
      ) {
        progress.checkpointsReached.push(checkpoint.id);
        this.logger.log(`Checkpoint reached: ${checkpoint.id} for user ${userId}`);
      }
    }

    this.progressStore.set(key, progress);

    return progress;
  }

  /**
   * Get consumption progress
   */
  async getProgress(userId: string, contentId: string): Promise<ConsumptionProgress | undefined> {
    return this.progressStore.get(`${userId}:${contentId}`);
  }

  /**
   * Get all progress for a user
   */
  async getUserProgress(userId: string): Promise<ConsumptionProgress[]> {
    return Array.from(this.progressStore.values()).filter((p) => p.userId === userId);
  }

  /**
   * Get all progress for content
   */
  async getContentProgress(contentId: string): Promise<ConsumptionProgress[]> {
    return Array.from(this.progressStore.values()).filter((p) => p.contentId === contentId);
  }

  /**
   * Mark content as completed
   */
  async markCompleted(userId: string, contentId: string): Promise<ConsumptionProgress> {
    const key = `${userId}:${contentId}`;
    const existing = this.progressStore.get(key);

    const progress: ConsumptionProgress = {
      userId,
      contentId,
      progressPercent: 100,
      timeSpentSeconds: existing?.timeSpentSeconds || 0,
      totalDurationSeconds: existing?.totalDurationSeconds || 0,
      lastPositionSeconds: existing?.totalDurationSeconds || 0,
      checkpointsReached: existing?.checkpointsReached || [],
      completed: true,
      startedAt: existing?.startedAt || new Date(),
      updatedAt: new Date(),
    };

    this.progressStore.set(key, progress);

    return progress;
  }

  /**
   * Register checkpoints for content
   */
  async registerCheckpoints(
    contentId: string,
    checkpoints: Omit<ConsumptionCheckpoint, 'id'>[]
  ): Promise<ConsumptionCheckpoint[]> {
    const registered = checkpoints.map((cp, index) => ({
      ...cp,
      id: `${contentId}-checkpoint-${index}`,
    }));

    this.checkpointStore.set(contentId, registered);

    return registered;
  }

  /**
   * Get checkpoints for content
   */
  async getCheckpoints(contentId: string): Promise<ConsumptionCheckpoint[]> {
    return this.checkpointStore.get(contentId) || [];
  }

  /**
   * Get reached checkpoints for user/content
   */
  async getReachedCheckpoints(userId: string, contentId: string): Promise<ConsumptionCheckpoint[]> {
    const progress = await this.getProgress(userId, contentId);
    if (!progress) return [];

    const allCheckpoints = await this.getCheckpoints(contentId);
    return allCheckpoints.filter((cp) => progress.checkpointsReached.includes(cp.id));
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
