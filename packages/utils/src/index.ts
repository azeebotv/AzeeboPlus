import { format, parseISO, differenceInDays } from 'date-fns';

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

export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return dirty
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/onerror\s*=/gi, '')
    .trim();
}

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

export function daysSince(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(new Date(), dateObj);
}

export function toNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  return typeof value === 'number' ? value : parseFloat(value) || 0;
}

export function addDecimals(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export { withRetry, RetryOptions } from './retry';
