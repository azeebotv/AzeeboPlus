import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// Knowledge Graph Unlock Trigger Policy Engine (AZP-KNOW-004)
//
// Determines when users should unlock new knowledge based on:
// - Consumption progress
// - Knowledge state
// - Spoiler protection
// - Cross-format equivalence
// ============================================================================

export type UnlockTrigger =
  | 'consumption_complete'
  | 'consumption_partial'
  | 'time_based'
  | 'achievement_based'
  | 'manual'
  | 'equivalence_mapped';

export interface UnlockPolicy {
  id: string;
  /** Name of the policy */
  name: string;
  /** Description */
  description: string;
  /** Trigger type */
  trigger: UnlockTrigger;
  /** Conditions for unlock */
  conditions: UnlockCondition[];
  /** Knowledge units this policy can unlock */
  targetKnowledgeUnitIds: string[];
  /** Priority (higher = evaluated first) */
  priority: number;
  /** Whether this policy is enabled */
  enabled: boolean;
}

export interface UnlockCondition {
  type: 'consumption' | 'knowledge_state' | 'time' | 'achievement' | 'equivalence';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains';
  field: string;
  value: unknown;
}

export interface UnlockEvaluation {
  userId: string;
  policyId: string;
  unlocked: boolean;
  reason: string;
  evaluatedAt: Date;
  conditionsMet: string[];
  conditionsFailed: string[];
}

export interface UserKnowledgeState {
  userId: string;
  /** Knowledge units the user has consumed */
  consumedUnitIds: string[];
  /** Knowledge units the user has unlocked */
  unlockedUnitIds: string[];
  /** User's progress per content item */
  consumptionProgress: Record<string, number>; // contentId → 0-100%
  /** User's achievements */
  achievements: string[];
  /** Timestamps of consumption */
  consumptionTimestamps: Record<string, Date>;
}

@Injectable()
export class KnowledgeUnlockService {
  // In-memory stores (would be database in production)
  private readonly policies = new Map<string, UnlockPolicy>();
  private readonly evaluationHistory = new Map<string, UnlockEvaluation[]>();

  /**
   * Register an unlock policy
   */
  async registerPolicy(policy: Omit<UnlockPolicy, 'id'>): Promise<UnlockPolicy> {
    const newPolicy: UnlockPolicy = {
      ...policy,
      id: randomUUID(),
    };

    this.policies.set(newPolicy.id, newPolicy);

    return newPolicy;
  }

  /**
   * Evaluate all policies for a user
   */
  async evaluatePolicies(
    userId: string,
    userState: UserKnowledgeState
  ): Promise<UnlockEvaluation[]> {
    const results: UnlockEvaluation[] = [];

    // Sort policies by priority (descending)
    const sortedPolicies = Array.from(this.policies.values())
      .filter((p) => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      const evaluation = this.evaluatePolicy(userId, policy, userState);
      results.push(evaluation);

      // Store evaluation
      const history = this.evaluationHistory.get(userId) || [];
      history.push(evaluation);
      this.evaluationHistory.set(userId, history);
    }

    return results;
  }

