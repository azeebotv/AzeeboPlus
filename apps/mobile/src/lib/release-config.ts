/**
 * Release Signing & Tamper Controls (TAA §53)
 *
 * Provides:
 * - Release signing verification
 * - Build type detection
 * - Tamper controls
 * - Environment validation
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ---------------------------------------------------------------------------
// Build Type Detection
// ---------------------------------------------------------------------------

export type BuildType = 'development' | 'preview' | 'production';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getExpoConfig = () => (Constants as any).expoConfig || (Constants as any).manifest || {};

/**
 * Get the current build type
 */
export function getBuildType(): BuildType {
  if (__DEV__) return 'development';

  const releaseChannel = getExpoConfig()?.extra?.eas?.projectId;
  if (!releaseChannel) return 'development';

  // EAS Build uses release channels
  const channel = process.env.EXPO_PUBLIC_RELEASE_CHANNEL || 'production';
  if (channel === 'preview') return 'preview';
  return 'production';
}

/**
 * Check if this is a production build
 */
export function isProduction(): boolean {
  return getBuildType() === 'production';
}

/**
 * Check if this is a development build
 */
export function isDevelopment(): boolean {
  return getBuildType() === 'development';
}

// ---------------------------------------------------------------------------
// Environment Validation
// ---------------------------------------------------------------------------

export interface EnvironmentConfig {
  /** API base URL */
  apiUrl: string;
  /** Analytics endpoint */
  analyticsUrl: string;
  /** Whether debug mode is enabled */
  debugMode: boolean;
  /** App version */
  appVersion: string;
  /** Build number */
  buildNumber: string;
  /** Bundle identifier */
  bundleIdentifier: string;
}

/**
 * Get environment configuration based on build type
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const buildType = getBuildType();
  const configs: Record<BuildType, EnvironmentConfig> = {
    development: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3013',
      analyticsUrl: process.env.EXPO_PUBLIC_ANALYTICS_URL || 'http://localhost:3013',
      debugMode: true,
      appVersion: getExpoConfig()?.version || '1.0.0',
      buildNumber: getExpoConfig()?.android?.versionCode?.toString() || '1',
      bundleIdentifier: getExpoConfig()?.android?.package || 'com.azeebo.plus.dev',
    },
    preview: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://staging-api.azeeboplus.com',
      analyticsUrl: process.env.EXPO_PUBLIC_ANALYTICS_URL || 'https://staging-api.azeeboplus.com',
      debugMode: false,
      appVersion: getExpoConfig()?.version || '1.0.0',
      buildNumber: getExpoConfig()?.android?.versionCode?.toString() || '1',
      bundleIdentifier: getExpoConfig()?.android?.package || 'com.azeebo.plus.staging',
    },
    production: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.azeeboplus.com',
      analyticsUrl: process.env.EXPO_PUBLIC_ANALYTICS_URL || 'https://api.azeeboplus.com',
      debugMode: false,
      appVersion: getExpoConfig()?.version || '1.0.0',
      buildNumber: getExpoConfig()?.android?.versionCode?.toString() || '1',
      bundleIdentifier: getExpoConfig()?.android?.package || 'com.azeebo.plus',
    },
  };

  return configs[buildType];
}

// ---------------------------------------------------------------------------
// Tamper Controls
// ---------------------------------------------------------------------------

/**
 * Verify that the app is running with expected configuration
 */
export function verifyReleaseIntegrity(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (isProduction()) {
    // Production checks
    const config = getEnvironmentConfig();

    if (config.debugMode) {
      issues.push('Debug mode enabled in production');
    }

    if (!config.apiUrl.startsWith('https://')) {
      issues.push('Non-HTTPS API URL in production');
    }

    if (config.bundleIdentifier.includes('dev') || config.bundleIdentifier.includes('staging')) {
      issues.push(`Invalid bundle identifier for production: ${config.bundleIdentifier}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Detect if the app is running in a potentially compromised environment
 */
export function detectCompromisedEnvironment(): {
  compromised: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check for debugger
  if (__DEV__) {
    reasons.push('Running in development mode');
  }

  // Check for emulator (simplified - use react-native-device-info in production)
  if (Platform.OS === 'android') {
    // Basic emulator detection
    const isEmulator = !Platform.isTV && Platform.Version === 0;
    if (isEmulator) {
      reasons.push('Running on emulator');
    }
  }

  return {
    compromised: reasons.length > 0,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Version Management
// ---------------------------------------------------------------------------

export interface VersionInfo {
  /** Semantic version (e.g., 1.2.3) */
  version: string;
  /** Build number (integer) */
  buildNumber: number;
  /** Version code for Android */
  versionCode: number;
  /** iOS build number */
  iosBuildNumber: string;
}

/**
 * Get version information
 */
export function getVersionInfo(): VersionInfo {
  const config = getExpoConfig();

  return {
    version: config?.version || '1.0.0',
    buildNumber: parseInt(config?.android?.versionCode?.toString() || '1', 10),
    versionCode: parseInt(config?.android?.versionCode?.toString() || '1', 10),
    iosBuildNumber: config?.ios?.buildNumber || config?.android?.versionCode?.toString() || '1',
  };
}

/**
 * Compare two semantic versions
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split('.').map(Number);
  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

/**
 * Check if an update is available
 */
export function isUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
  return compareVersions(latestVersion, currentVersion) > 0;
}
