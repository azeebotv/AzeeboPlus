export function parseJsonRecord<T extends Record<string, unknown>>(data: unknown, fallback: T): T {
  if (typeof data === 'object' && data !== null) {
    return { ...fallback, ...(data as T) };
  }
  return fallback;
}

export function isValidRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export interface JsonRecord {
  [key: string]: string | number | boolean | null | JsonRecord | JsonRecord[];
}
export type StrictJsonRecord = Record<string, string | number | boolean | null>;

export function createJsonRecord<T extends StrictJsonRecord>(data: unknown): T | null {
  if (isValidRecord(data)) {
    const validated: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        validated[key] = value;
      }
    }
    return validated as T;
  }
  return null;
}