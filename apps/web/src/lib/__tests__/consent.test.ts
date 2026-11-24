import { describe, it, expect, beforeEach } from 'vitest';
import {
  CONSENT_COOKIE,
  CONSENT_VERSION,
  DEFAULT_CONSENT_STATE,
  hasConsent,
  readConsent,
  writeConsent,
} from '@/lib/consent';

const LEGACY_STORAGE_KEY = 'azeebo_cookie_consent';

function clearConsentCookie(): void {
  // Secure is required even for deletion — the cookie jar enforces the
  // __Host- prefix rules on every write, including expiries.
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; Secure`;
}

function setRawConsentCookie(value: string): void {
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Path=/; Secure; SameSite=Lax`;
}

describe('consent storage (AUD-07 / AUD-45)', () => {
  beforeEach(() => {
    localStorage.clear();
    clearConsentCookie();
  });

  it('always grants `necessary`', () => {
    expect(hasConsent('necessary')).toBe(true);
  });

  it('denies analytics and marketing when no choice is stored', () => {
    expect(hasConsent('analytics')).toBe(false);
    expect(hasConsent('marketing')).toBe(false);
    expect(readConsent()).toBeNull();
  });

  it('grants only the categories explicitly stored', () => {
    writeConsent({ ...DEFAULT_CONSENT_STATE, analytics: true });
    expect(hasConsent('analytics')).toBe(true);
    expect(hasConsent('marketing')).toBe(false);
  });

  it('stamps the current version and a timestamp on write', () => {
    writeConsent({ ...DEFAULT_CONSENT_STATE, analytics: true, marketing: true });
    const stored = readConsent();
    expect(stored).not.toBeNull();
    expect(stored?.version).toBe(CONSENT_VERSION);
    expect(stored?.analytics).toBe(true);
    expect(stored?.marketing).toBe(true);
    expect(stored?.timestamp).not.toBe('');
  });

  it('persists the choice in the __Host- cookie, not localStorage', () => {
    writeConsent({ ...DEFAULT_CONSENT_STATE, analytics: true });
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=`);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('retires the legacy localStorage copy on write', () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_CONSENT_STATE,
        analytics: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      })
    );
    writeConsent({ ...DEFAULT_CONSENT_STATE, analytics: false });
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(hasConsent('analytics')).toBe(false);
  });

  it('honours the legacy localStorage choice when no cookie exists (migration)', () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_CONSENT_STATE,
        analytics: true,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
      })
    );
    expect(hasConsent('analytics')).toBe(true);
  });

  it('denies everything on corrupt cookie storage', () => {
    setRawConsentCookie('{not-json');
    expect(readConsent()).toBeNull();
    expect(hasConsent('analytics')).toBe(false);
  });

  it('denies when the stored consent schema version is outdated', () => {
    setRawConsentCookie(
      JSON.stringify({ ...DEFAULT_CONSENT_STATE, analytics: true, version: '0.9' })
    );
    expect(readConsent()?.version).toBe('0.9');
    expect(hasConsent('analytics')).toBe(false);
  });
});
