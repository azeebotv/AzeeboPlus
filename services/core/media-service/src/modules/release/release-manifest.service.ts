import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Atomic Release Manifest Service (TAA §78)
 *
 * Manages immutable release manifests that capture exact versions of:
 * - Content/catalog version
 * - Media master/derivative set
 * - Rights snapshot
 * - Knowledge mapping
 * - Captions/audio/localisation
 * - Provenance
 * - Commercial/sponsor state
 * - Seal digest (cryptographic)
 *
 * Status lifecycle: DRAFT → VALIDATED → SEALED → PUBLISHED → REVOKED/SUPERSEDED
 */

export type ManifestStatus =
  | 'draft'
  | 'validated'
  | 'sealed'
  | 'published'
  | 'revoked'
  | 'superseded';

export interface ReleaseManifest {
  /** Immutable manifest identifier */
  id: string;
  /** Content ID */
  contentId: string;
  /** Manifest status */
  status: ManifestStatus;
  /** Content/catalog version */
  catalogVersion: string;
  /** Media master set */
  mediaMaster: MediaSet;
  /** Media derivatives */
  mediaDerivatives: DerivativeSet;
  /** Rights snapshot */
  rightsSnapshot: RightsSnapshot;
  /** Knowledge mapping */
  knowledgeMapping: KnowledgeMapping;
  /** Captions and localisation */
  captions: CaptionSet;
  /** Provenance record */
  provenance: ProvenanceRef;
  /** Commercial/sponsor state */
  commercialState?: CommercialState;
  /** Cryptographic seal digest */
  sealDigest: string;
  /** Previous manifest (if superseded) */
  previousManifestId?: string;
  /** Created at */
  createdAt: Date;
  /** Published at */
  publishedAt?: Date;
  /** Revoked at */
  revokedAt?: Date;
  /** Status history */
  statusHistory: StatusTransition[];
}

export interface MediaSet {
  /** Master asset keys */
  masterKeys: string[];
  /** Master hash */
  masterHash: string;
  /** Duration in seconds */
  duration: number;
}

export interface DerivativeSet {
  /** HLS output keys */
  hlsKeys: string[];
  /** CMAF output keys */
  cmafKeys: string[];
  /** Progressive MP4 keys */
  mp4Keys: string[];
  /** Thumbnail keys */
  thumbnailKeys: string[];
}

export interface RightsSnapshot {
  /** Rights policy version */
  policyVersion: string;
  /** Territory restrictions */
  territories: string[];
  /** Age rating */
  ageRating: number;
  /** Rights window */
  rightsWindow: { start: Date; end?: Date };
}

export interface KnowledgeMapping {
  /** Canon version ID */
  canonVersionId: string;
  /** Knowledge mapping version ID */
  mappingVersionId: string;
}

export interface CaptionSet {
  /** Caption tracks */
  tracks: CaptionRef[];
}

export interface CaptionRef {
  /** Language code */
  language: string;
  /** Track key */
  key: string;
  /** Format */
  format: 'webvtt' | 'srt' | 'ttml';
}

export interface ProvenanceRef {
  /** Provenance record ID */
  recordId: string;
  /** Approved master hash */
  approvedMasterHash: string;
}

export interface CommercialState {
  /** Sponsor attachments */
  sponsors: SponsorAttachment[];
  /** Pricing tier */
  pricingTier?: string;
}

export interface SponsorAttachment {
  /** Sponsor ID */
  sponsorId: string;
  /** Sponsor name */
  name: string;
  /** Attachment type */
  type: 'pre_roll' | 'mid_roll' | 'overlay' | 'branded';
  /** Duration in seconds */
  duration?: number;
}

export interface StatusTransition {
  from: ManifestStatus;
  to: ManifestStatus;
  timestamp: Date;
  reason?: string;
}

@Injectable()
export class ReleaseManifestService {
  private readonly logger = new Logger(ReleaseManifestService.name);

  /** In-memory store (would be database in production) */
  private readonly manifests = new Map<string, ReleaseManifest>();

  /**
   * Create a new release manifest in DRAFT status
   */
  async createManifest(data: {
    contentId: string;
    catalogVersion: string;
    mediaMaster: MediaSet;
    mediaDerivatives: DerivativeSet;
    rightsSnapshot: RightsSnapshot;
    knowledgeMapping: KnowledgeMapping;
    captions: CaptionSet;
    provenance: ProvenanceRef;
    commercialState?: CommercialState;
  }): Promise<ReleaseManifest> {
    const manifest: ReleaseManifest = {
      id: this.generateId(),
      contentId: data.contentId,
      status: 'draft',
      catalogVersion: data.catalogVersion,
      mediaMaster: data.mediaMaster,
      mediaDerivatives: data.mediaDerivatives,
      rightsSnapshot: data.rightsSnapshot,
      knowledgeMapping: data.knowledgeMapping,
      captions: data.captions,
      provenance: data.provenance,
      commercialState: data.commercialState,
      sealDigest: '',
      createdAt: new Date(),
      statusHistory: [],
    };

    this.manifests.set(manifest.id, manifest);
    this.logger.log(`Release manifest created: ${manifest.id} for content ${manifest.contentId}`);

    return manifest;
  }

