import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Object Storage Zones Service (TAA §22)
 *
 * Manages storage zones with different access policies:
 * - ingest-staging: VCF/ingestion service only
 * - media-master-operational: Media processing only
 * - media-derivatives: Media/CDN origin only
 * - public-static: CDN only
 * - audit-export: Restricted operations/security
 */

export type StorageZone =
  | 'ingest-staging'
  | 'media-master-operational'
  | 'media-derivatives'
  | 'public-static'
  | 'audit-export';

export interface StorageZoneConfig {
  /** Zone name */
  name: StorageZone;
  /** Zone description */
  description: string;
  /** S3 bucket prefix */
  prefix: string;
  /** Access policies */
  access: {
    /** Services allowed to read */
    readAccess: string[];
    /** Services allowed to write */
    writeAccess: string[];
    /** Services allowed to delete */
    deleteAccess: string[];
  };
  /** Lifecycle policies */
  lifecycle: {
    /** Transition to IA after days */
    transitionToIA?: number;
    /** Transition to Glacier after days */
    transitionToGlacier?: number;
    /** Expire (delete) after days */
    expireAfter?: number;
  };
  /** Encryption settings */
  encryption: {
    /** Server-side encryption algorithm */
    algorithm: 'AES256' | 'aws:kms';
    /** KMS key ID (for aws:kms) */
    kmsKeyId?: string;
  };
  /** Versioning enabled */
  versioning: boolean;
  /** Access logging enabled */
  accessLogging: boolean;
}

@Injectable()
export class StorageZonesService {
  private readonly logger = new Logger(StorageZonesService.name);
  private readonly zones: Map<StorageZone, StorageZoneConfig>;

  constructor(private readonly configService: ConfigService) {
    this.zones = this.initializeZones();
  }

  private initializeZones(): Map<StorageZone, StorageZoneConfig> {
    const zones = new Map<StorageZone, StorageZoneConfig>();

    zones.set('ingest-staging', {
      name: 'ingest-staging',
      description: 'Staging area for VCF/ingestion service uploads',
      prefix: 'ingest/',
      access: {
        readAccess: ['ingestion-service', 'media-service'],
        writeAccess: ['ingestion-service'],
        deleteAccess: ['ingestion-service', 'media-service'],
      },
      lifecycle: {
        transitionToIA: 7,
        expireAfter: 30,
      },
      encryption: { algorithm: 'AES256' },
      versioning: true,
      accessLogging: true,
    });

    zones.set('media-master-operational', {
      name: 'media-master-operational',
      description: 'Master assets for media processing',
      prefix: 'masters/',
      access: {
        readAccess: ['media-service', 'transcoding-service'],
        writeAccess: ['media-service'],
        deleteAccess: ['media-service'],
      },
      lifecycle: {
        transitionToIA: 30,
        transitionToGlacier: 90,
      },
      encryption: { algorithm: 'AES256' },
      versioning: true,
      accessLogging: true,
    });

    zones.set('media-derivatives', {
      name: 'media-derivatives',
      description: 'Processed derivatives (transcoded, thumbnails, etc.)',
      prefix: 'derivatives/',
      access: {
        readAccess: ['media-service', 'cdn-service', 'api-gateway'],
        writeAccess: ['media-service', 'transcoding-service'],
        deleteAccess: ['media-service'],
      },
      lifecycle: {
        transitionToIA: 60,
      },
      encryption: { algorithm: 'AES256' },
      versioning: false,
      accessLogging: true,
    });

    zones.set('public-static', {
      name: 'public-static',
      description: 'Public static assets (images, icons, etc.)',
      prefix: 'public/',
      access: {
        readAccess: ['cdn-service', 'api-gateway', 'web-app', 'mobile-app'],
        writeAccess: ['media-service'],
        deleteAccess: ['media-service'],
      },
      lifecycle: {},
      encryption: { algorithm: 'AES256' },
      versioning: false,
      accessLogging: false,
    });

    zones.set('audit-export', {
      name: 'audit-export',
      description: 'Audit logs and data exports',
      prefix: 'audit/',
      access: {
        readAccess: ['audit-service', 'security-service'],
        writeAccess: ['audit-service', 'security-service'],
        deleteAccess: ['security-service'],
      },
      lifecycle: {
        transitionToGlacier: 90,
        expireAfter: 2555, // 7 years
      },
      encryption: {
        algorithm: 'aws:kms',
        kmsKeyId: this.configService.get<string>('AUDIT_KMS_KEY_ID'),
      },
      versioning: true,
      accessLogging: true,
    });

    return zones;
  }

  /**
   * Get configuration for a storage zone
   */
  getZoneConfig(zone: StorageZone): StorageZoneConfig | undefined {
    return this.zones.get(zone);
  }

  /**
   * Get all storage zone configurations
   */
  getAllZoneConfigs(): StorageZoneConfig[] {
    return Array.from(this.zones.values());
  }

  /**
   * Check if a service has read access to a zone
   */
  canRead(zone: StorageZone, service: string): boolean {
    const config = this.zones.get(zone);
    if (!config) return false;
    return config.access.readAccess.includes(service);
  }

  /**
   * Check if a service has write access to a zone
   */
  canWrite(zone: StorageZone, service: string): boolean {
    const config = this.zones.get(zone);
    if (!config) return false;
    return config.access.writeAccess.includes(service);
  }

  /**
   * Check if a service has delete access to a zone
   */
  canDelete(zone: StorageZone, service: string): boolean {
    const config = this.zones.get(zone);
    if (!config) return false;
    return config.access.deleteAccess.includes(service);
  }

  /**
   * Enforce access control for a zone operation
   */
  enforceAccess(zone: StorageZone, service: string, operation: 'read' | 'write' | 'delete'): void {
    let hasAccess = false;

    switch (operation) {
      case 'read':
        hasAccess = this.canRead(zone, service);
        break;
      case 'write':
        hasAccess = this.canWrite(zone, service);
        break;
      case 'delete':
        hasAccess = this.canDelete(zone, service);
        break;
    }

    if (!hasAccess) {
      this.logger.warn(`Access denied: ${service} ${operation} on ${zone}`);
      throw new ForbiddenException(
        `Service '${service}' does not have ${operation} access to zone '${zone}'`
      );
    }
  }

  /**
   * Get the S3 prefix for a zone
   */
  getZonePrefix(zone: StorageZone): string {
    const config = this.zones.get(zone);
    return config?.prefix || '';
  }

  /**
   * Generate a storage key for a zone
   */
  generateKey(zone: StorageZone, filename: string): string {
    const prefix = this.getZonePrefix(zone);
    const timestamp = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}/${random}/${filename}`;
  }

  /**
   * Get lifecycle policy for a zone
   */
  getLifecyclePolicy(zone: StorageZone): StorageZoneConfig['lifecycle'] | undefined {
    return this.zones.get(zone)?.lifecycle;
  }

  /**
   * Get encryption config for a zone
   */
  getEncryptionConfig(zone: StorageZone): StorageZoneConfig['encryption'] | undefined {
    return this.zones.get(zone)?.encryption;
  }
}
