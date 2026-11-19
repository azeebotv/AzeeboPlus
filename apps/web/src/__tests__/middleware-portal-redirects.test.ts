// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

/**
 * The standalone portals live at their own origin root: admin routes are
 * `/overview`, `/users`, … and creator routes are `/analytics`, `/earnings`, …
 * This app owns the `/admin` and `/creator` prefixes.
 *
 * Redirecting with the prefix intact lands on a path neither portal has a route
 * for, and React Router renders an empty document for an unmatched path — the
 * user sees a blank page. These tests pin the strip.
 */

function request(path: string): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:4000'));
}

function redirectTarget(path: string): string {
  const response = middleware(request(path));
  const location = response.headers.get('location');
  expect(location, `expected ${path} to redirect`).toBeTruthy();
  return location as string;
}

describe('admin portal redirects', () => {
  it('drops the /admin prefix so portal routes match', () => {
    expect(redirectTarget('/admin/capacity-ledger')).toBe('http://localhost:5173/capacity-ledger');
    expect(redirectTarget('/admin/dual-control')).toBe('http://localhost:5173/dual-control');
    expect(redirectTarget('/admin/talent-clearance')).toBe(
      'http://localhost:5173/talent-clearance'
    );
  });

  it('maps the bare /admin prefix to the portal index', () => {
    expect(redirectTarget('/admin')).toBe('http://localhost:5173/');
    expect(redirectTarget('/admin/')).toBe('http://localhost:5173/');
  });

  it('never forwards a /admin path the portal cannot route', () => {
    expect(redirectTarget('/admin/users')).not.toContain('/admin/');
  });
});

describe('creator portal redirects', () => {
  it('drops the /creator prefix so portal routes match', () => {
    expect(redirectTarget('/creator/analytics')).toBe('http://localhost:5174/analytics');
    expect(redirectTarget('/creator/earnings')).toBe('http://localhost:5174/earnings');
  });

  it('maps the bare /creator prefix to the portal index', () => {
    expect(redirectTarget('/creator')).toBe('http://localhost:5174/');
  });

  it('maps /creators/dashboard to the portal index (dashboard is the index route)', () => {
    expect(redirectTarget('/creators/dashboard')).toBe('http://localhost:5174/');
  });

  it('never forwards a /creator path the portal cannot route', () => {
    expect(redirectTarget('/creator/settings')).not.toContain('/creator/');
  });
});

describe('prefix stripping preserves the rest of the path', () => {
  it('keeps nested segments and query strings out of the prefix', () => {
    expect(redirectTarget('/creator/challenges/abc123')).toBe(
      'http://localhost:5174/challenges/abc123'
    );
    expect(redirectTarget('/admin/reports/builder')).toBe('http://localhost:5173/reports/builder');
  });
});
