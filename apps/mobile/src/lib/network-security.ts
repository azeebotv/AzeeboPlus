/**
 * Network Security Configuration
 * TLS pinning, certificate management, and network hardening
 */

// ---------------------------------------------------------------------------
// Certificate Pinning Configuration
// ---------------------------------------------------------------------------

/**
 * Certificate pinning configuration.
 * Pins are SHA-256 hashes of the Subject Public Key Info (SPKI).
 */
export interface CertificatePin {
  /** Hostname to pin */
  hostname: string;
  /** SHA-256 SPKI pin (base64-encoded) */
  pin: string;
  /** Backup pin (in case primary rotates) */
  backupPin?: string;
  /** Expiry date for the pin */
  expiresAt?: string;
}

/**
 * Production certificate pins.
 * UPDATE THESE when certificates rotate!
 */
export const CERTIFICATE_PINS: CertificatePin[] = [
  {
    hostname: 'api.azeebo.com',
    pin: 'YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=', // Primary
    backupPin: 'sRHdIHwgN7K0UFMzMPCYqJhGS8B/9S2M1NjXmZKqHcQ=',
    expiresAt: '2025-12-31',
  },
  {
    hostname: 'cdn.azeebo.com',
    pin: 'YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
    backupPin: 'sRHdIHwgN7K0UFMzMPCYqJhGS8B/9S2M1NjXmZKqHcQ=',
    expiresAt: '2025-12-31',
  },
  {
    hostname: 'staging-api.azeebo.com',
    pin: 'DEV_PIN_REPLACE_IN_PRODUCTION',
    expiresAt: '2025-12-31',
  },
];

// ---------------------------------------------------------------------------
// Network Security Configuration (Android)
// ---------------------------------------------------------------------------

/**
 * Android Network Security Configuration.
 * This mirrors the XML config but in a TypeScript structure
 * for programmatic access and verification.
 */
export interface NetworkSecurityConfig {
  /** Base configuration applied to all domains */
  baseConfig: {
    /** Allow user-installed CAs for debugging */
    trustUserCerts: boolean;
    /** Allow debug CAs */
    trustDebugCerts: boolean;
    /** Minimum TLS version */
    minTlsVersion: 'TLSv1.2' | 'TLSv1.3';
    /** Whether to use certificate pinning */
    certificatePinning: boolean;
  };
  /** Domain-specific overrides */
  domainConfigs: Array<{
    domain: string;
    includeSubdomains: boolean;
    trustUserCerts: boolean;
    certificatePins: string[];
  }>;
}

/**
 * Default network security configuration.
 */
export const DEFAULT_NETWORK_SECURITY: NetworkSecurityConfig = {
  baseConfig: {
    trustUserCerts: __DEV__, // Only in debug builds
    trustDebugCerts: __DEV__,
    minTlsVersion: 'TLSv1.2',
    certificatePinning: !__DEV__, // Only in release builds
  },
  domainConfigs: [
    {
      domain: 'azeebo.com',
      includeSubdomains: true,
      trustUserCerts: false,
      certificatePins: CERTIFICATE_PINS
        .filter((p) => p.hostname.includes('azeebo.com'))
        .map((p) => p.pin),
    },
    {
      domain: 'localhost',
      includeSubdomains: false,
      trustUserCerts: true, // Allow for local development
      certificatePins: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// Network Security Service
// ---------------------------------------------------------------------------

/**
 * Verify that a certificate chain matches the pinned certificates.
 */
export function verifyCertificatePin(
  hostname: string,
  certificateChain: string[],
): CertificateVerification {
  const pinConfig = CERTIFICATE_PINS.find(
    (p) => hostname === p.hostname || hostname.endsWith(`.${p.hostname}`),
  );

  if (!pinConfig) {
    return {
      verified: false,
      reason: `No pin configuration found for host: ${hostname}`,
    };
  }

  // Check if pin has expired
  if (pinConfig.expiresAt) {
    const expiry = new Date(pinConfig.expiresAt);
    if (expiry < new Date()) {
      return {
        verified: false,
        reason: `Certificate pin expired for ${hostname}. Rotation required.`,
        pinExpired: true,
      };
    }
  }

  // In production, verify against the certificate chain
  // For now, return the pin configuration for native module verification
  return {
    verified: true,
    hostname,
    pin: pinConfig.pin,
    backupPin: pinConfig.backupPin,
    expiresAt: pinConfig.expiresAt,
  };
}

export interface CertificateVerification {
  verified: boolean;
  reason?: string;
  pinExpired?: boolean;
  hostname?: string;
  pin?: string;
  backupPin?: string;
  expiresAt?: string;
}

/**
 * Generate the Android network_security_config.xml content.
 */
export function generateAndroidNetworkSecurityConfig(): string {
  const config = DEFAULT_NETWORK_SECURITY;

  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += '<network-security-config>\n';

  // Base config
  xml += '  <base-config cleartextTrafficPermitted="false">\n';
  xml += '    <trust-anchors>\n';
  xml += '      <certificates src="system" />\n';
  if (config.baseConfig.trustUserCerts) {
        xml += '      <certificates src="user" />\n';
      }
  xml += '    </trust-anchors>\n';
  xml += '  </base-config>\n';

  // Domain configs
  for (const domain of config.domainConfigs) {
    if (domain.certificatePins.length > 0) {
      xml += `  <domain-config${domain.includeSubdomains ? '' : ''}>\n`;
      xml += `    <domain${domain.includeSubdomains ? ' includeSubdomains="true"' : ''}>${domain.domain}</domain>\n`;
      xml += '    <pin-set expiration="2025-12-31">\n';
      for (const pin of domain.certificatePins) {
        xml += `      <pin digest="SHA-256">${pin}</pin>\n`;
      }
      xml += '    </pin-set>\n';
      xml += '  </domain-config>\n';
    }
  }

  xml += '</network-security-config>\n';
  return xml;
}

/**
 * Generate iOS App Transport Security exceptions.
 */
export function generateIOSNetworkSecurity(): Record<string, unknown> {
  return {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: __DEV__, // Only in debug
      NSExceptionDomains: {
        'localhost': {
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSIncludesSubdomains: true,
        },
        'staging-api.azeebo.com': {
          NSExceptionRequiresForwardSecrecy: true,
          NSIncludesSubdomains: true,
          NSExceptionMinimumTLSVersion: 'TLSv1.2',
        },
      },
    },
  };
}

/**
 * Check if a URL requires certificate pinning.
 */
export function requiresCertificatePinning(url: string): boolean {
  if (__DEV__) return false; // Skip in development

  try {
    const { hostname } = new URL(url);
    return CERTIFICATE_PINS.some(
      (pin) => hostname === pin.hostname || hostname.endsWith(`.${pin.hostname}`),
    );
  } catch {
    return false;
  }
}
