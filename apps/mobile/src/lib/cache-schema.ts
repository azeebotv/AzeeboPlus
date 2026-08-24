/**
 * Schema Versioning for Persisted Cache/State (TAA §89)
 *
 * Handles schema evolution for locally persisted data:
 * - Version tracking for all cached data
 * - Destructive migration that preserves login/purchase truth
 * - Backward compatibility for rollback scenarios
 */

const SCHEMA_VERSION_KEY = '@azeebo/schema_version';
const CURRENT_SCHEMA_VERSION = 2;

/** Fields that must survive any destructive migration */
const PRESERVED_KEYS = [
  '@azeebo/auth_token',
  '@azeebo/refresh_token',
  '@azeebo/user_id',
  '@azeebo/purchases',
  '@azeebo/subscription',
  '@azeebo/wallet_balance',
  '@azeebo/language',
];

interface MigrationStep {
  fromVersion: number;
  toVersion: number;
  migrate: (data: Record<string, string>) => Record<string, string>;
}

/**
 * Registry of migrations, ordered by version.
 * Each migration transforms data from one version to the next.
 */
const migrations: MigrationStep[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    migrate: (data) => {
      // v1 → v2: Rename preferences keys for consistency
      const result = { ...data };
      if (result['@azeebo/prefs_theme']) {
        result['@azeebo/preferences_theme'] = result['@azeebo/prefs_theme'];
        delete result['@azeebo/prefs_theme'];
      }
      if (result['@azeebo/prefs_notifications']) {
        result['@azeebo/preferences_notifications'] = result['@azeebo/prefs_notifications'];
        delete result['@azeebo/prefs_notifications'];
      }
      return result;
    },
  },
];

/**
 * Get the current schema version from storage
 */
export function getSchemaVersion(storage: Storage = localStorage): number {
  try {
    const version = storage.getItem(SCHEMA_VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Set the schema version in storage
 */
export function setSchemaVersion(version: number, storage: Storage = localStorage): void {
  try {
    storage.setItem(SCHEMA_VERSION_KEY, version.toString());
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Preserve critical keys before destructive migration
 */
function preserveCriticalData(storage: Storage): Map<string, string | null> {
  const preserved = new Map<string, string | null>();
  for (const key of PRESERVED_KEYS) {
    try {
      preserved.set(key, storage.getItem(key));
    } catch {
      // Ignore storage errors
    }
  }
  return preserved;
}

/**
 * Restore critical keys after destructive migration
 */
function restoreCriticalData(storage: Storage, preserved: Map<string, string | null>): void {
  for (const [key, value] of preserved) {
    if (value !== null) {
      try {
        storage.setItem(key, value);
      } catch {
        // Storage full — best effort
      }
    }
  }
}

/**
 * Get all key-value pairs from storage
 */
function getAllStorageData(storage: Storage): Record<string, string> {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('@azeebo/')) {
        data[key] = storage.getItem(key) || '';
      }
    }
  } catch {
    // Ignore
  }
  return data;
}

/**
 * Run all pending migrations from current version to latest.
 * Preserves login/purchase truth across destructive migrations.
 *
 * @returns true if migrations were run
 */
export function runMigrations(storage: Storage = localStorage): boolean {
  const currentVersion = getSchemaVersion(storage);

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    return false; // Already up to date
  }

  // Preserve critical data before any destructive operations
  const preserved = preserveCriticalData(storage);

  // Run each migration in order
  let data = getAllStorageData(storage);
  for (const migration of migrations) {
    if (migration.fromVersion >= currentVersion && migration.toVersion <= CURRENT_SCHEMA_VERSION) {
      data = migration.migrate(data);
    }
  }

  // Clear all @azeebo/ keys
  const keysToRemove: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('@azeebo/') && key !== SCHEMA_VERSION_KEY) {
        keysToRemove.push(key);
      }
    }
  } catch {
    // Ignore
  }

  for (const key of keysToRemove) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  // Write migrated data back
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      try {
        storage.setItem(key, value);
      } catch {
        // Storage full — best effort
      }
    }
  }

  // Restore critical data (login/purchases must survive)
  restoreCriticalData(storage, preserved);

  // Update schema version
  setSchemaVersion(CURRENT_SCHEMA_VERSION, storage);

  return true;
}

/**
 * Check if a forced upgrade is needed based on minimum supported version
 */
export function isUpgradeRequired(clientVersion: string, minSupportedVersion: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [cMajor, cMinor, cPatch] = parse(clientVersion);
  const [mMajor, mMinor, mPatch] = parse(minSupportedVersion);

  if (cMajor !== mMajor) return cMajor < mMajor;
  if (cMinor !== mMinor) return cMinor < mMinor;
  return cPatch < mPatch;
}

/**
 * Clear all persisted cache (for logout or data reset)
 * Preserves only non-sensitive preferences
 */
export function clearAllCache(storage: Storage = localStorage): void {
  const keysToKeep = ['@azeebo/language', '@azeebo/schema_version'];

  const keysToRemove: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('@azeebo/') && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }
  } catch {
    // Ignore
  }

  for (const key of keysToRemove) {
    try {
      storage.removeItem(key);
    } catch {
      // Ignore
    }
  }
}
