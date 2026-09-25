/**
 * Network Security Configuration (OWASP MASVS)
 *
 * Provides:
 * - TLS pinning configuration
 * - Tamper detection
 * - Certificate validation
 * - Secure storage verification
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '@azeebo/react-data/utils/logger';

// ---------------------------------------------------------------------------
// TLS Pinning Configuration
// ---------------------------------------------------------------------------

export interface TlsConfig {
  /** Certificate fingerprints (SHA-256) for pinning */
  pinnedCertificates: string[];
  /** Whether to enforce certificate pinning */
  enforcePinning: boolean;
  /** Backup pins for certificate rotation */
  backupPins: string[];
  /** Domains that require pinning */
  pinnedDomains: string[];
}

/** Production TLS pinning configuration */
export const TLS_CONFIG: TlsConfig = {
  pinnedCertificates: [
    // Production certificate pins (SHA-256)
    // Replace with actual certificate fingerprints
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ],
  enforcePinning: __DEV__ ? false : true,
  backupPins: [
    // Backup pins for certificate rotation
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
  pinnedDomains: ['api.azeeboplus.com', 'cdn.azeeboplus.com', 'media.azeeboplus.com'],
};

/**
 * Validate that a certificate is pinned for a domain
 */
export function isCertificatePinned(domain: string): boolean {
  if (!TLS_CONFIG.enforcePinning) return true; // Dev mode
  return TLS_CONFIG.pinnedDomains.includes(domain);
}

// ---------------------------------------------------------------------------
// Tamper Detection
// ---------------------------------------------------------------------------

const TAMPER_CHECK_KEY = 'tamper_check_hash';
const APP_INTEGRITY_KEY = 'app_integrity_verified';

/**
 * Generate an integrity marker for the app.
 *
 * NOTE: This is a stable-environment marker, NOT tamper detection — it only
 * involves values that never change for a given install (platform, mode). It
 * deliberately excludes the date: the previous daily-rotating hash flagged
 * every launch on a new day as "possible tampering".
 *
 * Real integrity attestation must come from the platform (Play Integrity API
 * on Android, DeviceCheck/App Attest on iOS).
 */
export function generateAppIntegrityHash(): string {
  const factors = [Platform.OS, Platform.Version.toString(), __DEV__ ? 'dev' : 'prod'].join('|');

  // Simple marker (not cryptographic - use native attestation in production)
  let hash = 0;
  for (let i = 0; i < factors.length; i++) {
    const char = factors.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify app integrity on startup
 */
export async function verifyAppIntegrity(): Promise<boolean> {
  try {
    const storedHash = await SecureStore.getItemAsync(TAMPER_CHECK_KEY);
    const currentHash = generateAppIntegrityHash();

    if (!storedHash) {
      // First run - store hash
      await SecureStore.setItemAsync(TAMPER_CHECK_KEY, currentHash);
      await SecureStore.setItemAsync(APP_INTEGRITY_KEY, 'true');
      return true;
    }

    if (storedHash !== currentHash) {
      // Potential tampering detected (e.g. an OS update changing Platform
      // Version, or a real modification). Route through the logger so
      // production builds don't leak raw console output.
      logger.warn('App integrity check failed - possible tampering');
      await SecureStore.setItemAsync(APP_INTEGRITY_KEY, 'false');
      return false;
    }

    return true;
  } catch {
    // If secure store fails, assume integrity is okay
    return true;
  }
}

/**
 * Check if app integrity was previously verified
 */
export async function wasIntegrityVerified(): Promise<boolean> {
  try {
    const verified = await SecureStore.getItemAsync(APP_INTEGRITY_KEY);
    return verified === 'true';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Secure Storage Verification
// ---------------------------------------------------------------------------

/**
 * Verify that secure storage is working correctly
 */
export async function verifySecureStorage(): Promise<boolean> {
  try {
    const testKey = '_integrity_test';
    const testValue = Date.now().toString();

    await SecureStore.setItemAsync(testKey, testValue);
    const retrieved = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);

    return retrieved === testValue;
  } catch {
    return false;
  }
}

/**
 * Store sensitive data securely
 */
export async function secureStore(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve sensitive data securely
 */
export async function secureRetrieve(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/**
 * Delete sensitive data
 */
export async function secureDelete(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Security Headers Validation
// ---------------------------------------------------------------------------

export interface SecurityHeaders {
  /** Content Security Policy */
  csp?: string;
  /** X-Content-Type-Options */
  contentTypeOptions?: string;
  /** X-Frame-Options */
  frameOptions?: string;
  /** Strict-Transport-Security */
  hsts?: string;
}

/**
 * Validate security headers from API response
 */
export function validateSecurityHeaders(headers: Headers): SecurityHeaders {
  return {
    csp: headers.get('Content-Security-Policy') || undefined,
    contentTypeOptions: headers.get('X-Content-Type-Options') || undefined,
    frameOptions: headers.get('X-Frame-Options') || undefined,
    hsts: headers.get('Strict-Transport-Security') || undefined,
  };
}

/**
 * Check if required security headers are present
 */
export function hasRequiredSecurityHeaders(headers: Headers): boolean {
  const contentType = headers.get('X-Content-Type-Options');
  return contentType === 'nosniff';
}
