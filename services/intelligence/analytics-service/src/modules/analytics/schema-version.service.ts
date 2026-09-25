import { Injectable } from '@nestjs/common';

// ============================================================================
// Event Schema Versioning (TAA §39)
//
// All analytics events must carry a schema version for:
// - Backward compatibility tracking
// - Migration planning when schemas evolve
// - Debugging version-specific issues
// ============================================================================

/** Current schema version for analytics events */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/** Schema version history for migration tracking */
export const SCHEMA_VERSION_HISTORY = [
  { version: '1.0.0', releasedAt: new Date('2026-08-01'), description: 'Initial event schema' },
];

export interface VersionedEvent {
  /** Schema version of this event */
  schemaVersion: string;
  /** Event type/name */
  eventType: string;
  /** Event payload */
  payload: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
  /** Optional: minimum schema version required to process this event */
  minRequiredVersion?: string;
}

export interface SchemaVersionInfo {
  currentVersion: string;
  supportedVersions: string[];
  deprecatedVersions: string[];
  latestReleasedAt: Date;
}

@Injectable()
export class SchemaVersionService {
  /**
   * Get current schema version info
   */
  getVersionInfo(): SchemaVersionInfo {
    return {
      currentVersion: CURRENT_SCHEMA_VERSION,
      supportedVersions: SCHEMA_VERSION_HISTORY.map((v) => v.version),
      deprecatedVersions: [], // No deprecated versions yet
      latestReleasedAt: SCHEMA_VERSION_HISTORY[SCHEMA_VERSION_HISTORY.length - 1].releasedAt,
    };
  }

  /**
   * Validate that an event has a valid schema version
   */
  validateSchemaVersion(event: { schemaVersion?: string; eventType: string }): {
    valid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const warnings: string[] = [];

    // Check if schema version is present
    if (!event.schemaVersion) {
      return {
        valid: false,
        error: `Event ${event.eventType} missing required schemaVersion field`,
      };
    }

    // Check if version is supported
    const supportedVersions = SCHEMA_VERSION_HISTORY.map((v) => v.version);
    if (!supportedVersions.includes(event.schemaVersion)) {
      return {
        valid: false,
        error: `Unsupported schema version: ${event.schemaVersion}. Supported: ${supportedVersions.join(', ')}`,
      };
    }

    // Check if version is deprecated
    const versionInfo = SCHEMA_VERSION_HISTORY.find((v) => v.version === event.schemaVersion);
    if (versionInfo) {
      // Add warnings for older versions
      const currentIndex = SCHEMA_VERSION_HISTORY.length - 1;
      const eventIndex = SCHEMA_VERSION_HISTORY.indexOf(versionInfo);
      if (eventIndex < currentIndex) {
        warnings.push(
          `Schema version ${event.schemaVersion} is outdated. Current is ${CURRENT_SCHEMA_VERSION}`
        );
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  /**
   * Add schema version to an event
   */
  addSchemaVersion<T extends Record<string, unknown>>(event: T): T & { schemaVersion: string } {
    return {
      ...event,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
  }

  /**
   * Check if two events are compatible (same major version)
   */
  areCompatible(version1: string, version2: string): boolean {
    const major1 = parseInt(version1.split('.')[0], 10);
    const major2 = parseInt(version2.split('.')[0], 10);
    return major1 === major2;
  }

  /**
   * Get migration notes between versions
   */
  getMigrationNotes(fromVersion: string, toVersion: string): string[] {
    const notes: string[] = [];

    const fromMajor = parseInt(fromVersion.split('.')[0], 10);
    const toMajor = parseInt(toVersion.split('.')[0], 10);

    if (fromMajor < toMajor) {
      notes.push(`Major version upgrade from ${fromVersion} to ${toVersion}`);
      notes.push('Review breaking changes in release notes');
    } else if (fromMajor === toMajor) {
      notes.push('Minor/patch upgrade - backward compatible');
    }

    return notes;
  }
}
