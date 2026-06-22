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
  const extras = Constants.expoConfig?.extra || {};

  // Production pins
  const prodPin = extras.CERT_PIN_PRODUCTION;
  const prodBackup = extras.CERT_PIN_PRODUCTION_BACKUP;
  if (prodPin && !prodPin.includes('PLACEHOLDER')) {
    pins.push({
      hostname: 'api.azeebo.com',
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
      hostname: 'staging-api.azeebo.com',
      sha256Fingerprint: stagingPin,
      backupPin: stagingBackup,
      expiresAt: extras.CERT_PIN_EXPIRY || '2027-12-31T23:59:59Z',
    });
  }

  return pins;
};

const DEFAULT_PINS: CertificatePin[] = loadPinsFromConfig();

// Validate that we have real pins in production
const validatePins = (pins: CertificatePin[]): void => {
  if (!__DEV__ && pins.length === 0) {
    logger.error('CRITICAL: No valid certificate pins configured for production!');
    throw new Error('Certificate pinning not properly configured');
  }

  pins.forEach((pin) => {
    if (pin.sha256Fingerprint.includes('PLACEHOLDER')) {
      logger.error(`CRITICAL: Placeholder certificate pin detected for ${pin.hostname}`);
      if (!__DEV__) {
        throw new Error(`Invalid certificate pin for ${pin.hostname}`);
      }
    }
  });
};

// Validate pins on initialization
validatePins(DEFAULT_PINS);

class CertificatePinningService {
  private static instance: CertificatePinningService;
  private pins: CertificatePin[] = DEFAULT_PINS;
  private isEnabled: boolean = __DEV__ ? false : true;

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

  async validateCertificate(
    hostname: string,
    certificateFingerprint: string
  ): Promise<PinValidationResult> {
    if (!this.isEnabled) {
      return { isValid: true, pinnedHost: hostname };
    }

    const pin = this.getPinForHost(hostname);

    if (!pin) {
      return {
        isValid: true,
        pinnedHost: hostname,
        error: `No pin configured for host: ${hostname}`,
      };
    }

    if (pin.expiresAt && new Date(pin.expiresAt) < new Date()) {
      return {
        isValid: false,
        pinnedHost: hostname,
        error: 'Certificate pin has expired',
      };
    }

    const isPrimaryMatch = certificateFingerprint === pin.sha256Fingerprint;
    const isBackupMatch = pin.backupPin && certificateFingerprint === pin.backupPin;

    if (isPrimaryMatch || isBackupMatch) {
      return { isValid: true, pinnedHost: hostname };
    }

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
    return {
      'X-Certificate-Pinning': this.isEnabled ? 'enabled' : 'disabled',
      'X-Pinned-Hosts': this.pins.map((p) => p.hostname).join(','),
    };
  }

  async fetchWithPinning(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isEnabled) {
      return fetch(url, options);
    }

    const validation = await this.validateUrl(url, 'pending');

    if (!validation.isValid) {
      throw new Error(`Certificate pinning validation failed for ${url}: ${validation.error}`);
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
      if (error instanceof Error && error.message.includes('certificate')) {
        throw new Error(`Certificate validation failed for ${url}: ${error.message}`);
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

  certificatePinningService.setEnabled(true);

  if (Platform.OS === 'ios') {
    logger.debug('Certificate pinning initialized for iOS');
  } else if (Platform.OS === 'android') {
    logger.debug('Certificate pinning initialized for Android');
  }
}
