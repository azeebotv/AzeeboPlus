import { format, parseISO, differenceInDays } from 'date-fns';

/** Formats a numeric amount as a currency string with the appropriate symbol. */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formats a Date or ISO string using the given date-fns format pattern. */
export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/** Converts a duration in seconds to a human-readable mm:ss or h:mm:ss string. */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/** Truncates a string to the given length and appends an ellipsis. */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/** Generates a cryptographically random UUID v4. */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Decodes the payload of a JWT without verifying the signature. */
export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = typeof Buffer !== 'undefined'
      ? Buffer.from(payload, 'base64url').toString('utf-8')
      : new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Escapes HTML special characters to prevent XSS injection. */
export function sanitizeText(dirty: string): string {
  if (!dirty) return '';

  return dirty
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/** Removes all HTML tags and unescapes HTML entities from a string. */
export function stripAllHtml(dirty: string): string {
  if (!dirty) return '';

  return dirty
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/** Debounces a function so it only executes after the specified delay. */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Throttles a function so it executes at most once per interval. */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let pendingArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        if (pendingArgs) {
          fn(...pendingArgs);
          pendingArgs = null;
        }
        inThrottle = false;
      }, limit);
    } else {
      pendingArgs = args;
    }
  };
}

/** Returns the number of days elapsed since the given date. */
export function daysSince(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(new Date(), dateObj);
}

/** Safely converts a value to a number, returning 0 for invalid inputs. */
export function toNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'number' ? value : parseFloat(value) || 0;
}

/** Formats a number to a fixed number of decimal places. */
export function addDecimals(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export * from './type-utils';
export { withRetry, RetryOptions } from './retry';
