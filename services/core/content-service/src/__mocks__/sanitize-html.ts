/**
 * Jest mock for sanitize-html.
 *
 * The real package depends on htmlparser2 which ships as ESM — Jest can't
 * parse it without extra transform config.  This stub strips all tags and
 * returns plain text, which is sufficient for unit-test assertions.
 */
export default function sanitizeHtml(input: unknown, _options?: Record<string, unknown>): string {
  if (typeof input !== 'string') return '';
  // Strip all HTML tags, keep text content
  return input.replace(/<[^>]*>/g, '').trim();
}
