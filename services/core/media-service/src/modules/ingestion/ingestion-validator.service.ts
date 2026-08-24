import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * Ingestion Validator Service (TAA §21, Step 3)
 *
 * Validates ACDP ingestion packages:
 * - Checksum verification
 * - Required files validation
 * - Metadata schema validation
 * - Rights/provenance reference validation
 */

export interface IngestionPackage {
  /** Package identifier */
  id: string;
  /** Content ID this package belongs to */
  contentId: string;
  /** VCF (Video Content Fund) identifier */
  vcfId?: string;
  /** Master asset files */
  masterAssets: AssetFile[];
  /** ACDP manifest file */
  manifest: ManifestFile;
  /** Metadata file */
  metadata: MetadataFile;
  /** Rights/provenance references */
  rightsReferences: RightsReference[];
  /** Upload timestamp */
  uploadedAt: Date;
}

export interface AssetFile {
  /** File key in storage */
  key: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** SHA-256 checksum */
  checksum: string;
  /** Asset type (video, audio, image, subtitle) */
  assetType: 'video' | 'audio' | 'image' | 'subtitle' | 'document';
}

export interface ManifestFile {
  /** File key in storage */
  key: string;
  /** Manifest content (JSON) */
  content: Record<string, unknown>;
  /** Manifest version */
  version: string;
}

export interface MetadataFile {
  /** File key in storage */
  key: string;
  /** Metadata content */
  content: ContentMetadata;
}

export interface ContentMetadata {
  /** Content title */
  title: string;
  /** Content description */
  description?: string;
  /** Content type */
  contentType: string;
  /** Universe ID */
  universeId: string;
  /** Duration in seconds */
  duration?: number;
  /** Language */
  language?: string;
  /** Tags */
  tags?: string[];
  /** Categories */
  categories?: string[];
}

export interface RightsReference {
  /** Rights record ID */
  rightsId: string;
  /** Territory codes */
  territories: string[];
  /** Start date */
  startDate: Date;
  /** End date */
  endDate?: Date;
  /** Content rating */
  rating?: string;
  /** Restrictions */
  restrictions?: string[];
}

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Validated timestamp */
  validatedAt: Date;
}

export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field/path that caused the error */
  path?: string;
  /** Severity */
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Warning message */
  message: string;
  /** Field/path that caused the warning */
  path?: string;
}

@Injectable()
export class IngestionValidatorService {
  private readonly logger = new Logger(IngestionValidatorService.name);

  /** Required files in an ACDP package */
  private readonly REQUIRED_ASSET_TYPES = ['video'];
  private readonly REQUIRED_MANIFEST_VERSION = '1.0';

  /**
   * Validate an ingestion package
   */
  async validatePackage(pkg: IngestionPackage): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validate manifest
    this.validateManifest(pkg.manifest, errors, warnings);

    // 2. Validate master assets
    this.validateMasterAssets(pkg.masterAssets, errors, warnings);

    // 3. Validate metadata
    this.validateMetadata(pkg.metadata, errors, warnings);

    // 4. Validate rights references
    this.validateRightsReferences(pkg.rightsReferences, errors, warnings);

    // 5. Validate checksums
    await this.validateChecksums(pkg.masterAssets, errors);

    // 6. Validate manifest-asset consistency
    this.validateManifestAssetConsistency(pkg, errors, warnings);

    const result: ValidationResult = {
      valid: errors.filter((e) => e.severity === 'critical').length === 0,
      errors,
      warnings,
      validatedAt: new Date(),
    };

    this.logger.log(
      `Validation ${result.valid ? 'PASSED' : 'FAILED'} for package ${pkg.id}: ` +
        `${errors.length} errors, ${warnings.length} warnings`
    );

