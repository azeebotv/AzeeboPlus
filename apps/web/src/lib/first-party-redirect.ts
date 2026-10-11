/**
 * Destinations the sign-in page may send a user to after a successful login.
 *
 * Same-origin paths cover the web app itself. The admin and creator panels are
 * separate origins that hand their unauthenticated users here, so an absolute
 * target is accepted only when its origin is explicitly configured as a
 * first-party panel. Matching is on the parsed `URL.origin`, never on a string
 * prefix — prefix checks are defeated by `https://azeebo.com?x=` and
 * `https://admin.azeebo.com.evil.com` style values.
 */
export function panelOrigins(
  // Written as a literal member access because Next.js inlines only the
  // literal `process.env.NEXT_PUBLIC_*` form at build time.
  env: string = process.env.NEXT_PUBLIC_PANEL_ORIGINS ?? ''
): string[] {
  return env
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/** Normalizes an env list to comparable origins, dropping malformed entries. */
function normalizedOrigins(list: string[]): string[] {
  const out: string[] = [];
  for (const value of list) {
    try {
      out.push(new URL(value).origin);
    } catch {
      // A malformed allowlist entry simply never matches.
    }
  }
  return out;
}

function isSafeSameOriginPath(value: string): boolean {
  // `//host` is protocol-relative and `\host` normalises to `//host` in
  // browsers, so both leave the site.
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.includes('://')
  );
}

/**
 * Returns either a same-origin path or an allowlisted panel URL. Anything else
 * collapses to `fallback` so a tampered `?redirect=` can never bounce a
 * freshly-authenticated session to a third party.
 */
export function safeRedirectTarget(
  raw: string | null | undefined,
  fallback = '/home',
  allowedOrigins: string[] = normalizedOrigins(panelOrigins())
): string {
  if (!raw) return fallback;
  if (isSafeSameOriginPath(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fallback;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback;
  if (url.username || url.password) return fallback;
  if (!allowedOrigins.includes(url.origin)) return fallback;
  return url.toString();
}

export function isAbsoluteTarget(target: string): boolean {
  return /^https?:\/\//i.test(target);
}
