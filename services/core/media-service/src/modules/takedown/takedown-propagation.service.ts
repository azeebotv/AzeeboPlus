import { Injectable, Logger } from '@nestjs/common';

/**
 * Takedown Propagation Service (TAA §82)
 *
 * Handles propagation and verification of emergency takedowns:
 * - Policy propagation ≤5 minutes
 * - CDN purge ≤15 minutes
 * - Blocked new sessions immediately
 * - Active session interruption on next auth/segment boundary
 * - Verification across API/search/explore/playback/CDN
 */

export type PropagationTarget = 'api' | 'search' | 'explore' | 'playback' | 'cdn' | 'notifications';

export interface PropagationTask {
  /** Task ID */
  id: string;
  /** Takedown request ID */
  takedownId: string;
  /** Content ID */
  contentId: string;
  /** Target to propagate to */
  target: PropagationTarget;
  /** Task status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Error message if failed */
  error?: string;
  /** Retry count */
  retryCount: number;
  /** Created at */
  createdAt: Date;
  /** Completed at */
  completedAt?: Date;
}

export interface PropagationReport {
  /** Takedown ID */
  takedownId: string;
  /** Content ID */
  contentId: string;
  /** Total tasks */
  totalTasks: number;
  /** Completed tasks */
  completedTasks: number;
  /** Failed tasks */
  failedTasks: number;
  /** Pending tasks */
  pendingTasks: number;
  /** All propagated */
  allPropagated: boolean;
  /** Total time (ms) */
  totalTimeMs: number;
  /** Tasks by target */
  tasksByTarget: Record<PropagationTarget, PropagationTask>;
}

@Injectable()
export class TakedownPropagationService {
  private readonly logger = new Logger(TakedownPropagationService.name);

  /** In-memory task store (would be database in production) */
  private readonly tasks = new Map<string, PropagationTask>();

  /** Maximum retries per task */
  private readonly maxRetries = 3;

  /**
   * Initiate propagation for a takedown
   */
  async initiatePropagation(takedownId: string, contentId: string): Promise<PropagationTask[]> {
    const targets: PropagationTarget[] = [
      'api',
      'search',
      'explore',
      'playback',
      'cdn',
      'notifications',
    ];

    const tasks: PropagationTask[] = [];

    for (const target of targets) {
      const task: PropagationTask = {
        id: `prop_${Date.now()}_${target}_${Math.random().toString(36).substring(2, 7)}`,
        takedownId,
        contentId,
        target,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
      };

      this.tasks.set(task.id, task);
      tasks.push(task);
    }

    this.logger.warn(
      `Propagation initiated for takedown ${takedownId}: ${tasks.length} tasks created`
    );

    return tasks;
  }

  /**
   * Execute a propagation task
   */
  async executeTask(taskId: string): Promise<PropagationTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = 'in_progress';

    try {
      // Simulate propagation based on target
      await this.propagateToTarget(task.target, task.contentId);

      task.status = 'completed';
      task.completedAt = new Date();

      this.logger.log(`Propagation completed: ${task.target} for content ${task.contentId}`);
    } catch (error) {
      task.retryCount++;

      if (task.retryCount >= this.maxRetries) {
        task.status = 'failed';
        task.error = (error as Error).message;
        this.logger.error(
          `Propagation failed after ${this.maxRetries} retries: ${task.target} - ${task.error}`
        );
      } else {
        task.status = 'pending'; // Will be retried
        this.logger.warn(`Propagation retry ${task.retryCount}/${this.maxRetries}: ${task.target}`);
      }
    }

