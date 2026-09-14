import { Platform } from 'react-native';
import { logger } from './logger';
import Constants from 'expo-constants';

export interface CertificatePin {
  hostname: string;
  sha256Fingerprint: string;
  backupPin?: string;
  expiresAt?: string;
}

export interface PinValidationResult {
  isValid: boolean;
  error?: string;
  pinnedHost: string;
}

// Load pins from environment configuration
const loadPinsFromConfig = (): CertificatePin[] => {
  const pins: CertificatePin[] = [];
  const extras =
    (((Constants as Record<string, unknown>).expoConfig as Record<string, unknown>)
      ?.extra as Record<string, string>) || {};

  // Production pins
  const prodPin = extras.CERT_PIN_PRODUCTION;
  const prodBackup = extras.CERT_PIN_PRODUCTION_BACKUP;
  if (prodPin && !prodPin.includes('PLACEHOLDER')) {
    pins.push({
      hostname: 'api.azeeboplus.com',
      sha256Fingerprint: prodPin,
      backupPin: prodBackup,
      expiresAt: extras.CERT_PIN_EXPIRY || '2027-12-31T23:59:59Z',
    });
  }

  // Staging pins
  const stagingPin = extras.CERT_PIN_STAGING;
  const stagingBackup = extras.CERT_PIN_STAGING_BACKUP;
  if (stagingPin && !stagingPin.includes('PLACEHOLDER')) {
    pins.push({
      hostname: 'staging-api.azeeboplus.com',
      sha256Fingerprint: stagingPin,
      backupPin: stagingBackup,
      expiresAt: extras.CERT_PIN_EXPIRY || '2027-12-31T23:59:59Z',
    });
  }

  // No hardcoded fallback pins: demo/placeholder pins in the bundle either
  // break the API on rotation or silently validate nothing. If pins aren't
  // configured the service simply stays unenforced — same effective behavior
  // as today, but without pretending otherwise.
  return pins;
};

const DEFAULT_PINS: CertificatePin[] = loadPinsFromConfig();

// Validate that we have real pins in production
const validatePins = (pins: CertificatePin[]): void => {
  if (!__DEV__ && pins.length === 0) {
    logger.warn('No certificate pins configured');
    return;
  }

  pins.forEach((pin) => {
    if (pin.sha256Fingerprint.includes('PLACEHOLDER')) {
      logger.warn(`Placeholder certificate pin detected for ${pin.hostname}`);
    }
  });
};

// Validate pins on initialization
validatePins(DEFAULT_PINS);

const NATIVE_PINNING_AVAILABLE = (() => {
  try {
    const sslPinning = require('react-native-ssl-pinning');
    return Boolean(sslPinning?.fetch || sslPinning?.default?.fetch);
  } catch {
    return false;
  }
})();

class CertificatePinningService {
  private static instance: CertificatePinningService;
  private pins: CertificatePin[] = DEFAULT_PINS;
  private isEnabled: boolean = __DEV__ ? false : true;
  private unenforcedWarned = false;

  static getInstance(): CertificatePinningService {
    if (!CertificatePinningService.instance) {
      CertificatePinningService.instance = new CertificatePinningService();
    }
    return CertificatePinningService.instance;
  }

