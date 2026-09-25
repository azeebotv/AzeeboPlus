'use client';
import { useState, useEffect } from 'react';

const CONSENT_KEY = 'azeebo_cookie_consent';
const CONSENT_VERSION = '1.0';
interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: '',
    version: CONSENT_VERSION,
  });
  useEffect(() => {
    const s = localStorage.getItem(CONSENT_KEY);
    if (s) {
      try {
        const p = JSON.parse(s) as ConsentState;
        if (p.version === CONSENT_VERSION) return;
      } catch {
        /* Corrupted localStorage — show consent banner */
      }
    }
    setShow(true);
  }, []);
  const save = (c: ConsentState) => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ ...c, timestamp: new Date().toISOString(), version: CONSENT_VERSION })
    );
    setShow(false);
  };
  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!details ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                CookieWe value your privacy
              </h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, analyze site traffic, and personalize
                content.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => save({ ...consent, analytics: false, marketing: false })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Decline
              </button>
              <button
                onClick={() => setDetails(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Customize
              </button>
              <button
                onClick={() => save({ ...consent, analytics: true, marketing: true })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cookie Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Necessary</p>
                  <p className="text-sm text-gray-600">Essential for the website to function.</p>
                </div>
                <input type="checkbox" checked disabled className="h-4 w-4 text-blue-600 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">Help us understand visitor interactions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Marketing</p>
                  <p className="text-sm text-gray-600">Used for personalized advertisements.</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                onClick={() => save(consent)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-4">
          Read our{' '}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>{' '}
          for more information.
        </p>
      </div>
    </div>
  );
}
export function hasConsent(category: 'necessary' | 'analytics' | 'marketing'): boolean {
  if (category === 'necessary') return true;
  const s = localStorage.getItem(CONSENT_KEY);
  if (!s) return false;
  try {
    return (JSON.parse(s) as ConsentState)[category] === true;
  } catch {
    return false;
  }
}
