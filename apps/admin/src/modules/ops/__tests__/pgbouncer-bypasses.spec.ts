import { parseDirectPgClients, classifyDirectPgClients, type DirectPgClient } from '../ops.service';

/**
 * Contract tests for the direct-Postgres bypass detector.
 *
 * The pgbouncer card flags repo-owned processes holding ESTABLISHED sockets
 * straight to :5432 (bypassing the pooler — connection limits and budgeting
 * do not apply to them). Parsing must count only CLIENT sockets (remote end
 * :5432); classification must allowlist pgbouncer itself, attribute repo
 * bypasses by cwd, and quarantine foreign clients as noise.
 */
describe('parseDirectPgClients', () => {
  it('counts only sockets whose REMOTE end is :5432 (client dials)', () => {
    const out = [
      'p100',
      'cnode',
      'n127.0.0.1:50000->127.0.0.1:5432', // client → pg: count
      'p200',
      'cpostgres',
      'n[::1]:5432->[::1]:50123', // pg server socket: local :5432, ignore
      'p300',
      'cpgbouncer',
      'n127.0.0.1:50001->127.0.0.1:5432', // pgbouncer's own dial: count (classifier allowlists)
      'p400',
      'cnode',
      'n127.0.0.1:51000->127.0.0.1:6379', // not postgres: ignore
    ].join('\n');
    const parsed = parseDirectPgClients(out);
    expect(parsed.map((p) => p.pid).sort()).toEqual([100, 300]);
    const p100 = parsed.find((p) => p.pid === 100);
    expect(p100?.command).toBe('node');
    expect(p100?.connections).toBe(1);
  });

  it('aggregates multiple connections per pid', () => {
    const out = [
      'p42',
      'cnode',
      'n127.0.0.1:50000->127.0.0.1:5432',
      'n127.0.0.1:50001->127.0.0.1:5432',
      'n127.0.0.1:50002->127.0.0.1:5432',
    ].join('\n');
    expect(parseDirectPgClients(out)).toEqual([
      { pid: 42, command: 'node', connections: 3, remoteHost: '127.0.0.1' },
    ]);
  });

  it('returns empty for no established :5432 client sockets', () => {
    const out = ['p1', 'cpostgres', 'n[::1]:5432->[::1]:55555'].join('\n');
    expect(parseDirectPgClients(out)).toEqual([]);
  });

  it('parses IPv6 remotes ([::1]:5432) — the common local dial shape', () => {
    const out = [
      'p50',
      'cnode',
      'n[::1]:51694->[::1]:5432',
      'p51',
      'cnode',
      'n[::1]:5432->[::1]:51694', // server side, local end is :5432
    ].join('\n');
    const parsed = parseDirectPgClients(out);
    expect(parsed).toEqual([{ pid: 50, command: 'node', connections: 1, remoteHost: '::1' }]);
  });

  it('keeps the remote host for IPv4 dials, brackets stripped for IPv6', () => {
    const out = [
      'p60',
      'cnode',
      'n127.0.0.1:52000->127.0.0.1:5432',
      'p61',
      'cnode',
      'n[fe80::1]:52001->[fe80::1]:5432', // link-local v6 with multiple colons
    ].join('\n');
    const parsed = parseDirectPgClients(out);
    expect(parsed.find((p) => p.pid === 60)?.remoteHost).toBe('127.0.0.1');
    expect(parsed.find((p) => p.pid === 61)?.remoteHost).toBe('fe80::1');
  });

  it('aggregates mixed-stack dials per pid, remoteHost reflects the last socket', () => {
    const out = [
      'p70',
      'cnode',
      'n127.0.0.1:53000->127.0.0.1:5432',
      'n[::1]:53001->[::1]:5432',
    ].join('\n');
    const parsed = parseDirectPgClients(out);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].connections).toBe(2);
    expect(parsed[0].remoteHost).toBe('::1');
  });

  it('ignores malformed pids and unterminated records', () => {
    const out = ['p', 'cnode', 'n127.0.0.1:1->127.0.0.1:5432'].join('\n');
    expect(parseDirectPgClients(out)).toEqual([]);
  });
});

