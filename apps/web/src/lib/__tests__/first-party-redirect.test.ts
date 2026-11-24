import { describe, it, expect, beforeEach } from 'vitest';
import { isAbsoluteTarget, panelOrigins, safeRedirectTarget } from '../first-party-redirect';

describe('sign-in redirect targets', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_PANEL_ORIGINS = 'http://localhost:5173,https://admin.azeebo.com/';
  });

  it('normalizes the panel origin list', () => {
    expect(panelOrigins(' http://a.test/ , , https://b.test ')).toEqual([
      'http://a.test',
      'https://b.test',
    ]);
  });

  it('keeps same-origin paths and defaults to /home', () => {
    expect(safeRedirectTarget('/profile')).toBe('/profile');
    expect(safeRedirectTarget('')).toBe('/home');
    expect(safeRedirectTarget(null)).toBe('/home');
  });

  it('rejects every shape that would leave the site', () => {
    expect(safeRedirectTarget('//evil.com/x')).toBe('/home');
    expect(safeRedirectTarget('/\\evil.com/x')).toBe('/home');
    expect(safeRedirectTarget('/a://b')).toBe('/home');
    expect(safeRedirectTarget('javascript:alert(1)')).toBe('/home');
    expect(safeRedirectTarget('https://evil.com')).toBe('/home');
  });

  it('accepts a panel URL only on an exact allowlisted origin', () => {
    expect(safeRedirectTarget('http://localhost:5173/wallets?tab=open')).toBe(
      'http://localhost:5173/wallets?tab=open'
    );
    expect(safeRedirectTarget('https://admin.azeebo.com')).toBe('https://admin.azeebo.com/');
    expect(safeRedirectTarget('https://admin.azeebo.com.evil.com/')).toBe('/home');
    expect(safeRedirectTarget('https://evil.com/?next=https://admin.azeebo.com/')).toBe('/home');
    expect(safeRedirectTarget('http://admin.azeebo.com@evil.com/')).toBe('/home');
    expect(safeRedirectTarget('http://localhost:5174/')).toBe('/home');
  });

  it('lets the caller branch on absolute vs router navigation', () => {
    expect(isAbsoluteTarget('https://admin.azeebo.com/')).toBe(true);
    expect(isAbsoluteTarget('/home')).toBe(false);
  });
});
