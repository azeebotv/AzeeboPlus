import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Skip Protection (AZP-KNOW-008)
//
// Prevents users from bypassing knowledge requirements by:
// - Detecting skip patterns
// - Enforcing minimum consumption before unlock
// - Blocking knowledge grants for skipped content
// ============================================================================

export interface SkipDetectionResult {
  userId: string;
  contentId: string;
  isSkipping: boolean;
  skipPattern: 'none' | 'fast_forward' | 'jump_ahead' | 'chapter_skip';
  confidence: number;
  recommendedAction: 'allow' | 'warn' | 'block';
}

export interface SkipProtectionConfig {
  /** Minimum watch time percentage to count as consumed */
  minWatchPercent: number;
  /** Maximum skip speed multiplier */
  maxSkipSpeed: number;
  /** Number of skips before warning */
  skipWarningThreshold: number;
  /** Number of skips before blocking */
  skipBlockThreshold: number;
}

const DEFAULT_CONFIG: SkipProtectionConfig = {
  minWatchPercent: 70,
  maxSkipSpeed: 2,
  skipWarningThreshold: 3,
  skipBlockThreshold: 5,
};

@Injectable()
export class SkipProtectionService {
  private readonly logger = new Logger(SkipProtectionService.name);

  private readonly config: SkipProtectionConfig;

  // In-memory store (would be database in production)
  private readonly skipHistory = new Map<string, number>(); // userId:contentId → skip count

  constructor(config?: Partial<SkipProtectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect if user is skipping content
   */
  detectSkipping(
    userId: string,
    contentId: string,
    viewingEvents: Array<{
      timestamp: Date;
      position: number;
      action: 'play' | 'pause' | 'seek' | 'skip';
      skipDistance?: number;
    }>
  ): SkipDetectionResult {
    let skipPattern: SkipDetectionResult['skipPattern'] = 'none';
    let confidence = 0;

    // Analyze viewing events for skip patterns
    const seekEvents = viewingEvents.filter((e) => e.action === 'seek');
    const totalEvents = viewingEvents.length;

    if (totalEvents === 0) {
      return {
        userId,
        contentId,
        isSkipping: false,
        skipPattern: 'none',
        confidence: 0,
        recommendedAction: 'allow',
      };
    }

    // Check for fast forward pattern
    const fastForwards = seekEvents.filter((e) => (e.skipDistance || 0) > 0);
    if (fastForwards.length > 2) {
      skipPattern = 'fast_forward';
      confidence = Math.min(fastForwards.length / totalEvents, 1);
    }

    // Check for jump ahead pattern
    const largeJumps = seekEvents.filter((e) => Math.abs(e.skipDistance || 0) > 60);
    if (largeJumps.length > 1) {
      skipPattern = 'jump_ahead';
      confidence = Math.max(confidence, Math.min(largeJumps.length / totalEvents, 1));
    }

    const isSkipping = confidence > 0.5;

    // Determine recommended action
    let recommendedAction: SkipDetectionResult['recommendedAction'] = 'allow';
    const skipCount = this.getSkipCount(userId, contentId);

    if (skipCount >= this.config.skipBlockThreshold) {
      recommendedAction = 'block';
    } else if (skipCount >= this.config.skipWarningThreshold) {
      recommendedAction = 'warn';
    }

    return {
      userId,
      contentId,
      isSkipping,
      skipPattern,
      confidence: Math.round(confidence * 100) / 100,
      recommendedAction,
    };
  }

  /**
   * Record a skip event
   */
  recordSkip(userId: string, contentId: string): void {
    const key = `${userId}:${contentId}`;
    const current = this.skipHistory.get(key) || 0;
    this.skipHistory.set(key, current + 1);
  }

  /**
   * Get skip count for user/content
   */
  getSkipCount(userId: string, contentId: string): number {
    return this.skipHistory.get(`${userId}:${contentId}`) || 0;
  }

  /**
   * Check if consumption counts as valid (meets minimum watch requirement)
   */
  isValidConsumption(
    watchPercent: number,
    totalDuration: number,
    watchedDuration: number
  ): boolean {
    // Must watch minimum percentage
    if (watchPercent < this.config.minWatchPercent) {
      return false;
    }

    // Must watch for minimum time (at least 30 seconds)
    if (watchedDuration < 30) {
      return false;
    }

    return true;
  }

  /**
   * Check if user can unlock knowledge for content
   */
  canUnlockKnowledge(
    userId: string,
    contentId: string,
    watchPercent: number
  ): {
    allowed: boolean;
    reason?: string;
  } {
    const skipCount = this.getSkipCount(userId, contentId);

    // Block if too many skips
    if (skipCount >= this.config.skipBlockThreshold) {
      return {
        allowed: false,
        reason: `Too many skips (${skipCount}/${this.config.skipBlockThreshold})`,
      };
    }

    // Block if didn't watch enough
    if (watchPercent < this.config.minWatchPercent) {
      return {
        allowed: false,
        reason: `Insufficient watch time (${Math.round(watchPercent)}%/${this.config.minWatchPercent}%)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get skip protection config
   */
  getConfig(): SkipProtectionConfig {
    return { ...this.config };
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
