import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ============================================================================
// AI Provenance & Content Generation (TAA §27, §81)
//
// Tracks provenance of AI-generated content including:
// - VCF (Version Control File) provenance reference
// - Master version/hash tracking
// - Clearance state for AI-generated content
// - Talent/voice/likeness restriction tracking
// - Vendor/model restriction recording
// ============================================================================

export type ClearanceState =
  | 'pending_review'
  | 'cleared'
  | 'restricted'
  | 'blocked'
  | 'needs_human_review';

export type ContentType =
  | 'image'
  | 'video'
  | 'audio'
  | 'text'
  | '3d_model'
  | 'voice_clone';

export interface AIGeneratedContent {
  id: string;
  /** Content type */
  contentType: ContentType;
  /** Vendor/provider that generated this content */
  vendor: string;
  /** Model used for generation */
  model: string;
  /** Version of the model */
  modelVersion: string;
  /** Input prompt/description used */
  inputPrompt: string;
  /** Hash of the generated content */
  contentHash: string;
  /** Master version number */
  version: number;
  /** Previous version hash (for version chain) */
  previousVersionHash?: string;
  /** Clearance state */
  clearanceState: ClearanceState;
  /** Restrictions applied */
  restrictions: ContentRestriction[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Who/what cleared this content */
  clearedBy?: string;
  /** Clearance notes */
  clearanceNotes?: string;
}

export interface ContentRestriction {
  type: 'talent' | 'voice' | 'likeness' | 'style' | 'usage';
  description: string;
  restrictsFrom: Date;
  restrictsUntil?: Date;
  legalReference?: string;
}

export interface ProvenanceRecord {
  id: string;
  contentId: string;
  action: 'created' | 'version_bumped' | 'cleared' | 'restricted' | 'blocked' | 'modified';
  performedBy: string;
  timestamp: Date;
  details: Record<string, unknown>;
  previousState?: ClearanceState;
  newState?: ClearanceState;
}

@Injectable()
export class AIProvenanceService {
  private readonly logger = new Logger(AIProvenanceService.name);

  // In-memory store (would be database in production)
  private readonly contentStore = new Map<string, AIGeneratedContent>();
  private readonly provenanceStore = new Map<string, ProvenanceRecord[]>();

  /**
   * Register new AI-generated content
   */
  async registerContent(content: {
    contentType: ContentType;
    vendor: string;
    model: string;
    modelVersion: string;
    inputPrompt: string;
    contentHash: string;
    restrictions?: ContentRestriction[];
  }): Promise<AIGeneratedContent> {
    const id = randomUUID();
    const now = new Date();

    const newContent: AIGeneratedContent = {
      id,
      contentType: content.contentType,
      vendor: content.vendor,
      model: content.model,
      modelVersion: content.modelVersion,
      inputPrompt: content.inputPrompt,
      contentHash: content.contentHash,
      version: 1,
      clearanceState: 'pending_review',
      restrictions: content.restrictions || [],
      createdAt: now,
      updatedAt: now,
    };

    this.contentStore.set(id, newContent);

    // Record provenance
    await this.recordProvenance(id, 'created', 'system', {
      vendor: content.vendor,
      model: content.model,
      contentType: content.contentType,
    });

    this.logger.log(`AI content registered: ${id} (${content.contentType} by ${content.vendor})`);

    return newContent;
  }

  /**
   * Bump version of AI-generated content
   */
  async bumpVersion(
    contentId: string,
    newContentHash: string,
    performedBy: string,
  ): Promise<AIGeneratedContent> {
    const content = this.contentStore.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    const previousHash = content.contentHash;
    content.contentHash = newContentHash;
    content.version++;
    content.previousVersionHash = previousHash;
    content.updatedAt = new Date();

    await this.recordProvenance(contentId, 'version_bumped', performedBy, {
      previousVersion: content.version - 1,
      newVersion: content.version,
      previousHash,
      newHash: newContentHash,
    });

    this.logger.log(`AI content version bumped: ${contentId} v${content.version}`);

    return content;
  }

