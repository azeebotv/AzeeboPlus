/**
 * The Creator Studio has no credential form of its own. Signing in happens on
 * the main web app, which mints the platform-wide httpOnly auth cookies this
 * SPA then authenticates with — so an unauthenticated creator is handed off
 * there and comes back with a live session.
 *
 * The web login only bounces to origins it has been told are first-party:
 * `NEXT_PUBLIC_PANEL_ORIGINS` on apps/web must contain this app's origin, or the
 * return target collapses to `/home` and the creator never comes back.
 */
const WEB_APP_URL = (import.meta.env.VITE_WEB_APP_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  ''
);

export { WEB_APP_URL };

/**
 * Resolve a `?next=` value to a same-app path. Anything that could escape this
 * origin (protocol-relative, backslash-normalising) falls back to the overview.
 */
export function safePath(next: string | null | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
    ? next
    : '/';
}

/** Absolute URL the web login is allowed to bounce back to. */
function returnTo(next: string | null | undefined): string {
  return new URL(safePath(next), window.location.origin).toString();
}

export function webLoginUrl(next?: string | null): string {
  const url = new URL('/auth/login', WEB_APP_URL);
  url.searchParams.set('redirect', returnTo(next));
  return url.toString();
}

/** Places the user on the web sign-in page, coming back here on success. */
export function goToWebLogin(next?: string | null): void {
  window.location.replace(webLoginUrl(next));
}

/** Where a signed-in non-creator goes to apply for the role. */
export function webRoleSelectionUrl(): string {
  return `${WEB_APP_URL}/auth/role-selection`;
}
