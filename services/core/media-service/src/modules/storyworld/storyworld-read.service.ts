import { Injectable } from '@nestjs/common';

/**
 * Storyworld Read Architecture Service (TAA §20)
 *
 * Handles denormalised read models for storyworld content:
 * - Storyworld entities + Knowledge visibility
 * - Read models cached by content/canon version
 * - Personalised read models keyed by user Knowledge version
 * - Spoiler-safe API responses (AVAILABLE/LOCKED/TEASED/HIDDEN)
 * - No hidden future payloads sent to client
 */

export type VisibilityStatus = 'AVAILABLE' | 'LOCKED' | 'TEASED' | 'HIDDEN';

export interface StoryworldReadModel {
  /** Content ID */
  contentId: string;
  /** Universe ID */
  universeId: string;
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Thumbnail URL */
  thumbnailUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Content type */
  contentType: string;
  /** Knowledge units for this content */
  knowledgeUnits: KnowledgeUnitRead[];
  /** Checkpoints for this content */
  checkpoints: CheckpointRead[];
  /** Visibility status (based on user knowledge) */
  visibility: VisibilityStatus;
  /** Canon version */
  canonVersion: string;
  /** Read model version */
  version: number;
  /** Last updated */
  updatedAt: Date;
}

export interface KnowledgeUnitRead {
  /** Knowledge unit ID */
  id: string;
  /** Knowledge title */
  title: string;
  /** Knowledge description (filtered by visibility) */
  description: string;
  /** Visibility status */
  visibility: VisibilityStatus;
  /** Spoiler level */
  spoilerLevel: 'none' | 'mild' | 'moderate' | 'heavy';
  /** Whether user knows this */
  isKnown: boolean;
}

export interface CheckpointRead {
  /** Checkpoint ID */
  id: string;
  /** Checkpoint title */
  title: string;
  /** Timestamp in content */
  timestampSeconds: number;
  /** Description (filtered by visibility) */
  description: string;
  /** Visibility status */
  visibility: VisibilityStatus;
  /** Knowledge units granted */
  grantedUnits: KnowledgeUnitRead[];
}

export interface UserKnowledgeState {
  /** User ID */
  userId: string;
  /** Known knowledge unit IDs */
  knownUnitIds: Set<string>;
  /** Knowledge version (incremented on each grant) */
  version: number;
}

@Injectable()
export class StoryworldReadService {
  /** In-memory cache (would be Redis in production) */
  private readonly readModels = new Map<string, StoryworldReadModel>();
  private readonly userStates = new Map<string, UserKnowledgeState>();

  /**
   * Build a read model for content
   */
  async buildReadModel(
    contentId: string,
    universeId: string,
    title: string,
    description: string,
    thumbnailUrl: string,
    duration: number,
    contentType: string,
    knowledgeUnits: Array<{
      id: string;
      title: string;
      description: string;
      spoilerLevel: 'none' | 'mild' | 'moderate' | 'heavy';
    }>,
    checkpoints: Array<{
      id: string;
      title: string;
      timestampSeconds: number;
      description: string;
      grantedUnitIds: string[];
    }>,
    canonVersion: string
  ): Promise<StoryworldReadModel> {
    const readModel: StoryworldReadModel = {
      contentId,
      universeId,
      title,
      description,
      thumbnailUrl,
      duration,
      contentType,
      knowledgeUnits: knowledgeUnits.map((ku) => ({
        id: ku.id,
        title: ku.title,
        description: ku.description,
        visibility: 'HIDDEN', // Default - will be personalized
        spoilerLevel: ku.spoilerLevel,
        isKnown: false,
      })),
      checkpoints: checkpoints.map((cp) => ({
        id: cp.id,
        title: cp.title,
        timestampSeconds: cp.timestampSeconds,
        description: cp.description,
        visibility: 'HIDDEN', // Default - will be personalized
        grantedUnits: [],
      })),
      visibility: 'AVAILABLE', // Default - will be personalized
      canonVersion,
      version: 1,
      updatedAt: new Date(),
    };

    this.readModels.set(contentId, readModel);
    return readModel;
  }

  /**
   * Get personalized read model for a user
   */
  async getPersonalizedReadModel(contentId: string, userId?: string): Promise<StoryworldReadModel> {
    const baseModel = this.readModels.get(contentId);
    if (!baseModel) {
      throw new Error(`Read model not found for content ${contentId}`);
    }

    if (!userId) {
      // Anonymous user - show only teaser/locked content
      return this.applyAnonymousVisibility(baseModel);
    }

    const userState = this.userStates.get(userId);
    if (!userState) {
      // User with no knowledge state
      return this.applyAnonymousVisibility(baseModel);
    }

    return this.applyUserVisibility(baseModel, userState);
  }

