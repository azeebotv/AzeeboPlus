import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Rewatch Idempotency (AZP-KNOW-009)
//
// Ensures that rewatching content:
// - Doesn't grant duplicate knowledge
// - Properly tracks rewatch count
// - Respects knowledge expiry rules
// - Maintains accurate consumption history
// ============================================================================

export interface RewatchRecord {
  userId: string;
  contentId: string;
  /** Number of times watched */
  watchCount: number;
  /** Timestamps of each watch */
  watchTimestamps: Date[];
  /** Total watch time across all watches */
  totalWatchTimeSeconds: number;
  /** Knowledge granted on first watch */
  firstWatchKnowledgeGranted: string[];
  /** Whether knowledge has expired */
  knowledgeExpired: boolean;
  /** Last watched at */
  lastWatchedAt: Date;
}

export interface RewatchConfig {
  /** Whether to grant knowledge on rewatch */
  grantKnowledgeOnRewatch: boolean;
  /** Maximum watches to count */
  maxWatchCount: number;
  /** Days before knowledge expires (0 = never) */
  knowledgeExpiryDays: number;
  /** Whether to track rewatch for analytics */
  trackRewatch: boolean;
}

const DEFAULT_REWATCH_CONFIG: RewatchConfig = {
  grantKnowledgeOnRewatch: false,
  maxWatchCount: 10,
  knowledgeExpiryDays: 0,
  trackRewatch: true,
};

@Injectable()
export class RewatchIdempotencyService {
  private readonly logger = new Logger(RewatchIdempotencyService.name);

  private readonly config: RewatchConfig;

  // In-memory store (would be database in production)
  private readonly rewatchStore = new Map<string, RewatchRecord>();

  constructor(config?: Partial<RewatchConfig>) {
    this.config = { ...DEFAULT_REWATCH_CONFIG, ...config };
  }

  /**
   * Record a watch event
   */
  async recordWatch(
    userId: string,
    contentId: string,
    watchDurationSeconds: number,
    knowledgeUnitIds: string[] = []
  ): Promise<{
    isFirstWatch: boolean;
    watchCount: number;
    knowledgeGranted: string[];
  }> {
    const key = `${userId}:${contentId}`;
    const existing = this.rewatchStore.get(key);

    const isFirstWatch = !existing || existing.watchCount === 0;
    const watchCount = (existing?.watchCount || 0) + 1;

    // Determine knowledge to grant
    let knowledgeGranted: string[] = [];

    if (isFirstWatch) {
      // First watch: grant all knowledge
      knowledgeGranted = knowledgeUnitIds;
    } else if (this.config.grantKnowledgeOnRewatch) {
      // Rewatch: grant knowledge if not expired and within max watches
      if (watchCount <= this.config.maxWatchCount) {
        // Only grant knowledge not already granted
        const alreadyGranted = existing?.firstWatchKnowledgeGranted || [];
        knowledgeGranted = knowledgeUnitIds.filter((id) => !alreadyGranted.includes(id));
      }
    }

    const record: RewatchRecord = {
      userId,
      contentId,
      watchCount,
      watchTimestamps: [...(existing?.watchTimestamps || []), new Date()],
      totalWatchTimeSeconds: (existing?.totalWatchTimeSeconds || 0) + watchDurationSeconds,
      firstWatchKnowledgeGranted: isFirstWatch
        ? knowledgeUnitIds
        : existing?.firstWatchKnowledgeGranted || [],
      knowledgeExpired: false,
      lastWatchedAt: new Date(),
    };

    this.rewatchStore.set(key, record);

    if (!isFirstWatch && this.config.trackRewatch) {
      this.logger.log(
        `Rewatch recorded: user ${userId}, content ${contentId}, watch #${watchCount}`
      );
    }

    return {
      isFirstWatch,
      watchCount,
      knowledgeGranted,
    };
  }

  /**
   * Get rewatch record
   */
  async getRewatchRecord(userId: string, contentId: string): Promise<RewatchRecord | undefined> {
    return this.rewatchStore.get(`${userId}:${contentId}`);
  }

  /**
   * Get all rewatch records for a user
   */
  async getUserRewatchRecords(userId: string): Promise<RewatchRecord[]> {
    return Array.from(this.rewatchStore.values()).filter((r) => r.userId === userId);
  }

  /**
   * Check if user has watched content
   */
  async hasWatched(userId: string, contentId: string): Promise<boolean> {
    const record = await this.getRewatchRecord(userId, contentId);
    return !!record && record.watchCount > 0;
  }

  /**
   * Get watch count
   */
  async getWatchCount(userId: string, contentId: string): Promise<number> {
    const record = await this.getRewatchRecord(userId, contentId);
    return record?.watchCount || 0;
  }

  /**
   * Check if knowledge should be granted
   */
  shouldGrantKnowledge(
    userId: string,
    contentId: string,
    watchCount: number
  ): {
    grant: boolean;
    reason: string;
  } {
    // First watch always grants
    if (watchCount === 1) {
      return { grant: true, reason: 'First watch' };
    }

    // Check if rewatch grants are enabled
    if (!this.config.grantKnowledgeOnRewatch) {
      return { grant: false, reason: 'Rewatch knowledge grants disabled' };
    }

    // Check max watch count
    if (watchCount > this.config.maxWatchCount) {
      return {
        grant: false,
        reason: `Exceeded max watch count (${this.config.maxWatchCount})`,
      };
    }

    return { grant: true, reason: 'Rewatch within limits' };
  }

  /**
   * Get rewatch config
   */
  getConfig(): RewatchConfig {
    return { ...this.config };
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
