'use client';
import { useState, useEffect, useRef } from 'react';
import {
  CONSENT_VERSION,
  DEFAULT_CONSENT_STATE,
  readConsent,
  writeConsent,
  type ConsentState,
} from '@/lib/consent';
import { applyAnalyticsConsent } from '@/lib/analytics';

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT_STATE);

  useEffect(() => {
    const stored = readConsent();
    // A stored choice at the current schema version means we've already asked.
    // Anything else (missing, corrupt, outdated) re-shows the banner — and
    // until the user answers, lib/consent.ts keeps non-essential consent OFF.
    if (stored && stored.version === CONSENT_VERSION) return;
    setShow(true);
  }, []);

  useEffect(() => {
    if (show && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [show, details]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (details) {
        setDetails(false);
      }
      return;
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const save = (c: ConsentState) => {
    writeConsent(c);
    // AUD-07: hand the fresh choice straight to the analytics layer —
    // Accept All starts collection, Decline/Save-off stops it, no reload.
    applyAnalyticsConsent(c.analytics, c.marketing);
    setShow(false);
  };
  if (!show) return null;
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed bottom-0 left-0 right-0 z-50 az-glass"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!details ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="az-subtitle text-az-ink mb-2">Cookies — We value your privacy</h3>
              <p className="az-body text-az-ink-dim">
                We use cookies to enhance your experience, analyze site traffic, and personalize
                content.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => save({ ...consent, analytics: false, marketing: false })}
                className="az-btn-social"
              >
                Decline
              </button>
              <button onClick={() => setDetails(true)} className="az-btn-social">
                Customize
              </button>
              <button
                onClick={() => save({ ...consent, analytics: true, marketing: true })}
                className="az-btn-primary az-btn-primary--inline"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="az-subtitle text-az-ink mb-4">Cookie Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="az-body-strong text-az-ink">Necessary</p>
                  <p className="az-body text-az-ink-muted">
                    Essential for the website to function.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 rounded accent-az-scarlet"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="az-body-strong text-az-ink">Analytics</p>
                  <p className="az-body text-az-ink-muted">
                    Help us understand visitor interactions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="h-4 w-4 rounded accent-az-scarlet"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="az-body-strong text-az-ink">Marketing</p>
                  <p className="az-body text-az-ink-muted">Used for personalized advertisements.</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="h-4 w-4 rounded accent-az-scarlet"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDetails(false)} className="az-btn-social">
                Back
              </button>
              <button
                onClick={() => save(consent)}
                className="az-btn-primary az-btn-primary--inline"
              >
                Save
              </button>
            </div>
          </div>
        )}
        <p className="az-caption text-az-ink-muted mt-4">
          Read our{' '}
          <a href="/cookies" className="underline">
            Cookie Policy
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>{' '}
          for more information.
        </p>
      </div>
    </div>
  );
}
// Re-exported for backwards compatibility — the implementation now lives in
// lib/consent.ts so the analytics layer and the banner share one source of truth.
export { hasConsent } from '@/lib/consent';
