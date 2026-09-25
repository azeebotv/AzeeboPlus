import {
  probeCandidates,
  isRetryableTransportError,
  probeAcrossTransports,
  transportFlipped,
  isFamilyChange,
  mergeTransportHistory,
} from '../service-probe';

/**
 * Tests for the family-failover service probe.
 *
 * Why this exists: services bind different loopback families — admin-backend
 * listens on [::1]:4100 only, so a single-URL probe that dials
 * 127.0.0.1 (or a resolver that picks v4) reports a healthy service as
 * ECONNREFUSED. The probe tries localhost → [::1] → 127.0.0.1 and never
 * fails a service on transport alone.
 */

describe('probeCandidates', () => {
  it('orders candidates localhost → [::1] → 127.0.0.1 with the health path', () => {
    expect(probeCandidates(4100, '/v1/health')).toEqual([
      { url: 'http://localhost:4100/v1/health', transport: 'localhost' },
      { url: 'http://[::1]:4100/v1/health', transport: 'ipv6' },
      { url: 'http://127.0.0.1:4100/v1/health', transport: 'ipv4' },
    ]);
  });

  it('appends the path to every candidate without mangling brackets', () => {
    const urls = probeCandidates(3000, '/health').map((c) => c.url);
    expect(urls.some((u) => u === 'http://[::1]:3000/health')).toBe(true);
    expect(urls.every((u) => u.endsWith('/health'))).toBe(true);
  });
});

describe('isRetryableTransportError', () => {
  it.each([
    ['ECONNREFUSED', true],
    ['ECONNRESET', true],
    ['EHOSTUNREACH', true],
    ['ENETUNREACH', true],
    ['EADDRNOTAVAIL', true],
    ['EAI_AGAIN', true],
    ['ENOTFOUND', true],
  ])('retries network-level cause %s', (code, expected) => {
    expect(
      isRetryableTransportError(
        new TypeError('fetch failed', { cause: { code, errno: -61, syscall: 'connect' } })
      )
    ).toBe(expected);
  });

  it('retries unknown errors (no cause) — cheap and bounded', () => {
    expect(isRetryableTransportError(new Error('boom'))).toBe(true);
    expect(isRetryableTransportError(undefined)).toBe(true);
  });

  it('retries abort-style timeout errors (no cause code)', () => {
    const abortErr = new DOMException('This operation was aborted', 'TimeoutError');
    expect(isRetryableTransportError(abortErr)).toBe(true);
  });
});

