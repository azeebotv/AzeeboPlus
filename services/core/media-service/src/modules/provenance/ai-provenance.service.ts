import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * AI Provenance Reference Service (TAA §27)
 *
 * Tracks AI-generated content provenance:
 * - provenance_record_id
 * - master_version/hash
 * - clearance_state
 * - covered_talent/voice_restrictions
 * - distribution_relevant_vendor/model_restriction
 */

export interface ProvenanceRecord {
  /** Unique provenance record ID */
  id: string;
  /** Content ID this provenance is for */
  contentId: string;
  /** AI tool used for generation */
  aiTool: string;
  /** AI model identifier */
  aiModel: string;
  /** Type of AI generation */
  generationType: 'image' | 'video' | 'audio' | 'text' | 'music';
  /** Master asset key */
  masterAssetKey: string;
  /** Hash of the master asset */
  masterHash: string;
  /** Version of the AI output */
  version: number;
  /** Clearance state */
  clearanceState: ClearanceState;
  /** Talent/voice/likeness restrictions */
  restrictions: ContentRestrictions;
  /** Vendor/model restrictions for distribution */
  vendorRestrictions: VendorRestrictions;
  /** When this record was created */
  createdAt: Date;
  /** When this record was last updated */
  updatedAt: Date;
}

export type ClearanceState =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_revision'
  | 'cleared_for_distribution';

export interface ContentRestrictions {
  /** Talent restrictions (names, likenesses) */
  talentRestrictions: TalentRestriction[];
  /** Voice restrictions */
  voiceRestrictions: VoiceRestriction[];
  /** Likeness restrictions */
  likenessRestrictions: LikenessRestriction[];
}

export interface TalentRestriction {
  /** Talent name */
  name: string;
  /** Type of restriction */
  type: 'name' | 'likeness' | 'voice' | 'performance';
  /** Whether usage is permitted */
  permitted: boolean;
  /** Conditions for usage */
  conditions?: string;
}

export interface VoiceRestriction {
  /** Voice identifier */
  voiceId: string;
  /** Voice description */
  description: string;
  /** Whether usage is permitted */
  permitted: boolean;
  /** Usage limits */
  limits?: { maxDuration?: number; maxUses?: number };
}

export interface LikenessRestriction {
  /** Person identifier */
  personId: string;
  /** Person description */
  description: string;
  /** Whether usage is permitted */
  permitted: boolean;
  /** Usage context */
  context?: string;
}

export interface VendorRestrictions {
  /** Vendor name */
  vendor: string;
  /** Model identifier */
  model: string;
  /** Whether distribution is allowed */
  distributionAllowed: boolean;
  /** Usage terms */
  terms?: string;
  /** Attribution required */
  attributionRequired: boolean;
}

@Injectable()
export class AiProvenanceService {
  private readonly logger = new Logger(AiProvenanceService.name);

  /** In-memory store (would be database in production) */
  private readonly records = new Map<string, ProvenanceRecord>();

  /**
   * Create a new provenance record
   */
  async createRecord(data: Omit<ProvenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProvenanceRecord> {
    const record: ProvenanceRecord = {
      ...data,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.records.set(record.id, record);
    this.logger.log(`Provenance record created: ${record.id} for content ${record.contentId}`);

    return record;
  }

  /**
   * Get a provenance record by ID
   */
  async getRecord(id: string): Promise<ProvenanceRecord | undefined> {
    return this.records.get(id);
  }

  /**
   * Get provenance records for a content item
   */
  async getRecordsForContent(contentId: string): Promise<ProvenanceRecord[]> {
    return Array.from(this.records.values()).filter((r) => r.contentId === contentId);
  }

  /**
   * Update clearance state
   */
  async updateClearanceState(
    id: string,
    state: ClearanceState,
    notes?: string
  ): Promise<ProvenanceRecord | undefined> {
    const record = this.records.get(id);
    if (!record) return undefined;

    record.clearanceState = state;
    record.updatedAt = new Date();

    this.logger.log(`Provenance ${id} clearance updated to ${state}${notes ? `: ${notes}` : ''}`);

    return record;
  }

  /**
   * Verify master asset hash
   */
  verifyMasterHash(recordId: string, currentHash: string): boolean {
    const record = this.records.get(recordId);
    if (!record) return false;

    return record.masterHash === currentHash;
  }

  /**
   * Generate hash for a master asset
   */
  generateMasterHash(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if content has talent restrictions
   */
  hasTalentRestrictions(recordId: string): boolean {
    const record = this.records.get(recordId);
    if (!record) return false;

    return (
      record.restrictions.talentRestrictions.some((r) => !r.permitted) ||
      record.restrictions.voiceRestrictions.some((r) => !r.permitted) ||
      record.restrictions.likenessRestrictions.some((r) => !r.permitted)
    );
  }

  /**
   * Check if vendor allows distribution
   */
  canDistribute(recordId: string): boolean {
    const record = this.records.get(recordId);
    if (!record) return false;

    return record.vendorRestrictions.distributionAllowed;
  }

  /**
   * Check if attribution is required
   */
  requiresAttribution(recordId: string): boolean {
    const record = this.records.get(recordId);
    if (!record) return false;

    return record.vendorRestrictions.attributionRequired;
  }

  /**
   * Get all records pending review
   */
  async getPendingReview(): Promise<ProvenanceRecord[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.clearanceState === 'pending_review' || r.clearanceState === 'needs_revision'
    );
  }

  /**
   * Generate provenance report for content
   */
  async generateReport(contentId: string): Promise<{
    totalRecords: number;
    byState: Record<ClearanceState, number>;
    byType: Record<string, number>;
    restrictionsSummary: {
      talentRestricted: number;
      voiceRestricted: number;
      likenessRestricted: number;
      vendorRestricted: number;
    };
  }> {
    const records = await this.getRecordsForContent(contentId);

    const byState: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let talentRestricted = 0;
    let voiceRestricted = 0;
    let likenessRestricted = 0;
    let vendorRestricted = 0;

    for (const record of records) {
      byState[record.clearanceState] = (byState[record.clearanceState] || 0) + 1;
      byType[record.generationType] = (byType[record.generationType] || 0) + 1;

      if (this.hasTalentRestrictions(record.id)) talentRestricted++;
      if (record.restrictions.voiceRestrictions.some((r) => !r.permitted)) voiceRestricted++;
      if (record.restrictions.likenessRestrictions.some((r) => !r.permitted)) likenessRestricted++;
      if (!record.vendorRestrictions.distributionAllowed) vendorRestricted++;
    }

    return {
      totalRecords: records.length,
      byState: byState as Record<ClearanceState, number>,
      byType,
      restrictionsSummary: {
        talentRestricted,
        voiceRestricted,
        likenessRestricted,
        vendorRestricted,
      },
    };
  }

  private generateId(): string {
    return `prov_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