  /**
   * Apply visibility based on user knowledge
   */
  private applyUserVisibility(
    model: StoryworldReadModel,
    userState: UserKnowledgeState
  ): StoryworldReadModel {
    const personalized: StoryworldReadModel = {
      ...model,
      knowledgeUnits: model.knowledgeUnits.map((ku) => {
        const isKnown = userState.knownUnitIds.has(ku.id);
        const visibility = this.calculateVisibility(isKnown, ku.spoilerLevel);

        return {
          ...ku,
          visibility,
          isKnown,
          description: visibility === 'AVAILABLE' ? ku.description : this.getTeaserDescription(ku),
        };
      }),
      checkpoints: model.checkpoints.map((cp) => {
        const visibility = this.calculateCheckpointVisibility(cp, userState);
        const grantedUnits = cp.grantedUnits.map((gu) => ({
          ...gu,
          visibility: userState.knownUnitIds.has(gu.id)
            ? ('AVAILABLE' as VisibilityStatus)
            : ('LOCKED' as VisibilityStatus),
        }));

        return {
          ...cp,
          visibility,
          description:
            visibility === 'AVAILABLE' ? cp.description : 'Complete previous content to unlock',
          grantedUnits,
        };
      }),
    };

    // Overall visibility is AVAILABLE if any part is available
    personalized.visibility = personalized.knowledgeUnits.some(
      (ku) => ku.visibility === 'AVAILABLE'
    )
      ? 'AVAILABLE'
      : 'TEASED';

    return personalized;
  }

  /**
   * Apply anonymous visibility (no user knowledge)
   */
  private applyAnonymousVisibility(model: StoryworldReadModel): StoryworldReadModel {
    return {
      ...model,
      knowledgeUnits: model.knowledgeUnits.map((ku) => ({
        ...ku,
        visibility: ku.spoilerLevel === 'none' ? 'AVAILABLE' : 'TEASED',
        isKnown: false,
        description: ku.spoilerLevel === 'none' ? ku.description : this.getTeaserDescription(ku),
      })),
      checkpoints: model.checkpoints.map((cp) => ({
        ...cp,
        visibility: 'TEASED' as VisibilityStatus,
        description: 'Sign in to unlock',
        grantedUnits: cp.grantedUnits.map((gu) => ({
          ...gu,
          visibility: 'LOCKED' as VisibilityStatus,
        })),
      })),
      visibility: 'TEASED',
    };
  }

  /**
   * Calculate visibility for a knowledge unit
   */
  private calculateVisibility(
    isKnown: boolean,
    spoilerLevel: 'none' | 'mild' | 'moderate' | 'heavy'
  ): VisibilityStatus {
    if (isKnown) return 'AVAILABLE';

    switch (spoilerLevel) {
      case 'none':
        return 'AVAILABLE';
      case 'mild':
        return 'TEASED';
      case 'moderate':
      case 'heavy':
        return 'LOCKED';
      default:
        return 'HIDDEN';
    }
  }

  /**
   * Calculate visibility for a checkpoint
   */
  private calculateCheckpointVisibility(
    checkpoint: CheckpointRead,
    userState: UserKnowledgeState
  ): VisibilityStatus {
    // If user knows all granted units, checkpoint is available
    const allKnown = checkpoint.grantedUnits.every((gu) => userState.knownUnitIds.has(gu.id));
    if (allKnown) return 'AVAILABLE';

    // If user knows some, show as teased
    const someKnown = checkpoint.grantedUnits.some((gu) => userState.knownUnitIds.has(gu.id));
    if (someKnown) return 'TEASED';

    return 'LOCKED';
  }

  /**
   * Get teaser description (safe preview)
   */
  private getTeaserDescription(ku: { title: string; spoilerLevel: string }): string {
    return `Unlock "${ku.title}" by watching more content`;
  }

  /**
   * Update user knowledge state
   */
  async updateUserKnowledge(userId: string, newKnowledgeUnitIds: string[]): Promise<void> {
    const existing = this.userStates.get(userId) || {
      userId,
      knownUnitIds: new Set<string>(),
      version: 0,
    };

    for (const id of newKnowledgeUnitIds) {
      existing.knownUnitIds.add(id);
    }
    existing.version++;

    this.userStates.set(userId, existing);
  }

  /**
   * Get user knowledge state
   */
  async getUserKnowledgeState(userId: string): Promise<UserKnowledgeState | undefined> {
    return this.userStates.get(userId);
  }

  /**
   * Check if content has hidden future payloads
   */
  async validateNoHiddenPayloads(
    contentId: string,
    userId?: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    const model = await this.getPersonalizedReadModel(contentId, userId);
    const issues: string[] = [];

    // Check for HIDDEN items that might leak information
    for (const ku of model.knowledgeUnits) {
      if (ku.visibility === 'HIDDEN') {
        // HIDDEN items should not be sent to client at all
        issues.push(`Knowledge unit ${ku.id} is HIDDEN but included in response`);
      }
    }

    for (const cp of model.checkpoints) {
      if (cp.visibility === 'HIDDEN') {
        issues.push(`Checkpoint ${cp.id} is HIDDEN but included in response`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get read model statistics
   */
  async getStats(): Promise<{
    totalReadModels: number;
    totalUserStates: number;
    averageKnowledgePerUser: number;
  }> {
    const userStates = Array.from(this.userStates.values());
    const avgKnowledge =
      userStates.length > 0
        ? userStates.reduce((sum, s) => sum + s.knownUnitIds.size, 0) / userStates.length
        : 0;

    return {
      totalReadModels: this.readModels.size,
      totalUserStates: userStates.length,
      averageKnowledgePerUser: Math.round(avgKnowledge * 100) / 100,
    };
  }
}