    return result;
  }

  /**
   * Validate ACDP manifest
   */
  private validateManifest(
    manifest: ManifestFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!manifest.content) {
      errors.push({
        code: 'MANIFEST_MISSING',
        message: 'Manifest content is required',
        severity: 'critical',
      });
      return;
    }

    // Check required manifest fields
    const requiredFields = ['version', 'contentId', 'assets', 'checksum'];
    for (const field of requiredFields) {
      if (!manifest.content[field]) {
        errors.push({
          code: 'MANIFEST_FIELD_MISSING',
          message: `Required manifest field '${field}' is missing`,
          path: `manifest.${field}`,
          severity: 'critical',
        });
      }
    }

    // Validate manifest version
    if (manifest.version !== this.REQUIRED_MANIFEST_VERSION) {
      warnings.push({
        code: 'MANIFEST_VERSION_MISMATCH',
        message: `Manifest version ${manifest.version} differs from expected ${this.REQUIRED_MANIFEST_VERSION}`,
        path: 'manifest.version',
      });
    }

    // Validate manifest checksum format
    if (manifest.content.checksum && !/^[a-f0-9]{64}$/i.test(String(manifest.content.checksum))) {
      errors.push({
        code: 'MANIFEST_CHECKSUM_INVALID',
        message: 'Manifest checksum must be a valid SHA-256 hash',
        path: 'manifest.checksum',
        severity: 'error',
      });
    }
  }

  /**
   * Validate master assets
   */
  private validateMasterAssets(
    assets: AssetFile[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!assets || assets.length === 0) {
      errors.push({
        code: 'NO_MASTER_ASSETS',
        message: 'At least one master asset is required',
        severity: 'critical',
      });
      return;
    }

    // Check required asset types
    const presentTypes = new Set(assets.map((a) => a.assetType));
    for (const requiredType of this.REQUIRED_ASSET_TYPES) {
      if (!presentTypes.has(requiredType as AssetFile['assetType'])) {
        errors.push({
          code: 'MISSING_ASSET_TYPE',
          message: `Required asset type '${requiredType}' is missing`,
          severity: 'critical',
        });
      }
    }

    // Validate each asset
    for (const asset of assets) {
      if (!asset.key) {
        errors.push({
          code: 'ASSET_KEY_MISSING',
          message: 'Asset key is required',
          path: `asset.${asset.filename}`,
          severity: 'critical',
        });
      }

      if (!asset.mimeType) {
        errors.push({
          code: 'ASSET_MIMETYPE_MISSING',
          message: 'Asset MIME type is required',
          path: `asset.${asset.filename}`,
          severity: 'error',
        });
      }

      if (asset.size <= 0) {
        errors.push({
          code: 'ASSET_EMPTY',
          message: 'Asset file is empty',
          path: `asset.${asset.filename}`,
          severity: 'critical',
        });
      }

      if (!asset.checksum) {
        warnings.push({
          code: 'ASSET_CHECKSUM_MISSING',
          message: 'Asset checksum is missing - integrity cannot be verified',
          path: `asset.${asset.filename}`,
        });
      }
    }
  }

  /**
   * Validate metadata
   */
  private validateMetadata(
    metadata: MetadataFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!metadata.content) {
      errors.push({
        code: 'METADATA_MISSING',
        message: 'Metadata content is required',
        severity: 'critical',
      });
      return;
    }

    const meta = metadata.content;

    // Required fields
    if (!meta.title || meta.title.trim().length === 0) {
      errors.push({
        code: 'METADATA_TITLE_MISSING',
        message: 'Content title is required',
        path: 'metadata.title',
        severity: 'critical',
      });
    }

    if (!meta.contentType) {
      errors.push({
        code: 'METADATA_CONTENT_TYPE_MISSING',
        message: 'Content type is required',
        path: 'metadata.contentType',
        severity: 'critical',
      });
    }

    if (!meta.universeId) {
      errors.push({
        code: 'METADATA_UNIVERSE_MISSING',
        message: 'Universe ID is required',
        path: 'metadata.universeId',
        severity: 'critical',
      });
    }

    // Warnings for optional fields
    if (!meta.description) {
      warnings.push({
        code: 'METADATA_DESCRIPTION_MISSING',
        message: 'Content description is recommended',
        path: 'metadata.description',
      });
    }

    if (!meta.duration || meta.duration <= 0) {
      warnings.push({
        code: 'METADATA_DURATION_MISSING',
        message: 'Content duration is recommended',
        path: 'metadata.duration',
      });
    }
  }

  /**
   * Validate rights references
   */
  private validateRightsReferences(
    references: RightsReference[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!references || references.length === 0) {
      warnings.push({
        code: 'NO_RIGHTS_REFERENCES',
        message: 'No rights references provided - content may have distribution restrictions',
      });
      return;
    }

    const now = new Date();

    for (const ref of references) {
      if (!ref.rightsId) {
        errors.push({
          code: 'RIGHTS_ID_MISSING',
          message: 'Rights reference ID is required',
          path: `rights.${ref.rightsId}`,
          severity: 'error',
        });
      }

      if (!ref.territories || ref.territories.length === 0) {
        warnings.push({
          code: 'RIGHTS_TERRITORIES_MISSING',
          message: 'Territory restrictions should be specified',
          path: `rights.${ref.rightsId}`,
        });
      }

      if (ref.endDate && ref.endDate < now) {
        warnings.push({
          code: 'RIGHTS_EXPIRED',
          message: 'Rights window has already expired',
          path: `rights.${ref.rightsId}`,
        });
      }
    }
  }

  /**
   * Validate checksums for all assets
   */
  private async validateChecksums(assets: AssetFile[], errors: ValidationError[]): Promise<void> {
    for (const asset of assets) {
      if (asset.checksum && !/^[a-f0-9]{64}$/i.test(asset.checksum)) {
        errors.push({
          code: 'CHECKSUM_INVALID',
          message: `Invalid checksum format for ${asset.filename}`,
          path: `asset.${asset.filename}.checksum`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate consistency between manifest and assets
   */
  private validateManifestAssetConsistency(
    pkg: IngestionPackage,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const manifestAssets = pkg.manifest.content?.assets;
    if (!Array.isArray(manifestAssets)) {
      return;
    }

    const assetKeys = new Set(pkg.masterAssets.map((a) => a.key));

    // Check all manifest assets exist in package
    for (const manifestAsset of manifestAssets) {
      if (manifestAsset.key && !assetKeys.has(manifestAsset.key)) {
        errors.push({
          code: 'MANIFEST_ASSET_MISMATCH',
          message: `Manifest references asset '${manifestAsset.key}' not found in package`,
          path: `manifest.assets.${manifestAsset.key}`,
          severity: 'error',
        });
      }
    }

    // Check all package assets are in manifest
    for (const asset of pkg.masterAssets) {
      const inManifest = manifestAssets.some((ma: Record<string, unknown>) => ma.key === asset.key);
      if (!inManifest) {
        warnings.push({
          code: 'ASSET_NOT_IN_MANIFEST',
          message: `Asset '${asset.filename}' is not referenced in the manifest`,
          path: `asset.${asset.filename}`,
        });
      }
    }
  }

  /**
   * Generate checksum for a buffer
   */
  generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verify checksum matches expected value
   */
  verifyChecksum(buffer: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(buffer);
    return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
  }
}
