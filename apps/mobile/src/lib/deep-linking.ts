/**
 * Deep Linking Configuration
 * Android App Links + iOS Universal Links
 */

import { Linking } from 'react-native';

// ---------------------------------------------------------------------------
// Deep Link Configuration
// ---------------------------------------------------------------------------

/**
 * Supported deep link routes.
 * Maps URL paths to screen names for navigation.
 */
export const DEEP_LINK_ROUTES: Record<string, string> = {
  // Content
  '/content/:id': 'ContentDetail',
  '/vertical/:id': 'VerticalDetail',
  '/episode/:id': 'EpisodeDetail',
  '/universe/:id': 'UniverseDetail',
  '/creator/:id': 'CreatorProfile',

  // Reality
  '/reality/:showId/contestant/:id': 'ContestantDetail',
  '/reality/:showId/episode/:id': 'EpisodeDetail',
  '/reality/:showId/super-vote': 'SuperVote',

  // Knowledge
  '/knowledge/:id': 'KnowledgeDetail',
  '/storyworld/:id': 'StoryworldHub',
  '/character/:id': 'CharacterPage',

  // User
  '/profile/:id': 'UserProfile',
  '/settings': 'Settings',
  '/notifications': 'Notifications',

  // Commerce
  '/subscription': 'Subscription',
  '/wallet': 'Wallet',
  '/earnings': 'Earnings',
  '/rewards': 'Rewards',

  // Auth
  '/auth/login': 'Login',
  '/auth/signup': 'Signup',
  '/auth/forgot-password': 'ForgotPassword',
  '/auth/reset-password': 'ResetPassword',
  '/auth/verify-email': 'VerifyEmail',
};

/**
 * Base URL for deep links (configured per environment).
 */
export const DEEP_LINK_BASE_URL = {
  production: 'https://azeebo.com',
  staging: 'https://staging.azeebo.com',
  development: 'azeebo://',
};

// ---------------------------------------------------------------------------
// Deep Link Handler
// ---------------------------------------------------------------------------

export interface DeepLinkResult {
  /** Whether the link was handled */
  handled: boolean;
  /** The route that matched */
  route?: string;
  /** Extracted parameters */
  params?: Record<string, string>;
  /** Screen name to navigate to */
  screen?: string;
  /** Query parameters */
  query?: Record<string, string>;
}

/**
 * Parse a deep link URL and extract route information.
 */
export function parseDeepLink(url: string): DeepLinkResult {
  try {
    // Remove base URL
    let path = url;
    const bases = Object.values(DEEP_LINK_BASE_URL);
    for (const base of bases) {
      if (path.startsWith(base)) {
        path = path.slice(base.length);
        break;
      }
    }

    // Extract query string
    const [pathOnly, queryString] = path.split('?');
    const query: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        query[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }

    // Match against known routes
    for (const [pattern, screen] of Object.entries(DEEP_LINK_ROUTES)) {
      const params = matchRoute(pattern, pathOnly);
      if (params !== null) {
        return {
          handled: true,
          route: pattern,
          params,
          screen,
          query,
        };
      }
    }

    // No match — return unmatched for fallback handling
    return {
      handled: false,
      route: pathOnly,
      query,
    };
  } catch {
    return { handled: false };
  }
}

/**
 * Match a URL path against a route pattern.
 * Supports :param wildcards.
 */
function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      // Wildcard parameter
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      // Exact match required
      return null;
    }
  }

  return params;
}

// ---------------------------------------------------------------------------
// Deep Link Service
// ---------------------------------------------------------------------------

/**
 * Initialize deep link handling.
 * Call this once at app startup.
 */
export function initializeDeepLinks(onDeepLink: (result: DeepLinkResult) => void): () => void {
  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      const result = parseDeepLink(url);
      onDeepLink(result);
    }
  });

  // Handle subsequent URLs (app already open)
  const subscription = Linking.addEventListener('url', (event) => {
    const result = parseDeepLink(event.url);
    onDeepLink(result);
  });

  // Return cleanup function
  return () => {
    subscription?.remove();
  };
}

/**
 * Open a deep link from within the app.
 */
export async function openDeepLink(path: string): Promise<boolean> {
  const baseUrl = DEEP_LINK_BASE_URL[__DEV__ ? 'development' : 'production'];
  const url = `${baseUrl}${path}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Generate a shareable deep link URL.
 */
export function generateShareUrl(path: string): string {
  const baseUrl = DEEP_LINK_BASE_URL.production;
  return `${baseUrl}${path}`;
}

/**
 * Generate a shareable content URL.
 */
export function generateContentShareUrl(
  contentId: string,
  title: string
): {
  url: string;
  message: string;
} {
  const url = generateShareUrl(`/content/${contentId}`);
  return {
    url,
    message: `Check out "${title}" on Azeebo+! ${url}`,
  };
}