  /**
   * Evaluate a single policy for a user
   */
  private evaluatePolicy(
    userId: string,
    policy: UnlockPolicy,
    userState: UserKnowledgeState
  ): UnlockEvaluation {
    const conditionsMet: string[] = [];
    const conditionsFailed: string[] = [];

    for (const condition of policy.conditions) {
      const met = this.evaluateCondition(condition, userState);
      const conditionDesc = `${condition.field} ${condition.operator} ${condition.value}`;

      if (met) {
        conditionsMet.push(conditionDesc);
      } else {
        conditionsFailed.push(conditionDesc);
      }
    }

    const unlocked = conditionsFailed.length === 0;

    return {
      userId,
      policyId: policy.id,
      unlocked,
      reason: unlocked
        ? `All ${policy.conditions.length} conditions met`
        : `${conditionsFailed.length} of ${policy.conditions.length} conditions failed`,
      evaluatedAt: new Date(),
      conditionsMet,
      conditionsFailed,
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: UnlockCondition, userState: UserKnowledgeState): boolean {
    let fieldValue: unknown;

    // Get field value from user state
    switch (condition.type) {
      case 'consumption':
        fieldValue = this.getConsumptionValue(condition.field, userState);
        break;
      case 'knowledge_state':
        fieldValue = this.getKnowledgeStateValue(condition.field, userState);
        break;
      case 'time':
        fieldValue = this.getTimeValue(condition.field, userState);
        break;
      case 'achievement':
        fieldValue = this.getAchievementValue(condition.field, userState);
        break;
      case 'equivalence':
        fieldValue = this.getEquivalenceValue(condition.field, userState);
        break;
      default:
        return false;
    }

    return this.compareValues(fieldValue, condition.operator, condition.value);
  }

  /**
   * Get consumption-related field value
   */
  private getConsumptionValue(field: string, userState: UserKnowledgeState): unknown {
    switch (field) {
      case 'total_consumed':
        return userState.consumedUnitIds.length;
      case 'total_unlocked':
        return userState.unlockedUnitIds.length;
      case 'avg_progress':
        const progressValues = Object.values(userState.consumptionProgress);
        return progressValues.length > 0
          ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length
          : 0;
      case 'content_progress':
        return userState.consumptionProgress;
      default:
        return undefined;
    }
  }

  /**
   * Get knowledge state field value
   */
  private getKnowledgeStateValue(field: string, userState: UserKnowledgeState): unknown {
    switch (field) {
      case 'has_consumed':
        return userState.consumedUnitIds;
      case 'has_unlocked':
        return userState.unlockedUnitIds;
      case 'consumed_count':
        return userState.consumedUnitIds.length;
      case 'unlocked_count':
        return userState.unlockedUnitIds.length;
      default:
        return undefined;
    }
  }

  /**
   * Get time-related field value
   */
  private getTimeValue(field: string, userState: UserKnowledgeState): unknown {
    switch (field) {
      case 'days_since_first_consumption':
        const timestamps = Object.values(userState.consumptionTimestamps);
        if (timestamps.length === 0) return 0;
        const earliest = new Date(Math.min(...timestamps.map((t) => t.getTime())));
        return Math.floor((Date.now() - earliest.getTime()) / (1000 * 60 * 60 * 24));
      case 'hours_since_last_consumption':
        const allTimestamps = Object.values(userState.consumptionTimestamps);
        if (allTimestamps.length === 0) return 0;
        const latest = new Date(Math.max(...allTimestamps.map((t) => t.getTime())));
        return Math.floor((Date.now() - latest.getTime()) / (1000 * 60 * 60));
      default:
        return undefined;
    }
  }

  /**
   * Get achievement-related field value
   */
  private getAchievementValue(field: string, userState: UserKnowledgeState): unknown {
    switch (field) {
      case 'has_achievement':
        return userState.achievements;
      case 'achievement_count':
        return userState.achievements.length;
      case 'achievements':
        return userState.achievements;
      default:
        return undefined;
    }
  }

  /**
   * Get equivalence-related field value
   */
  private getEquivalenceValue(field: string, _userState: UserKnowledgeState): unknown {
    // In production, would check equivalence mappings
    switch (field) {
      case 'equivalent_consumed':
        return []; // Would check equivalence mappings
      case 'cross_format_progress':
        return 0; // Would calculate cross-format progress
      default:
        return undefined;
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(fieldValue: unknown, operator: string, targetValue: unknown): boolean {
    switch (operator) {
      case 'gt':
        return Number(fieldValue) > Number(targetValue);
      case 'gte':
        return Number(fieldValue) >= Number(targetValue);
      case 'lt':
        return Number(fieldValue) < Number(targetValue);
      case 'lte':
        return Number(fieldValue) <= Number(targetValue);
      case 'eq':
        return fieldValue === targetValue;
      case 'neq':
        return fieldValue !== targetValue;
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(targetValue);
        }
        return String(fieldValue).includes(String(targetValue));
      case 'not_contains':
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(targetValue);
        }
        return !String(fieldValue).includes(String(targetValue));
      default:
        return false;
    }
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId: string): Promise<UnlockPolicy | undefined> {
    return this.policies.get(policyId);
  }

  /**
   * Get all policies
   */
  async getAllPolicies(): Promise<UnlockPolicy[]> {
    return Array.from(this.policies.values());
  }

  /**
   * Get evaluation history for a user
   */
  async getEvaluationHistory(userId: string): Promise<UnlockEvaluation[]> {
    return this.evaluationHistory.get(userId) || [];
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