describe('probeAcrossTransports', () => {
  const ok = (status: number, body = '{}') =>
    ({ ok: status >= 200 && status < 300, status, json: async () => JSON.parse(body) }) as Response;

  it('succeeds on the first candidate when it answers', async () => {
    const seen: string[] = [];
    const outcome = await probeAcrossTransports(4100, '/v1/health', async (url) => {
      seen.push(url);
      return ok(200);
    });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('localhost');
    expect(outcome).toMatchObject({ status: 'healthy', httpStatus: 200, transport: 'localhost' });
    expect(outcome.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('fails over to [::1] when localhost is refused — the admin-backend case', async () => {
    const seen: string[] = [];
    const outcome = await probeAcrossTransports(4100, '/v1/health', async (url) => {
      seen.push(url);
      if (url.includes('localhost')) {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
      }
      return ok(200);
    });
    expect(seen.map((u) => u.slice(7, 12))).toEqual(['local', '[::1]']);
    expect(outcome).toMatchObject({ status: 'healthy', httpStatus: 200, transport: 'ipv6' });
  });

  it('falls back to IPv4 when only 127.0.0.1 listens', async () => {
    const outcome = await probeAcrossTransports(3000, '/v1/health', async (url) => {
      if (!url.includes('127.0.0.1')) {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
      }
      return ok(200);
    });
    expect(outcome).toMatchObject({ status: 'healthy', transport: 'ipv4' });
  });

  it('never retries an HTTP response — a 404 is a degraded listener, not wrong transport', async () => {
    const seen: string[] = [];
    const outcome = await probeAcrossTransports(3013, '/v1/health', async (url) => {
      seen.push(url);
      return ok(404);
    });
    expect(seen).toHaveLength(1);
    expect(outcome).toMatchObject({ status: 'degraded', httpStatus: 404, transport: 'localhost' });
  });

  it('reports down with the last transport error code when all candidates are refused', async () => {
    const outcome = await probeAcrossTransports(3999, '/v1/health', async () => {
      throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
    });
    expect(outcome).toMatchObject({
      status: 'down',
      errorDetail: 'ECONNREFUSED',
      latencyMs: expect.any(Number),
    });
    expect(outcome.transport).toBeUndefined();
  });

  it('reports down with a fallback detail when the error has no code', async () => {
    const outcome = await probeAcrossTransports(3999, '/v1/health', async () => {
      throw new Error('socket hang up');
    });
    expect(outcome.status).toBe('down');
    expect(outcome.errorDetail).toBe('Error');
  });

  it('survives a mixed error sequence and still answers on the third candidate', async () => {
    const seen: string[] = [];
    const outcome = await probeAcrossTransports(3002, '/v1/health', async (url) => {
      seen.push(url);
      if (url.includes('localhost')) {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
      }
      if (url.includes('[::1]')) {
        throw new TypeError('fetch failed', { cause: { code: 'EADDRNOTAVAIL' } });
      }
      return ok(200);
    });
    expect(seen).toHaveLength(3);
    expect(outcome).toMatchObject({ status: 'healthy', transport: 'ipv4' });
  });
});

describe('transportFlipped / isFamilyChange', () => {
  it('flags any transport change between two answered probes', () => {
    expect(transportFlipped({ transport: 'ipv6' }, { transport: 'ipv4' })).toBe(true);
    expect(transportFlipped({ transport: 'localhost' }, { transport: 'ipv6' })).toBe(true);
  });

  it('does not flag an unchanged transport', () => {
    expect(transportFlipped({ transport: 'ipv6' }, { transport: 'ipv6' })).toBe(false);
    expect(transportFlipped({ transport: 'ipv4' }, { transport: 'ipv4' })).toBe(false);
  });

  it('does not flag down→up transitions — that is an outage, already surfaced', () => {
    expect(transportFlipped(undefined, { transport: 'ipv6' })).toBe(false);
    expect(transportFlipped({ transport: 'localhost' }, undefined)).toBe(false);
  });

  it('isFamilyChange: true only when crossing ::1 ↔ 127.0.0.1', () => {
    expect(isFamilyChange('ipv6', 'ipv4')).toBe(true);
    expect(isFamilyChange('ipv4', 'ipv6')).toBe(true);
  });

  it('isFamilyChange: false when either side is localhost (resolver outcome, not a bind family)', () => {
    expect(isFamilyChange('localhost', 'ipv6')).toBe(false);
    expect(isFamilyChange('ipv4', 'localhost')).toBe(false);
    expect(isFamilyChange('localhost', 'localhost')).toBe(false);
  });
});

describe('mergeTransportHistory', () => {
  const t = (transport?: string) =>
    ({ status: 'healthy', latencyMs: 3, transport }) as Parameters<
      typeof mergeTransportHistory
    >[1][number]['outcome'];

  it('emits a flip when a service changes transport and seeds the next baseline', () => {
    const before = { 'svc-a': 'ipv6' as const };
    const { flips, next } = mergeTransportHistory(before, [
      { name: 'svc-a', port: 3000, outcome: t('ipv4') },
      { name: 'svc-b', port: 3001, outcome: t('localhost') },
    ]);
    expect(flips).toHaveLength(1);
    expect(flips[0]).toMatchObject({
      service: 'svc-a',
      port: 3000,
      from: 'ipv6',
      to: 'ipv4',
      familyChanged: true,
    });
    expect(typeof flips[0].detectedAt).toBe('number');
    expect(next['svc-a']).toBe('ipv4');
    expect(next['svc-b']).toBe('localhost');
  });

  it('emits no flips on a steady-state sweep and still refreshes the baseline', () => {
    const before = { 'svc-a': 'localhost' as const };
    const { flips, next } = mergeTransportHistory(before, [
      { name: 'svc-a', port: 3000, outcome: t('localhost') },
    ]);
    expect(flips).toHaveLength(0);
    expect(next['svc-a']).toBe('localhost');
  });

  it('never flags a service that was down before (no prior transport) — coming back is normal', () => {
    const { flips } = mergeTransportHistory({}, [
      { name: 'svc-a', port: 3000, outcome: t('ipv6') },
    ]);
    expect(flips).toHaveLength(0);
  });

  it('drops services that are down now from the next baseline (re-baseline on return)', () => {
    const { next } = mergeTransportHistory({ 'svc-a': 'ipv6' as const }, [
      { name: 'svc-a', port: 3000, outcome: t(undefined) },
    ]);
    expect(next['svc-a']).toBeUndefined();
  });

  it('treats each sweep independently — the first sweep after start never reports flips', () => {
    const { flips } = mergeTransportHistory({}, [
      { name: 'svc-a', port: 3000, outcome: t('localhost') },
      { name: 'svc-b', port: 3001, outcome: t('ipv4') },
    ]);
    expect(flips).toHaveLength(0);
  });
});