    return task;
  }

  /**
   * Propagate to a specific target
   */
  private async propagateToTarget(target: PropagationTarget, contentId: string): Promise<void> {
    // In production, this would call the actual service
    switch (target) {
      case 'api':
        // Update content status in API
        await this.updateContentStatus(contentId, 'revoked');
        break;
      case 'search':
        // Remove from search index
        await this.removeFromSearch(contentId);
        break;
      case 'explore':
        // Remove from explore feeds
        await this.removeFromExplore(contentId);
        break;
      case 'playback':
        // Block playback
        await this.blockPlayback(contentId);
        break;
      case 'cdn':
        // Purge CDN
        await this.purgeCdn(contentId);
        break;
      case 'notifications':
        // Notify relevant services
        await this.notifyServices(contentId);
        break;
    }
  }

  private async updateContentStatus(contentId: string, status: string): Promise<void> {
    this.logger.log(`Content ${contentId} status updated to ${status}`);
  }

  private async removeFromSearch(contentId: string): Promise<void> {
    this.logger.log(`Content ${contentId} removed from search index`);
  }

  private async removeFromExplore(contentId: string): Promise<void> {
    this.logger.log(`Content ${contentId} removed from explore feeds`);
  }

  private async blockPlayback(contentId: string): Promise<void> {
    this.logger.log(`Playback blocked for content ${contentId}`);
  }

  private async purgeCdn(contentId: string): Promise<void> {
    this.logger.log(`CDN purged for content ${contentId}`);
  }

  private async notifyServices(contentId: string): Promise<void> {
    this.logger.log(`Services notified about content ${contentId}`);
  }

  /**
   * Get propagation report for a takedown
   */
  async getPropagationReport(takedownId: string): Promise<PropagationReport> {
    const tasks = Array.from(this.tasks.values()).filter((t) => t.takedownId === takedownId);

    const completed = tasks.filter((t) => t.status === 'completed');
    const failed = tasks.filter((t) => t.status === 'failed');
    const pending = tasks.filter((t) => t.status === 'pending');

    const tasksByTarget: Record<string, PropagationTask> = {};
    for (const task of tasks) {
      tasksByTarget[task.target] = task;
    }

    const createdAt = tasks[0]?.createdAt || new Date();
    const lastCompleted = completed[completed.length - 1]?.completedAt || new Date();

    return {
      takedownId,
      contentId: tasks[0]?.contentId || '',
      totalTasks: tasks.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      pendingTasks: pending.length,
      allPropagated: completed.length === tasks.length,
      totalTimeMs: lastCompleted.getTime() - createdAt.getTime(),
      tasksByTarget: tasksByTarget as Record<PropagationTarget, PropagationTask>,
    };
  }

  /**
   * Check if all tasks completed within SLA
   */
  async checkSlaCompliance(takedownId: string): Promise<{
    compliant: boolean;
    breaches: string[];
  }> {
    const report = await this.getPropagationReport(takedownId);
    const breaches: string[] = [];

    // Check overall 5-minute propagation SLA
    if (report.totalTimeMs > 300_000) {
      breaches.push(`Total propagation time ${report.totalTimeMs}ms exceeds 5-minute SLA`);
    }

    // Check CDN 15-minute SLA
    const cdnTask = report.tasksByTarget.cdn;
    if (cdnTask && cdnTask.status === 'completed' && cdnTask.completedAt) {
      const cdnTime = cdnTask.completedAt.getTime() - cdnTask.createdAt.getTime();
      if (cdnTime > 900_000) {
        breaches.push(`CDN purge time ${cdnTime}ms exceeds 15-minute SLA`);
      }
    }

    // Check for failed tasks
    if (report.failedTasks > 0) {
      breaches.push(`${report.failedTasks} propagation tasks failed`);
    }

    return {
      compliant: breaches.length === 0,
      breaches,
    };
  }

  /**
   * Get pending tasks requiring retry
   */
  async getPendingRetries(): Promise<PropagationTask[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === 'pending' && t.retryCount > 0
    );
  }

  /**
   * Get propagation statistics
   */
  async getStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    pendingTasks: number;
  }> {
    const tasks = Array.from(this.tasks.values());

    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      failedTasks: tasks.filter((t) => t.status === 'failed').length,
      pendingTasks: tasks.filter((t) => t.status === 'pending').length,
    };
  }
}