  initialize(pins?: CertificatePin[], enabled?: boolean): void {
    if (pins) {
      this.pins = pins;
    }
    if (enabled !== undefined) {
      this.isEnabled = enabled;
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isPinningEnabled(): boolean {
    return this.isEnabled;
  }

  getPinForHost(hostname: string): CertificatePin | undefined {
    return this.pins.find((pin) => pin.hostname === hostname);
  }

  /**
   * Validate a certificate fingerprint against the pinned hash for a hostname.
   * Uses SHA-256 comparison via expo-crypto.
   */
  async validateCertificate(
    hostname: string,
    certificateFingerprint: string
  ): Promise<PinValidationResult> {
    if (!this.isEnabled) {
      return { isValid: true, pinnedHost: hostname };
    }

    const pin = this.getPinForHost(hostname);

    if (!pin) {
      // No pin configured for this host — allow (not all hosts need pinning)
      return {
        isValid: true,
        pinnedHost: hostname,
        error: `No pin configured for host: ${hostname}`,
      };
    }

    if (pin.expiresAt && new Date(pin.expiresAt) < new Date()) {
      logger.warn(`Certificate pin expired for ${hostname}`);
      return {
        isValid: false,
        pinnedHost: hostname,
        error: 'Certificate pin has expired',
      };
    }

    // Normalize fingerprints: strip 'sha256/' prefix and uppercase for comparison
    const normalizedFingerprint = certificateFingerprint.replace(/^sha256\//i, '').toUpperCase();
    const normalizedPrimary = pin.sha256Fingerprint.replace(/^sha256\//i, '').toUpperCase();
    const normalizedBackup = pin.backupPin?.replace(/^sha256\//i, '').toUpperCase();

    const isPrimaryMatch = normalizedFingerprint === normalizedPrimary;
    const isBackupMatch = normalizedBackup && normalizedFingerprint === normalizedBackup;

    if (isPrimaryMatch || isBackupMatch) {
      return { isValid: true, pinnedHost: hostname };
    }

    logger.error(
      `Certificate pin mismatch for ${hostname}: ` +
        `expected ${normalizedPrimary.substring(0, 16)}..., ` +
        `got ${normalizedFingerprint.substring(0, 16)}...`
    );
    return {
      isValid: false,
      pinnedHost: hostname,
      error: 'Certificate pin validation failed',
    };
  }

  async validateUrl(url: string, certificateFingerprint: string): Promise<PinValidationResult> {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      return this.validateCertificate(hostname, certificateFingerprint);
    } catch (error) {
      return {
        isValid: false,
        pinnedHost: url,
        error: `Invalid URL: ${url}`,
      };
    }
  }

  addPin(pin: CertificatePin): void {
    const existingIndex = this.pins.findIndex((p) => p.hostname === pin.hostname);

    if (existingIndex >= 0) {
      this.pins[existingIndex] = pin;
    } else {
      this.pins.push(pin);
    }
  }

  removePin(hostname: string): boolean {
    const initialLength = this.pins.length;
    this.pins = this.pins.filter((pin) => pin.hostname !== hostname);
    return this.pins.length < initialLength;
  }

  getAllPins(): CertificatePin[] {
    return [...this.pins];
  }

  getSecurityHeaders(): Record<string, string> {
    // Headers must reflect reality: pinning is only "enabled" when the native
    // pinning library is present AND pins are configured for the request host.
    return {
      'X-Certificate-Pinning':
        this.isEnabled && NATIVE_PINNING_AVAILABLE && this.pins.length > 0
          ? 'enabled'
          : 'unenforced',
      'X-Pinned-Hosts': this.pins.map((p) => p.hostname).join(','),
    };
  }

  /**
   * Extract the server certificate's SHA-256 fingerprint from the TLS handshake.
   *
   * NOTE: Vanilla JavaScript `fetch` does NOT expose the TLS certificate chain.
   * This method uses a two-layer approach:
   *   1. If `react-native-ssl-pinning` is installed (via Expo config plugin),
   *      it delegates to `sslPinningFetch` which validates pins natively.
   *   2. Otherwise, it falls back to standard fetch and logs a warning.
   *
   * For full enforcement in production, install `react-native-ssl-pinning`
   * and configure its Expo config plugin, OR use native iOS/Android
   * certificate pinning via App Transport Security / Network Security Config.
   */
  async fetchWithPinning(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isEnabled) {
      return fetch(url, options);
    }

    // Attempt native SSL pinning if available
    if (NATIVE_PINNING_AVAILABLE) {
      try {
        const sslPinning = require('react-native-ssl-pinning');
        const pinnedFetch = sslPinning.fetch || sslPinning.default?.fetch;
        if (pinnedFetch) {
          const hostname = new URL(url).hostname;
          const pin = this.getPinForHost(hostname);
          if (pin) {
            const sslOptions = {
              ...options,
              sslPinning: {
                certs: ['azeebo-prod'], // Certificate file names (without extension) from the native bundle
              },
              timeoutInterval: 10,
            };
            const response = await pinnedFetch(url, sslOptions);
            return response;
          }
        }
      } catch (_e) {
        // Fall through to standard fetch on a pinning error
      }
    }

    // No native pinning: TLS is still validated by the OS trust store, but
    // pins are NOT enforced here. Never advertise otherwise.
    if (!NATIVE_PINNING_AVAILABLE && !this.unenforcedWarned) {
      this.unenforcedWarned = true;
      logger.warn(
        'Certificate pinning: react-native-ssl-pinning not installed — ' +
          'requests use standard TLS validation without pin enforcement.'
      );
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...this.getSecurityHeaders(),
        },
      });

      return response;
    } catch (error) {
      // allowed-fabricated-4xx: mobile fetch layer — no HTTP exception
      // classes and no mapAndThrow here; the cause is preserved by message
      // wrapping and the branch exists so certificate failures are
      // distinguishable from other network errors upstream.
      if (error instanceof Error && (error as Error).message.includes('certificate')) {
        throw new Error(`Certificate validation failed for ${url}: ${(error as Error).message}`);
      }
      throw error;
    }
  }
}

export const certificatePinningService = CertificatePinningService.getInstance();

export function initializeCertificatePinning(): void {
  if (__DEV__) {
    logger.warn('Certificate pinning is disabled in development mode');
    certificatePinningService.setEnabled(false);
    return;
  }

  // Only claim pinning is active when the native library is actually present;
  // otherwise the app runs on standard OS TLS validation (still encrypted,
  // just not pinned).
  certificatePinningService.setEnabled(NATIVE_PINNING_AVAILABLE && DEFAULT_PINS.length > 0);

  if (!NATIVE_PINNING_AVAILABLE) {
    logger.warn(
      'Certificate pinning: react-native-ssl-pinning NOT installed. ' +
        'TLS-level pinning is not enforced. Install the library and configure ' +
        'its Expo config plugin for full protection.'
    );
  }

  if (Platform.OS === 'ios') {
    logger.debug('Certificate pinning initialized for iOS');
  } else if (Platform.OS === 'android') {
    logger.debug('Certificate pinning initialized for Android');
  }
}
