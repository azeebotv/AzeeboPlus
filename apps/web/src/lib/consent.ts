/**
 * Cookie-consent storage — single source of truth for the banner's stored
 * choice (AUD-07, AUD-45).
 *
 * AUD-45: the choice lives in a first-party `__Host-azeebo_consent` cookie
 * instead of localStorage. The `__Host-` prefix gives browser-enforced
 * guarantees (Secure, Path=/, no Domain scoping, invisible to subdomains),
 * and — unlike localStorage — the value is readable server-side, so the
 * analytics ingest route (app/api/v1/analytics/events) gates collection on
 * the exact same signal the client uses. The pre-cookie localStorage copy is
 * honoured read-only so returning visitors keep their choice; every write
 * goes to the cookie. All access is SSR-safe: this module is imported from
 * Server Components and during prerender.
 */

export const CONSENT_COOKIE = '__Host-azeebo_consent';
/** Pre-cookie localStorage key — legacy read fallback, never written. */
export const LEGACY_CONSENT_STORAGE_KEY = 'azeebo_cookie_consent';
export const CONSENT_VERSION = '1.0';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

/** Deny-by-default state: no non-essential consent until the user opts in. */
export const DEFAULT_CONSENT_STATE: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: '',
  version: CONSENT_VERSION,
};

/**
 * Parse a raw consent-cookie value into a ConsentState, or null when absent
 * or corrupt. Pure — no DOM, no Next imports — so the client and API routes
 * share one parser. `document.cookie` yields the percent-encoded value while
 * Next's `request.cookies` yields the decoded one; decodeURIComponent is a
 * no-op on already-decoded payloads and the try/catch tolerates either form.
 */
export function parseConsentValue(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ConsentState | null;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match?.[1] ?? null;
}

/** Read the stored banner choice, or null when absent or corrupt. */
export function readConsent(): ConsentState | null {
  const fromCookie = parseConsentValue(readCookie(CONSENT_COOKIE));
  if (fromCookie) return fromCookie;
  // Migration: visitors who chose before the cookie existed keep their
  // stored answer (read-only — no localStorage write happens anywhere).
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentState | null;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist the banner choice, timestamped and stamped with the schema version. */
export function writeConsent(consent: ConsentState): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(
    JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    })
  );
  // `__Host-` requires Secure + Path=/ and forbids a Domain attribute.
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Secure; SameSite=Lax; Max-Age=${CONSENT_MAX_AGE}`;
  // The cookie is now the single source — retire the legacy localStorage copy.
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY);
    } catch {
      // storage unavailable — nothing to retire
    }
  }
}

/**
 * Has the user granted `category`?
 *
 * Deny-by-default: no stored choice, corrupt storage, an outdated consent
 * schema version, or server-side rendering all answer `false`. `necessary`
 * is always true (it is required for the site to function and is not a
 * cookie choice).
 */
export function hasConsent(category: 'necessary' | 'analytics' | 'marketing'): boolean {
  if (category === 'necessary') return true;
  const stored = readConsent();
  if (!stored || stored.version !== CONSENT_VERSION) return false;
  return stored[category] === true;
}
