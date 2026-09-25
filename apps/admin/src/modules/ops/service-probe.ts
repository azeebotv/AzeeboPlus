/**
 * Transport-resilient service health probing.
 *
 * Why: services bind different loopback families. admin-backend listens on
 * [::1]:4100 only (IPv6), so `curl 127.0.0.1:4100` is ECONNREFUSED while the
 * service is perfectly healthy; a Node fetch against `localhost` works only
 * when the OS resolver happens to try both families. The prober must never
 * fail a healthy service on transport alone: it tries explicit candidates in
 * order and records which transport answered, so the card can show an
 * IPv6-only listener instead of a phantom outage.
 *
 * Exported pure (probeCandidates, isRetryableTransportError) for tests; the
 * runner takes a fetch-like function so unit tests inject fakes.
 */

/** Loopback transports tried in order for `http://host:port`. */
export type LoopbackTransport = 'localhost' | 'ipv6' | 'ipv4';

/**
 * Candidate URLs for a loopback service, most-natural first:
 *   1. localhost   — the normal case; happy-path latency, dual-stack resolvers win
 *   2. [::1]       — IPv6-only listeners (admin-backend on [::1]:4100)
 *   3. 127.0.0.1   — IPv4-only listeners (some tooling binds v4 explicitly)
 * A service that answers any candidate is healthy; only all-three failure
 * means 'down'.
 */
export function probeCandidates(
  port: number,
  path: string
): Array<{ url: string; transport: LoopbackTransport }> {
  return [
    { url: `http://localhost:${port}${path}`, transport: 'localhost' },
    { url: `http://[::1]:${port}${path}`, transport: 'ipv6' },
    { url: `http://127.0.0.1:${port}${path}`, transport: 'ipv4' },
  ];
}

/**
 * Should the next candidate be tried for this error? Network-level failures
 * (connection refused / reset / unreachable, DNS, timeouts) are exactly the
 * wrong-transport symptom, so yes. An HTTP response — even a 404 or 500 —
 * proves the transport reached *a* listener, so never retry: the probe's job
 * is reachability, and the status code flows to the page as degraded.
 * Exported for tests.
 */
export function isRetryableTransportError(err: unknown): boolean {
  const cause = (err as { cause?: { code?: string } })?.cause?.code ?? '';
  if (cause) {
    return [
      'ECONNREFUSED',
      'ECONNRESET',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'EADDRNOTAVAIL',
      'EAI_AGAIN',
      'ENOTFOUND',
    ].includes(cause);
  }
  // Timeout aborts and other TypeError-ish fetch failures retry; anything
  // with no network cause is an unknown failure — retry (cheap, bounded).
  return true;
}

export interface ProbeOutcome {
  status: 'healthy' | 'degraded' | 'down';
  httpStatus?: number;
  latencyMs: number;
  /** Which candidate answered; present whenever any candidate did. */
  transport?: LoopbackTransport;
  /** 'down' only: last candidate's failure code (e.g. ECONNREFUSED). */
  errorDetail?: string;
}

/**
 * Probe one service across the loopback candidates. `fetchLike` is injected
 * (real callers pass global fetch bound with their timeout signal; tests
 * pass scripted fakes). Retries only on transport-class errors; an HTTP
 * response on any candidate is terminal.
 */
export async function probeAcrossTransports(
  port: number,
  path: string,
  fetchLike: (url: string) => Promise<Response>
): Promise<ProbeOutcome> {
  const start = Date.now();
  let lastError: unknown = null;

  for (const { url, transport } of probeCandidates(port, path)) {
    try {
      const res = await fetchLike(url);
      return {
        status: res.ok ? 'healthy' : 'degraded',
        httpStatus: res.status,
        latencyMs: Date.now() - start,
        transport,
      };
    } catch (err) {
      lastError = err;
      if (!isRetryableTransportError(err)) break;
    }
  }

  return {
    status: 'down',
    latencyMs: Date.now() - start,
    errorDetail:
      (lastError as { cause?: { code?: string } } | null)?.cause?.code ??
      (lastError instanceof Error ? lastError.name : 'unknown'),
  };
}

// ── transport-mismatch detection ──────────────────────────────────────────

/**
 * A service's answering transport CHANGED between two probes. A family flip
 * usually means someone re-bound the service (config change, restart with a
 * different bind address, a second process stealing the port on the other
 * family) — worth a loud banner, not a silent badge swap. Same-process
 * multi-family listeners flip legitimately (per-connection races between
 * ::1 and 127.0.0.1 on dual-stack binds), so the banner treats those as a
 * family change to NOTE, not an incident to page on.
 */
export interface TransportFlip {
  service: string;
  port: number;
  from: LoopbackTransport;
  to: LoopbackTransport;
  /** Epoch ms of the probe that observed the new transport. */
  detectedAt: number;
  /** True when the flip crosses families (::1 ↔ 127.0.0.1 or wildcard→explicit). */
  familyChanged: boolean;
}

/**
 * True when two probe results describe a transport change for the same
 * service. A previous probe with no transport (down) does NOT count: a
 * service going down and coming back on a new family is normal ops, and
 * down-state is already loudly surfaced. localhost vs ipv6/ipv4 counts:
 * localhost is a resolver outcome, not a bind family, so only family-crossing
 * flips set `familyChanged`; a localhost→ipv6 change is still flagged (the
 * explicit candidate answered, meaning IPv4 localhost stopped working).
 */
export function transportFlipped(
  prev: { transport?: LoopbackTransport } | undefined,
  next: { transport?: LoopbackTransport } | undefined
): boolean {
  if (!prev?.transport || !next?.transport) return false;
  return prev.transport !== next.transport;
}

/** True when the flip crosses loopback families (::1 vs 127.0.0.1). */
export function isFamilyChange(from: LoopbackTransport, to: LoopbackTransport): boolean {
  const family = (t: LoopbackTransport) => (t === 'ipv6' ? 6 : t === 'ipv4' ? 4 : 0);
  return family(from) !== family(to) && family(from) !== 0 && family(to) !== 0;
}

/**
 * Merge one fresh probe sweep into the page's per-service transport history.
 * Stateless by design: callers keep the previous sweep (react-query state,
 * a ref, or a ledger) and pass it back in — no hidden module state, so
 * probes can be replayed and unit-tested deterministically.
 *
 * `prev` maps service name → last sweep's transport. Returns the flips
 * observed in this sweep (in sweep order) and the new per-service map.
 */
export function mergeTransportHistory(
  prev: Record<string, LoopbackTransport>,
  sweep: Array<{ name: string; port: number; outcome: ProbeOutcome }>,
  now = Date.now()
): { flips: TransportFlip[]; next: Record<string, LoopbackTransport> } {
  const next: Record<string, LoopbackTransport> = { ...prev };
  const flips: TransportFlip[] = [];
  for (const { name, port, outcome } of sweep) {
    if (!outcome.transport) {
      // Down now: drop from the baseline so the return probe (possibly on a
      // new family) re-baselines instead of flipping against a stale value —
      // down→rebind is normal ops, and down-state is already surfaced.
      delete next[name];
      continue;
    }
    const before = prev[name];
    next[name] = outcome.transport;
    // A first sighting (no baseline) is never a flip — the `before` guard is
    // both the narrowing TS needs and the actual semantic.
    if (before && transportFlipped({ transport: before }, { transport: outcome.transport })) {
      flips.push({
        service: name,
        port,
        from: before,
        to: outcome.transport,
        detectedAt: now,
        familyChanged: isFamilyChange(before, outcome.transport),
      });
    }
  }
  return { flips, next };
}
