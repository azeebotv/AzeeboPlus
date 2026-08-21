/**
 * App Store Compliance (TAA §28, ADR-017)
 *
 * Provides:
 * - iOS App Store compliance checklist
 * - Android Play Store compliance checklist
 * - Privacy manifest configuration
 * - Content rating configuration
 */

// ---------------------------------------------------------------------------
// iOS App Store Compliance
// ---------------------------------------------------------------------------

export interface IosCompliance {
  /** App Store Review Guidelines compliance */
  reviewGuidelines: {
    /** Content policies (1.1-1.5) */
    contentPolicies: boolean;
    /** Business policies (2.1-2.5) */
    businessPolicies: boolean;
    /** Design policies (3.1-3.6) */
    designPolicies: boolean;
    /** Legal policies (5.1-5.3) */
    legalPolicies: boolean;
  };
  /** Required privacy disclosures */
  privacyManifest: {
    /** Tracking domains */
    trackingDomains: string[];
    /** Data collection purposes */
    dataPurposes: string[];
    /** Third-party SDKs requiring disclosure */
    thirdPartySdks: string[];
  };
  /** Content rating */
  contentRating: '4+' | '9+' | '12+' | '17+';
  /** In-app purchase types */
  inAppPurchases: ('consumable' | 'non-consumable' | 'subscription')[];
}

export const IOS_COMPLIANCE: IosCompliance = {
  reviewGuidelines: {
    contentPolicies: true, // No objectionable content
    businessPolicies: true, // Clear subscription terms
    designPolicies: true, // Follows HIG
    legalPolicies: true, // Privacy policy, terms of service
  },
  privacyManifest: {
    trackingDomains: [], // No tracking without consent
    dataPurposes: [
      'Analytics',
      'App Functionality',
      'Personalization',
    ],
    thirdPartySdks: [
      'expo-secure-store',
      'react-native-video',
      '@react-navigation/native',
    ],
  },
  contentRating: '12+', // Suitable for ages 12+
  inAppPurchases: ['subscription', 'consumable'],
};

// ---------------------------------------------------------------------------
// Android Play Store Compliance
// ---------------------------------------------------------------------------

export interface AndroidCompliance {
  /** Play Store policies */
  playPolicies: {
    /** Content policies */
    contentPolicies: boolean;
    /** Privacy policies */
    privacyPolicies: boolean;
    /** Monetization policies */
    monetizationPolicies: boolean;
    /** Family policies */
    familyPolicies: boolean;
  };
  /** Data safety section */
  dataSafety: {
    /** Data collection */
    collectsData: boolean;
    /** Data sharing */
    sharesData: boolean;
    /** Security practices */
    securityPractices: string[];
    /** Data types collected */
    dataTypes: string[];
  };
  /** Content rating */
  contentRating: {
    contentDescriptors: string[];
    maturityLevel: 'Everyone' | 'Teen' | 'Mature';
  };
  /** Target API level */
  targetSdkVersion: number;
  /** Permission declarations */
  permissions: string[];
}

export const ANDROID_COMPLIANCE: AndroidCompliance = {
  playPolicies: {
    contentPolicies: true,
    privacyPolicies: true,
    monetizationPolicies: true,
    familyPolicies: true,
  },
  dataSafety: {
    collectsData: true,
    sharesData: false,
    securityPractices: [
      'Data is encrypted in transit',
      'Data is encrypted at rest',
      'Users can request data deletion',
      'Independent security review',
    ],
    dataTypes: [
      'Personal info (name, email)',
      'Financial info (payment history)',
      'App activity (content watched)',
      'Device info (device ID, OS version)',
    ],
  },
  contentRating: {
    contentDescriptors: ['Violence', 'Simulated Gambling', 'User Interaction', 'Digital Purchases'],
    maturityLevel: 'Teen',
  },
  targetSdkVersion: 34, // Android 14
  permissions: [
    'INTERNET',
    'ACCESS_NETWORK_STATE',
    'RECEIVE_BOOT_COMPLETED',
    'VIBRATE',
    'WRITE_EXTERNAL_STORAGE', // For downloads (Android < 10)
  ],
};

// ---------------------------------------------------------------------------
// Compliance Verification
// ---------------------------------------------------------------------------

/**
 * Verify iOS compliance checklist
 */
export function verifyIosCompliance(): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check privacy manifest
  if (IOS_COMPLIANCE.privacyManifest.trackingDomains.length > 0) {
    issues.push('Tracking domains require user consent');
  }

  // Check content rating
  if (IOS_COMPLIANCE.contentRating === '17+') {
    issues.push('17+ rating requires additional content warnings');
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Verify Android compliance checklist
 */
export function verifyAndroidCompliance(): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check target SDK
  if (ANDROID_COMPLIANCE.targetSdkVersion < 33) {
    issues.push('Target SDK version should be 33 or higher');
  }

  // Check data safety
  if (ANDROID_COMPLIANCE.dataSafety.collectsData && !ANDROID_COMPLIANCE.dataSafety.securityPractices.length) {
    issues.push('Data safety section requires security practices disclosure');
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Privacy Manifest (iOS 17+)
// ---------------------------------------------------------------------------

export interface PrivacyManifest {
  /** NSPrivacyTracking */
  tracking: boolean;
  /** NSPrivacyTrackingDomains */
  trackingDomains: string[];
  /** NSPrivacyCollectedDataTypes */
  collectedDataTypes: Array<{
    dataType: string;
    dataCollection: boolean;
    linked: boolean;
    tracking: boolean;
    purposes: string[];
  }>;
  /** NSPrivacyAccessedAPITypes */
  accessedApiTypes: string[];
}

/**
 * Generate privacy manifest for iOS
 */
export function generatePrivacyManifest(): PrivacyManifest {
  return {
    tracking: false,
    trackingDomains: [],
    collectedDataTypes: [
      {
        dataType: 'Name',
        dataCollection: true,
        linked: true,
        tracking: false,
        purposes: ['App Functionality'],
      },
      {
        dataType: 'Email Address',
        dataCollection: true,
        linked: true,
        tracking: false,
        purposes: ['App Functionality', 'Account Management'],
      },
      {
        dataType: 'Other User Content',
        dataCollection: true,
        linked: true,
        tracking: false,
        purposes: ['App Functionality'],
      },
    ],
    accessedApiTypes: [
      'NSPrivacyAccessedAPICategoryUserDefaults',
      'NSPrivacyAccessedAPICategoryFileTimestamp',
      'NSPrivacyAccessedAPICategoryDiskSpace',
    ],
  };
}
