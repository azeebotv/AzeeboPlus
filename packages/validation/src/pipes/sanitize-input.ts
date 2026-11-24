import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize a user-generated string before persisting to the database.
 * Strips all HTML tags and encodes special characters to prevent stored XSS.
 *
 * This is a **defense-in-depth** measure — the web client uses React's default
 * escaping and the output interceptor also strips HTML, but sanitizing on write
 * ensures no raw HTML reaches the database regardless of the client.
 *
 * @example
 * ```ts
 * const clean = sanitizeInput('<script>alert("xss")</script>Hello');
 * // => 'Hello'
 * ```
 */
export function sanitizeInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  // Strip all HTML tags, keeping only text content.
  // encodeEntities converts < > & " to their HTML entities, preventing
  // any tag injection even if a client sends encoded payloads.
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

/**
 * Sanitize specific fields of an object in-place (returns a new object).
 * Only touches string fields listed in `fields`.
 *
 * @example
 * ```ts
 * const clean = sanitizeFields(dto, ['title', 'description', 'bio']);
 * ```
 */
export function sanitizeFields<T extends Record<string, unknown>>(obj: T, fields: string[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (field in result) {
      (result as Record<string, unknown>)[field] = sanitizeInput(result[field]);
    }
  }
  return result;
}

/**
 * Common field names that contain user-generated text and should be sanitized.
 */
export const USER_CONTENT_FIELDS = [
  'title',
  'description',
  'name',
  'displayName',
  'bio',
  'content',
  'comment',
  'message',
  'text',
  'body',
  'reason',
  'notes',
];
