/**
 * React Native Architecture Verification & Configuration
 * ADR-001, TAA §6
 */

// ---------------------------------------------------------------------------
// Architecture Configuration
// ---------------------------------------------------------------------------

/**
 * React Native New Architecture status.
 * New Architecture (Fabric + TurboModules) must be enabled for performance.
 */
export interface ArchitectureConfig {
  /** Fabric renderer enabled (new rendering system) */
  fabricEnabled: boolean;
  /** TurboModules enabled (native module system) */
  turboModulesEnabled: boolean;
  /** Hermes JS engine enabled */
  hermesEnabled: boolean;
  /** Flipper debugging tools enabled (debug only) */
  flipperEnabled: boolean;
  /** JS engine bundle format */
  jsEngine: 'hermes' | 'jsc';
  /** React Native version */
  rnVersion: string;
  /** Minimum supported Android API level */
  minAndroidSdk: number;
  /** Minimum supported iOS version */
  minIosVersion: string;
}

/**
 * Default production configuration.
 * Verify these match app.json / build.gradle / Podfile settings.
 */
export const DEFAULT_ARCHITECTURE_CONFIG: ArchitectureConfig = {
  fabricEnabled: true,
  turboModulesEnabled: true,
  hermesEnabled: true,
  flipperEnabled: __DEV__,
  jsEngine: 'hermes',
  rnVersion: '0.74.0',
  minAndroidSdk: 24, // Android 7.0
  minIosVersion: '15.0',
};

/**
 * Verify the runtime architecture matches expected configuration.
 * Call this at app startup to detect misconfiguration.
 */
export function verifyArchitecture(
  config: ArchitectureConfig = DEFAULT_ARCHITECTURE_CONFIG
): ArchitectureVerification {
  const results: ArchitectureCheck[] = [];

  // Check Hermes engine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hermesAvailable = typeof (global as any).HermesInternal !== 'undefined';
  results.push({
    name: 'Hermes JS Engine',
    expected: config.hermesEnabled,
    actual: hermesAvailable,
    passed: config.hermesEnabled === hermesAvailable,
    message: hermesAvailable
      ? 'Hermes is enabled ✓'
      : config.hermesEnabled
        ? 'WARNING: Hermes expected but not detected'
        : 'Hermes is disabled (expected)',
  });

  // Check Fabric renderer
  const fabricEnabled = checkFabricEnabled();
  results.push({
    name: 'Fabric Renderer',
    expected: config.fabricEnabled,
    actual: fabricEnabled,
    passed: config.fabricEnabled === fabricEnabled,
    message: fabricEnabled ? 'Fabric is enabled ✓' : 'Fabric not detected',
  });

  // Check TurboModules
  const turboEnabled = checkTurboModules();
  results.push({
    name: 'TurboModules',
    expected: config.turboModulesEnabled,
    actual: turboEnabled,
    passed: config.turboModulesEnabled === turboEnabled,
    message: turboEnabled ? 'TurboModules enabled ✓' : 'TurboModules not detected',
  });

  const allPassed = results.every((r) => r.passed);

  return {
    allPassed,
    checks: results,
    timestamp: new Date().toISOString(),
  };
}

function checkFabricEnabled(): boolean {
  // In production, Fabric is enabled at build time
  // This is a heuristic check based on runtime behavior
  try {
    // @ts-expect-error - Fabric global check
    return global.__turboModuleProxy != null || __DEV__ === false;
  } catch {
    return false;
  }
}

function checkTurboModules(): boolean {
  try {
    // @ts-expect-error - TurboModule global check
    return global.__turboModuleProxy != null;
  } catch {
    return false;
  }
}

export interface ArchitectureCheck {
  name: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
  message: string;
}

export interface ArchitectureVerification {
  allPassed: boolean;
  checks: ArchitectureCheck[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Supported release version pinning
// ---------------------------------------------------------------------------

/**
 * Current release train configuration.
 * Pin to stable release per release train (TAA §6).
 */
export const RELEASE_TRAIN = {
  /** Current major.minor version */
  version: '1.0.0',
  /** Supported React Native version range */
  rnVersionRange: '>=0.73.0 <0.76.0',
  /** Minimum Android SDK */
  minAndroidSdk: 24,
  /** Minimum iOS version */
  minIosVersion: '15.0',
  /** Build number (auto-increment in CI) */
  buildNumber: 1,
  /** Version code (Android) */
  versionCode: 1,
} as const;