describe('classifyDirectPgClients', () => {
  const ROOT = '/Users/deprof/www/azeebo+';

  it('flags repo-owned clients as bypasses, attributed by cwd', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      { pid: 10, command: 'node', connections: 2, cwd: `${ROOT}/services/core/auth-service` },
      { pid: 11, command: 'tsx', connections: 1, cwd: `${ROOT}/apps/creator` },
    ];
    const { bypasses, foreign } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([
      { workspace: 'services/core/auth-service', command: 'node', pid: 10, connections: 2 },
      { workspace: 'apps/creator', command: 'tsx', pid: 11, connections: 1 },
    ]);
    expect(foreign).toEqual([]);
  });

  it('allowlists pgbouncer itself even though it dials :5432 directly', () => {
    const clients = [{ pid: 5, command: 'pgbouncer', connections: 8, cwd: '/usr/local/bin' }];
    const { bypasses, foreign } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([]);
    expect(foreign).toEqual([]);
  });

  it('reports foreign clients as noise, attributed by their project path under /www/', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      { pid: 20, command: 'node', connections: 3, cwd: '/Users/deprof/www/YCN/services/feed' },
      { pid: 21, command: 'node', connections: 1, cwd: '/Users/deprof/www/YCN/services/feed' },
    ];
    const { bypasses, foreign } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([]);
    expect(foreign).toEqual([{ workspace: 'YCN/services/feed', connections: 4 }]);
  });

  it('classifies cwd-less clients by command name', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      { pid: 30, command: 'psql', connections: 1, cwd: null },
    ];
    const { bypasses, foreign } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([]);
    expect(foreign).toEqual([{ workspace: 'psql', connections: 1 }]);
  });

  it('treats a cwd exactly at the repo root as repo-owned', () => {
    const clients = [{ pid: 40, command: 'node', connections: 1, cwd: ROOT }];
    const { bypasses } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([
      { workspace: '(repo root)', command: 'node', pid: 40, connections: 1 },
    ]);
  });

  it('sorts foreign noise by connection count descending', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      { pid: 50, command: 'node', connections: 1, cwd: '/other/alpha' },
      { pid: 51, command: 'node', connections: 5, cwd: '/other/beta' },
    ];
    const { foreign } = classifyDirectPgClients(clients, ROOT);
    expect(foreign.map((f) => f.workspace)).toEqual(['other/beta', 'other/alpha']);
  });

  it('tracks per-workspace IPv6 loopback dials as context (foreign fleets bind ::1)', () => {
    // The 2026-09-22 morning fleet: another project's node processes held
    // ESTABLISHED sockets to [::1]:5432 exclusively.
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      {
        pid: 70,
        command: 'node',
        connections: 4,
        remoteHost: '::1',
        cwd: '/Users/deprof/www/YCN/services/feed',
      },
      {
        pid: 71,
        command: 'node',
        connections: 1,
        remoteHost: '127.0.0.1',
        cwd: '/Users/deprof/www/YCN/services/feed',
      },
    ];
    const { bypasses, foreign } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([]);
    expect(foreign).toEqual([{ workspace: 'YCN/services/feed', connections: 5, ipv6: 4 }]);
  });

  it('omits the ipv6 field when a workspace dials only over IPv4', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      { pid: 80, command: 'node', connections: 2, remoteHost: '127.0.0.1', cwd: '/other/alpha' },
    ];
    const { foreign } = classifyDirectPgClients(clients, ROOT);
    expect(foreign).toEqual([{ workspace: 'other/alpha', connections: 2 }]);
    expect('ipv6' in foreign[0]).toBe(false);
  });

  it('aggregates ipv6 across pids of the same workspace', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      { pid: 90, command: 'node', connections: 2, remoteHost: '::1', cwd: '/other/alpha' },
      { pid: 91, command: 'node', connections: 3, remoteHost: '::1', cwd: '/other/alpha' },
    ];
    const { foreign } = classifyDirectPgClients(clients, ROOT);
    expect(foreign).toEqual([{ workspace: 'other/alpha', connections: 5, ipv6: 5 }]);
  });

  it('a repo-owned bypass over ::1 is still a bypass (transport never downgrades the violation)', () => {
    const clients: Array<DirectPgClient & { cwd?: string | null }> = [
      {
        pid: 95,
        command: 'node',
        connections: 1,
        remoteHost: '::1',
        cwd: `${ROOT}/services/core/auth-service`,
      },
    ];
    const { bypasses } = classifyDirectPgClients(clients, ROOT);
    expect(bypasses).toEqual([
      { workspace: 'services/core/auth-service', command: 'node', pid: 95, connections: 1 },
    ]);
  });
});
