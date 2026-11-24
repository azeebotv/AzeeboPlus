'use client';

import { useEffect, useState } from 'react';

/**
 * Capability Negotiation & Forced Upgrade (TAA §89, F-CC-05)
 * Server returns min_supported_version metadata.
 * Client hides unsupported flows and shows forced upgrade UX.
 */

interface ServerCapabilities {
  minSupportedVersion: string;
  currentVersion: string;
  features: Record<string, string>; // feature -> min version
}

interface ForcedUpgradeProps {
  /** Current client version */
  clientVersion: string;
  /** Server capabilities */
  capabilities: ServerCapabilities | null;
  /** App store URLs */
  storeUrls?: {
    ios?: string;
    android?: string;
    web?: string;
  };
}

function isVersionSupported(client: string, minimum: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [cMajor, cMinor, cPatch] = parse(client);
  const [mMajor, mMinor, mPatch] = parse(minimum);

  if (cMajor !== mMajor) return cMajor > mMajor;
  if (cMinor !== mMinor) return cMinor > mMinor;
  return cPatch >= mPatch;
}

export function ForcedUpgrade({ clientVersion, capabilities, storeUrls }: ForcedUpgradeProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    if (!capabilities) return;

    const supported = isVersionSupported(clientVersion, capabilities.minSupportedVersion);
    if (!supported) {
      setShowUpgrade(true);
    }

    // Detect platform
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad/.test(ua)) setPlatform('ios');
      else if (/android/.test(ua)) setPlatform('android');
      else setPlatform('web');
    }
  }, [clientVersion, capabilities]);

  if (!showUpgrade || !capabilities) return null;

  const storeUrl = storeUrls?.[platform] || storeUrls?.web;

  return (
    <div className="fixed inset-0 z-50 bg-az-surface-root flex items-center justify-center px-4">
      <div className="az-glass max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-az-scarlet/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-az-scarlet"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h2 className="az-section-title text-az-ink mb-3">Update Required</h2>
        <p className="az-lead text-az-ink-dim mb-2">
          Your current version ({clientVersion}) is no longer supported.
        </p>
        <p className="az-body text-az-ink-muted mb-6">
          Please update to version {capabilities.minSupportedVersion} or later to continue using
          Azeebo+.
        </p>

        {/* Version info */}
        <div className="bg-az-glass-fill rounded-az-control p-3 mb-6 az-body">
          <div className="flex justify-between text-az-ink-muted">
            <span>Your version</span>
            <span className="text-az-error-400 font-mono">{clientVersion}</span>
          </div>
          <div className="flex justify-between text-az-ink-muted mt-1">
            <span>Required version</span>
            <span className="text-az-success-400 font-mono">
              {capabilities.minSupportedVersion}
            </span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          {storeUrl && (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block az-btn-primary"
            >
              Update Now
            </a>
          )}

          {!storeUrl && platform === 'web' && (
            <button onClick={() => window.location.reload()} className="az-btn-primary">
              Refresh to Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check feature support based on capability negotiation
 */
export function useFeatureSupport(capabilities: ServerCapabilities | null, clientVersion: string) {
  const checkFeature = (feature: string): boolean => {
    if (!capabilities?.features[feature]) return true;
    return isVersionSupported(clientVersion, capabilities.features[feature]);
  };

  const isUpgradeRequired = capabilities
    ? !isVersionSupported(clientVersion, capabilities.minSupportedVersion)
    : false;

  return { checkFeature, isUpgradeRequired };
}