  /**
   * Validate a manifest (DRAFT → VALIDATED)
   */
  async validateManifest(id: string): Promise<ReleaseManifest> {
    const manifest = this.manifests.get(id);
    if (!manifest) throw new BadRequestException(`Manifest ${id} not found`);
    if (manifest.status !== 'draft') {
      throw new BadRequestException(`Cannot validate manifest in ${manifest.status} status`);
    }

    // Validation checks
    if (!manifest.mediaMaster.masterKeys.length) {
      throw new BadRequestException('No master assets specified');
    }
    if (!manifest.rightsSnapshot.policyVersion) {
      throw new BadRequestException('No rights policy version specified');
    }

    this.transitionStatus(manifest, 'validated');
    return manifest;
  }

  /**
   * Seal a manifest (VALIDATED → SEALED)
   */
  async sealManifest(id: string): Promise<ReleaseManifest> {
    const manifest = this.manifests.get(id);
    if (!manifest) throw new BadRequestException(`Manifest ${id} not found`);
    if (manifest.status !== 'validated') {
      throw new BadRequestException(`Cannot seal manifest in ${manifest.status} status`);
    }

    // Generate seal digest
    manifest.sealDigest = this.generateSealDigest(manifest);
    this.transitionStatus(manifest, 'sealed');

    this.logger.log(`Release manifest sealed: ${manifest.id}`);
    return manifest;
  }

  /**
   * Publish a manifest (SEALED → PUBLISHED)
   */
  async publishManifest(id: string): Promise<ReleaseManifest> {
    const manifest = this.manifests.get(id);
    if (!manifest) throw new BadRequestException(`Manifest ${id} not found`);
    if (manifest.status !== 'sealed') {
      throw new BadRequestException(`Cannot publish manifest in ${manifest.status} status`);
    }

    this.transitionStatus(manifest, 'published');
    manifest.publishedAt = new Date();

    this.logger.log(`Release manifest published: ${manifest.id}`);
    return manifest;
  }

  /**
   * Revoke a manifest (PUBLISHED → REVOKED)
   */
  async revokeManifest(id: string, reason: string): Promise<ReleaseManifest> {
    const manifest = this.manifests.get(id);
    if (!manifest) throw new BadRequestException(`Manifest ${id} not found`);
    if (manifest.status !== 'published') {
      throw new BadRequestException(`Cannot revoke manifest in ${manifest.status} status`);
    }

    this.transitionStatus(manifest, 'revoked');
    manifest.revokedAt = new Date();

    this.logger.log(`Release manifest revoked: ${manifest.id} - ${reason}`);
    return manifest;
  }

  /**
   * Supersede a manifest (PUBLISHED → SUPERSEDED)
   */
  async supersedeManifest(id: string, newManifestId: string): Promise<ReleaseManifest> {
    const manifest = this.manifests.get(id);
    if (!manifest) throw new BadRequestException(`Manifest ${id} not found`);
    if (manifest.status !== 'published') {
      throw new BadRequestException(`Cannot supersede manifest in ${manifest.status} status`);
    }

    this.transitionStatus(manifest, 'superseded');

    const newManifest = this.manifests.get(newManifestId);
    if (newManifest) {
      newManifest.previousManifestId = id;
    }

    this.logger.log(`Release manifest superseded: ${manifest.id} by ${newManifestId}`);
    return manifest;
  }

  /**
   * Get a manifest by ID
   */
  async getManifest(id: string): Promise<ReleaseManifest | undefined> {
    return this.manifests.get(id);
  }

  /**
   * Get the active (published) manifest for content
   */
  async getActiveManifest(contentId: string): Promise<ReleaseManifest | undefined> {
    return Array.from(this.manifests.values()).find(
      (m) => m.contentId === contentId && m.status === 'published'
    );
  }

  /**
   * Get all manifests for content
   */
  async getManifestsForContent(contentId: string): Promise<ReleaseManifest[]> {
    return Array.from(this.manifests.values())
      .filter((m) => m.contentId === contentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Verify manifest seal integrity
   */
  verifySeal(id: string): boolean {
    const manifest = this.manifests.get(id);
    if (!manifest || !manifest.sealDigest) return false;

    const expectedDigest = this.generateSealDigest(manifest);
    return manifest.sealDigest === expectedDigest;
  }

  /**
   * Transition manifest status
   */
  private transitionStatus(manifest: ReleaseManifest, newStatus: ManifestStatus): void {
    const validTransitions: Record<ManifestStatus, ManifestStatus[]> = {
      draft: ['validated'],
      validated: ['sealed'],
      sealed: ['published'],
      published: ['revoked', 'superseded'],
      revoked: [],
      superseded: [],
    };

    const allowed = validTransitions[manifest.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${manifest.status} → ${newStatus}`
      );
    }

    manifest.statusHistory.push({
      from: manifest.status,
      to: newStatus,
      timestamp: new Date(),
    });

    manifest.status = newStatus;
  }

  /**
   * Generate cryptographic seal digest
   */
  private generateSealDigest(manifest: ReleaseManifest): string {
    const payload = {
      contentId: manifest.contentId,
      catalogVersion: manifest.catalogVersion,
      masterHash: manifest.mediaMaster.masterHash,
      rightsVersion: manifest.rightsSnapshot.policyVersion,
      canonVersion: manifest.knowledgeMapping.canonVersionId,
      provenanceHash: manifest.provenance.approvedMasterHash,
    };

    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private generateId(): string {
    return `rm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
