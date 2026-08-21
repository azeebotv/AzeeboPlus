import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// A/B Testing Framework for Recommendation Algorithms
//
// Enables controlled experiments on recommendation algorithms
// to measure impact on engagement, retention, and revenue.
// ============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: ExperimentStatus;
  /** Algorithm variants being tested */
  variants: ExperimentVariant[];
  /** Target audience */
  audience: ExperimentAudience;
  /** Metrics being tracked */
  metrics: string[];
  /** Start date */
  startedAt?: Date;
  /** End date */
  endedAt?: Date;
  /** Results */
  results?: ExperimentResults;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  /** Weight (0-1) for traffic allocation */
  weight: number;
  /** Algorithm configuration */
  algorithmConfig: Record<string, unknown>;
}

export interface ExperimentAudience {
  /** Percentage of users to include (0-100) */
  percentage: number;
  /** User segments to target */
  segments?: string[];
  /** Countries to include */
  countries?: string[];
  /** Platforms to include */
  platforms?: string[];
}

export interface ExperimentResults {
  /** Total participants */
  totalParticipants: number;
  /** Results per variant */
  variantResults: VariantResult[];
  /** Statistical significance (p-value) */
  significance: number;
  /** Winner variant ID (if any) */
  winnerVariantId?: string;
  /** Confidence level */
  confidence: number;
}

export interface VariantResult {
  variantId: string;
  participants: number;
  metrics: Record<string, {
    value: number;
    standardDeviation: number;
    sampleSize: number;
  }>;
}

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  // In-memory store (would be database in production)
  private readonly experiments = new Map<string, Experiment>();
  private readonly assignments = new Map<string, string>(); // userId → variantId

  /**
   * Create a new experiment
   */
  async createExperiment(experiment: Omit<Experiment, 'id' | 'status'>): Promise<Experiment> {
    const newExperiment: Experiment = {
      ...experiment,
      id: randomUUID(),
      status: 'draft',
    };

    this.experiments.set(newExperiment.id, newExperiment);
    this.logger.log(`Experiment created: ${newExperiment.name} (${newExperiment.id})`);

    return newExperiment;
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (experiment.status !== 'draft') {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }

    experiment.status = 'running';
    experiment.startedAt = new Date();

    this.logger.log(`Experiment started: ${experiment.name}`);

    return experiment;
  }

  /**
   * Pause an experiment
   */
  async pauseExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Cannot pause experiment in ${experiment.status} status`);
    }

    experiment.status = 'paused';

    this.logger.log(`Experiment paused: ${experiment.name}`);

    return experiment;
  }

  /**
   * Complete an experiment
   */
  async completeExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (experiment.status !== 'running' && experiment.status !== 'paused') {
      throw new Error(`Cannot complete experiment in ${experiment.status} status`);
    }

    experiment.status = 'completed';
    experiment.endedAt = new Date();

    this.logger.log(`Experiment completed: ${experiment.name}`);

    return experiment;
  }

  /**
   * Assign user to a variant
   */
  assignVariant(userId: string, experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return '';
    }

    // Check if already assigned
    const existingAssignment = this.assignments.get(`${userId}:${experimentId}`);
    if (existingAssignment) {
      return existingAssignment;
    }

    // Check audience eligibility
    if (!this.isEligible(userId, experiment.audience)) {
      return '';
    }

    // Assign based on weights
    const variant = this.selectVariant(experiment.variants);
    this.assignments.set(`${userId}:${experimentId}`, variant.id);

    return variant.id;
  }

  /**
   * Get user's assigned variant
   */
  getAssignedVariant(userId: string, experimentId: string): string {
    return this.assignments.get(`${userId}:${experimentId}`) || '';
  }

  /**
   * Check if user is eligible for experiment
   */
  private isEligible(userId: string, audience: ExperimentAudience): boolean {
    // Simple eligibility check based on percentage
    const hash = this.hashString(userId);
    return (hash % 100) < audience.percentage;
  }

  /**
   * Select variant based on weights
   */
  private selectVariant(variants: ExperimentVariant[]): ExperimentVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  /**
   * Simple hash function for deterministic assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  /**
   * Record experiment metric
   */
  async recordMetric(
    experimentId: string,
    variantId: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    // In production, would store in database
    this.logger.debug(`Metric recorded: ${experimentId}/${variantId}/${metricName}=${value}`);
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<Experiment | undefined> {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  async getAllExperiments(): Promise<Experiment[]> {
    return Array.from(this.experiments.values());
  }

  /**
   * Get running experiments
   */
  async getRunningExperiments(): Promise<Experiment[]> {
    return Array.from(this.experiments.values()).filter(e => e.status === 'running');
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
