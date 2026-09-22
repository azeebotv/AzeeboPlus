import {
  parseDatabaseUrlBudget,
  summarizeServiceBudgets,
  type PgbouncerServiceBudget,
} from '../ops.service';

/**
 * Contract tests for the per-service pool-budget discovery helpers behind
 * the pgbouncer card's "Per-service pool budgets" table.
 *
 * The card joins client-side budgets (workspace .env connection_limit) with
 * server-side saturation (SHOW POOLS). These helpers must be lenient (a
 * malformed URL surfaces as uncapped, never throws) and the rollup must
 * keep uncapped workspaces OUT of worstCaseTotal while still listing them —
 * an uncounted unbounded pool is the exact budget hole the card exists to
 * expose.
 */
describe('parseDatabaseUrlBudget', () => {
  it('extracts database and connection_limit from a pooler URL', () => {
    const r = parseDatabaseUrlBudget(
      'postgresql://azeebo:pw@127.0.0.1:6432/azeebo_admin?schema=public&connection_limit=6&pool_timeout=10000'
    );
    expect(r).toEqual({ database: 'azeebo_admin', connectionLimit: 6 });
  });

  it('returns null limit when connection_limit is absent', () => {
    const r = parseDatabaseUrlBudget('postgresql://azeebo:pw@127.0.0.1:6432/azeebo_auth');
    expect(r).toEqual({ database: 'azeebo_auth', connectionLimit: null });
  });

  it('handles URL-encoded credentials (pct-encoding must not corrupt the db name)', () => {
    const r = parseDatabaseUrlBudget(
      'postgresql://azeebo:p%40ss@127.0.0.1:6432/azeebo_wallet?connection_limit=3'
    );
    expect(r.database).toBe('azeebo_wallet');
    expect(r.connectionLimit).toBe(3);
  });

  it('treats non-positive or non-integer limits as uncapped', () => {
    expect(parseDatabaseUrlBudget('postgresql://a@h/db?connection_limit=0').connectionLimit).toBe(
      null
    );
    expect(
      parseDatabaseUrlBudget('postgresql://a@h/db?connection_limit=2.5').connectionLimit
    ).toBe(null);
    expect(
      parseDatabaseUrlBudget('postgresql://a@h/db?connection_limit=abc').connectionLimit
    ).toBe(null);
  });

  it('never throws on garbage input — flags unknown instead', () => {
    expect(parseDatabaseUrlBudget('not a url')).toEqual({ database: null, connectionLimit: null });
    expect(parseDatabaseUrlBudget('')).toEqual({ database: null, connectionLimit: null });
  });
});

describe('summarizeServiceBudgets', () => {
  const mk = (
    workspace: string,
    database: string | null,
    connectionLimit: number | null
  ): PgbouncerServiceBudget => ({ workspace, database, connectionLimit });

  it('rolls up per database with sorted groups', () => {
    const groups = summarizeServiceBudgets([
      mk('services/b/bs', 'azeebo_b', 3),
      mk('services/a/as', 'azeebo_a', 2),
      mk('apps/admin', 'azeebo_admin', 6),
      mk('services/a/as2', 'azeebo_a', 5),
    ]);
    // localeCompare collation: '_' sorts below letters, so azeebo_admin
    // lands before azeebo_b (matches how the card groups vs SHOW POOLS).
    expect(groups.map((g) => g.database)).toEqual(['azeebo_a', 'azeebo_admin', 'azeebo_b']);
    expect(groups[0].worstCaseTotal).toBe(7);
    expect(groups[0].services).toHaveLength(2);
  });

  it('excludes uncapped workspaces from worstCaseTotal but lists them', () => {
    const groups = summarizeServiceBudgets([
      mk('services/capped/cs', 'azeebo_x', 4),
      mk('services/wild/wc', 'azeebo_x', null),
    ]);
    const g = groups[0];
    expect(g.worstCaseTotal).toBe(4); // capped only
    expect(g.uncapped).toEqual(['services/wild/wc']);
  });

  it('groups unknown-database workspaces under (unknown)', () => {
    const groups = summarizeServiceBudgets([mk('services/broken/bk', null, null)]);
    expect(groups[0].database).toBe('(unknown)');
    expect(groups[0].uncapped).toEqual(['services/broken/bk']);
  });

  it('reports a fully-capped group with an empty uncapped list', () => {
    const groups = summarizeServiceBudgets([mk('apps/admin', 'azeebo_admin', 6)]);
    expect(groups[0]).toMatchObject({
      database: 'azeebo_admin',
      worstCaseTotal: 6,
      uncapped: [],
    });
  });
});
