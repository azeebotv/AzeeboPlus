export default function sanitizeHtml(
  input: unknown,
  _options?: Record<string, unknown>,
): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}
