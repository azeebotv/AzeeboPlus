/**
 * Validates WebSocket connection origins against a strict allowlist.
 *
 * LOW-07: WebSocket connections should use a separate, stricter origin
 * validation than HTTP CORS. This prevents cross-site WebSocket hijacking
 * when ALLOWED_ORIGINS is broadly configured.
 */

const WEBSOCKET_ORIGIN_ALLOWLIST_KEY = 'WEBSOCKET_ORIGIN_ALLOWLIST';

/**
 * Get the WebSocket-specific origin allowlist. Falls back to ALLOWED_ORIGINS
 * if not explicitly set, but logs a warning encouraging separate configuration.
 */
export function getWebSocketOrigins(): string[] {
  const explicit = process.env[WEBSOCKET_ORIGIN_ALLOWLIST_KEY];
  if (explicit) {
    return explicit
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  // Fall back to general ALLOWED_ORIGINS but log a warning
  const general = process.env.ALLOWED_ORIGINS;
  if (general) {
    console.warn(
      `[WebSocket] WEBSOCKET_ORIGIN_ALLOWLIST not set — falling back to ALLOWED_ORIGINS. ` +
        `Consider setting a stricter allowlist for WebSocket connections.`
    );
    return general
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  // No origins configured — block all cross-origin WebSocket connections
  return [];
}

/**
 * Create a CORS configuration for WebSocket gateways that validates
 * the requesting origin against the allowlist.
 *
 * Usage in gateway:
 * ```typescript
 * @WebSocketGateway({
 *   cors: createWebSocketCorsConfig(),
 *   namespace: '/reality',
 * })
 * ```
 */
export function createWebSocketCorsConfig(): {
  origin: string[];
  credentials: boolean;
} {
  return {
    origin: getWebSocketOrigins(),
    credentials: true,
  };
}

/**
 * Validate that a given origin is in the WebSocket allowlist.
 * Used as a custom CORS origin function for fine-grained control.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowed = getWebSocketOrigins();
  if (allowed.length === 0) return false;
  return allowed.some((allowedOrigin) => origin === allowedOrigin);
}
