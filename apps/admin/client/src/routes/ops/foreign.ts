import type { ForeignPersistence } from '@/lib/api/admin';

/**
 * Group foreign-persistence rows by attributed project for the card's grouped
 * table, with per-group aggregates for the section headers. `fp.rows` is
 * already sorted (span desc, named groups before path-self groups, workspace
 * name), so groups emerge in display order and rows keep their in-group
 * order. Missing `project` (pre-attribution backend) degrades to the
 * workspace path itself — one row per group, flat table, no crash.
 */
type ForeignRow = ForeignPersistence['rows'][number];

type ForeignGroupAggregates = {
  passes: number;
  peakConns: number;
  sustainedCount: number;
  anySustained: boolean;
};

export function groupForeignRowsByProject(rows: ForeignRow[]): Array<[string, ForeignGroupAggregates, ForeignRow[]]> {
  const groups = new Map<string, { aggregates: ForeignGroupAggregates; rows: ForeignRow[] }>();
  for (const row of rows) {
    const project = row.project ?? row.workspace;
    const g = groups.get(project);
    if (g) {
      g.aggregates.passes += row.passes;
      const peak = (row.connHistory ?? []).reduce<number>((m, v) => (v !== null && v > m ? v : m), g.aggregates.peakConns);
      g.aggregates.peakConns = peak;
      if (row.sustained) {
        g.aggregates.sustainedCount += 1;
        g.aggregates.anySustained = true;
      }
      g.rows.push(row);
    } else {
      groups.set(project, {
        aggregates: {
          passes: row.passes,
          peakConns: (row.connHistory ?? []).reduce<number>((m, v) => (v !== null && v > m ? v : m), 0),
          sustainedCount: row.sustained ? 1 : 0,
          anySustained: row.sustained,
        },
        rows: [row],
      });
    }
  }
  return [...groups.entries()].map(([project, { aggregates, rows: gRows }]) => [project, aggregates, gRows] as const);
}