  /**
   * Update clearance state
   */
  async updateClearance(
    contentId: string,
    newState: ClearanceState,
    performedBy: string,
    notes?: string,
  ): Promise<AIGeneratedContent> {
    const content = this.contentStore.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    const previousState = content.clearanceState;
    content.clearanceState = newState;
    content.clearedBy = performedBy;
    content.clearanceNotes = notes;
    content.updatedAt = new Date();

    await this.recordProvenance(contentId, newState === 'cleared' ? 'cleared' : 'restricted', performedBy, {
      previousState,
      newState,
      notes,
    });

    this.logger.log(`AI content clearance updated: ${contentId} → ${newState}`);

    return content;
  }

  /**
   * Add restriction to content
   */
  async addRestriction(
    contentId: string,
    restriction: ContentRestriction,
    performedBy: string,
  ): Promise<AIGeneratedContent> {
    const content = this.contentStore.get(contentId);
    if (!content) {
      throw new Error(`Content not found: ${contentId}`);
    }

    content.restrictions.push(restriction);
    content.updatedAt = new Date();

    await this.recordProvenance(contentId, 'restricted', performedBy, {
      restrictionType: restriction.type,
      description: restriction.description,
    });

    this.logger.log(`AI content restriction added: ${contentId} (${restriction.type})`);

    return content;
  }

  /**
   * Check if content is vendor-independent (approved masters)
   */
  isVendorIndependent(contentId: string): boolean {
    const content = this.contentStore.get(contentId);
    if (!content) return false;

    // Content is vendor-independent if it has been cleared
    // and doesn't have vendor-specific restrictions
    const hasVendorRestriction = content.restrictions.some(
      r => r.type === 'usage' && r.description.toLowerCase().includes('vendor')
    );

    return content.clearanceState === 'cleared' && !hasVendorRestriction;
  }

  /**
   * Check if AI provider outage affects consumer runtime
   */
  checkProviderImpact(vendor: string): {
    affected: boolean;
    alternativeVendors: string[];
    mitigation: string;
  } {
    // In production, would check real provider status
    const vendorMap: Record<string, string[]> = {
      openai: ['anthropic', 'google'],
      anthropic: ['openai', 'google'],
      google: ['openai', 'anthropic'],
      stability: ['midjourney', 'dalle'],
      midjourney: ['stability', 'dalle'],
    };

    return {
      affected: false, // Would be true if provider is down
      alternativeVendors: vendorMap[vendor] || [],
      mitigation: `Use fallback vendor if ${vendor} is unavailable`,
    };
  }

  /**
   * Get content by ID
   */
  async getContent(contentId: string): Promise<AIGeneratedContent | undefined> {
    return this.contentStore.get(contentId);
  }

  /**
   * Get provenance history for content
   */
  async getProvenanceHistory(contentId: string): Promise<ProvenanceRecord[]> {
    return this.provenanceStore.get(contentId) || [];
  }

  /**
   * Get all content by vendor
   */
  async getContentByVendor(vendor: string): Promise<AIGeneratedContent[]> {
    return Array.from(this.contentStore.values()).filter(c => c.vendor === vendor);
  }

  /**
   * Get all content by clearance state
   */
  async getContentByClearance(state: ClearanceState): Promise<AIGeneratedContent[]> {
    return Array.from(this.contentStore.values()).filter(c => c.clearanceState === state);
  }

  /**
   * Record provenance action
   */
  private async recordProvenance(
    contentId: string,
    action: ProvenanceRecord['action'],
    performedBy: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    const content = this.contentStore.get(contentId);
    const record: ProvenanceRecord = {
      id: randomUUID(),
      contentId,
      action,
      performedBy,
      timestamp: new Date(),
      details,
      previousState: content?.clearanceState,
    };

    const history = this.provenanceStore.get(contentId) || [];
    history.push(record);
    this.provenanceStore.set(contentId, history);
  }

  /**
   * Clear stores (for testing)
   */
  static clearStores(): void {
    // Would clear database in production
  }
}
