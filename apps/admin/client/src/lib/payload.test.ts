import { describe, it, expect } from 'vitest';
import { asArray, unwrapList, num, str, bool, isRecord } from './payload';

describe('asArray', () => {
  it('passes through a bare array', () => {
    expect(asArray([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(asArray([])).toEqual([]);
  });

  it('unwraps a paginated envelope with the default key', () => {
    expect(asArray({ items: [1, 2], total: 2 })).toEqual([1, 2]);
  });

  it('unwraps nonstandard envelope keys on demand', () => {
    expect(asArray({ logs: ['a'] }, 'logs')).toEqual(['a']);
    expect(asArray({ data: ['x'] }, 'data')).toEqual(['x']);
  });

  it('returns [] for objects without an array field and for nullish values', () => {
    expect(asArray({ total: 5 })).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
    expect(asArray(null)).toEqual([]);
    expect(asArray('string')).toEqual([]);
  });

  it('never returns the object itself (the .map-is-not-a-function class)', () => {
    const payload = { items: undefined };
    const result = asArray(payload);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('unwrapList', () => {
  it('returns items + total from an envelope', () => {
    expect(unwrapList({ items: ['a'], total: 41 })).toEqual({ items: ['a'], total: 41 });
  });

  it('handles a bare array with a null total', () => {
    expect(unwrapList([1, 2, 3])).toEqual({ items: [1, 2, 3], total: null });
  });

  it('falls back safely on garbage and non-numeric totals', () => {
    expect(unwrapList(undefined)).toEqual({ items: [], total: null });
    expect(unwrapList({ items: [1], total: 'many' })).toEqual({ items: [1], total: null });
  });
});

describe('field guards', () => {
  it('num coerces finite numbers and numeric strings, else fallback', () => {
    expect(num(5)).toBe(5);
    expect(num('12.5')).toBe(12.5);
    expect(num(undefined)).toBe(0);
    expect(num(null, 7)).toBe(7);
    expect(num(NaN)).toBe(0);
    expect(num(Infinity)).toBe(0);
    expect(num('abc', 3)).toBe(3);
  });

  it('str keeps strings, stringifies finite numbers, else fallback', () => {
    expect(str('hi')).toBe('hi');
    expect(str(42)).toBe('42');
    expect(str(undefined)).toBe('');
    expect(str(null, 'n/a')).toBe('n/a');
  });

  it('bool keeps booleans, else fallback', () => {
    expect(bool(true)).toBe(true);
    expect(bool(false)).toBe(false);
    expect(bool(undefined)).toBe(false);
    expect(bool(undefined, true)).toBe(true);
    expect(bool('true')).toBe(false);
  });

  it('isRecord excludes arrays and null', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('x')).toBe(false);
  });
});
