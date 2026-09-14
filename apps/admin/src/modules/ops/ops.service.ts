import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { PrismaService } from '../../database/prisma.service';

export interface OpsCheck {
  ok: boolean;
  label: string;
  detail: string;
  latencyMs?: number;
  /** Minutes since the job's last pass (jobs only). */
  ageMinutes?: number;
  lastRunAt?: string;
}

export interface OpsAlert {
  at: string;
  level: 'WARN' | 'ERROR';
  source: string;
  message: string;
}

export interface OpsStatus {
  overall: 'healthy' | 'degraded' | 'down';
  db: OpsCheck;
  federation: OpsCheck;
  jobs: OpsCheck[];
  alerts: OpsAlert[];
  checkedAt: string;
}

/** Freshness/retention job logs and the shared alert-state file (dev paths). */
const FRESHNESS_LOG = process.env.FRESHNESS_LOG || '/tmp/azeebo-admin-freshness.log';
const RETENTION_LOG = process.env.RETENTION_LOG || '/tmp/azeebo-audit-retention.log';
const ALERT_STATE_FILE =
  process.env.ALERT_STATE_FILE ||
  `${process.env.TMPDIR || '/tmp'}/azeebo-admin-freshness.alert-state`;

/** Timestamp prefix of a job log line: `[2026-09-14 10:23:33] …` */
const LOG_LINE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s*(.*)$/;

/** A job is "stale" if its last pass is older than this (both schedules are ≤1h). */
const STALE_MINUTES = 120;

@Injectable()
export class OpsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStatus(): Promise<OpsStatus> {
    const [db, federation, freshness, retention, alerts] = await Promise.all([
      this.checkDb(),
      this.checkFederation(),
      this.checkJob('Freshness job', FRESHNESS_LOG, ['ok:', 'WARN:', 'ERROR:']),
      this.checkJob('Audit retention', RETENTION_LOG, ['ok:', 'deleted', 'ERROR:']),
      this.recentAlerts(),
    ]);

    const checks = [db, federation, freshness, retention];
    const overall = checks.some((c) => !c.ok && /ERROR|down|stale|broken/i.test(c.detail))
      ? 'down'
      : checks.every((c) => c.ok)
        ? 'healthy'
        : 'degraded';

    return {
      overall,
      db,
      federation,
      jobs: [freshness, retention],
      alerts,
      checkedAt: new Date().toISOString(),
    };
  }

  /** Admin DB reachable + query answers. */
  private async checkDb(): Promise<OpsCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        label: 'Admin database',
        detail: 'azeebo_admin answering',
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        ok: false,
        label: 'Admin database',
        detail: 'ERROR: azeebo_admin unreachable',
        latencyMs: Date.now() - start,
      };
    }
  }

  /** Federation intact: foreign tables exist AND the cross-DB join answers. */
  private async checkFederation(): Promise<OpsCheck> {
    const start = Date.now();
    try {
      const foreign =
        (await this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(*) AS n FROM pg_foreign_table ft
        JOIN pg_class c ON c.oid = ft.ftrelid
        WHERE c.relnamespace = 'public'::regnamespace`) ?? [];
      const nForeign = Number(foreign[0]?.n ?? 0);
      if (nForeign === 0) {
        return { ok: false, label: 'Federation', detail: 'WARN: no foreign tables (mirror mode?)' };
      }
      const join =
        (await this.prisma.$queryRaw<Array<{ n: bigint }>>`
        SELECT count(*) AS n FROM users u JOIN wallets w ON w."userId" = u.id`) ?? [];
      return {
        ok: true,
        label: 'Federation',
        detail: `${nForeign} foreign tables, cross-DB join answers (${Number(join[0]?.n ?? 0)} rows)`,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        ok: false,
        label: 'Federation',
        detail: 'ERROR: cross-DB join failing — run admin-data-freshness.sh',
      };
    }
  }

  /** Parse a job's log: last line + pass age. Not ok if last pass failed or is stale. */
  private async checkJob(
    label: string,
    logPath: string,
    progressMarkers: string[]
  ): Promise<OpsCheck> {
    let raw: string;
    try {
      raw = await readFile(logPath, 'utf8');
    } catch {
      return { ok: false, label, detail: `WARN: no log yet (${logPath}) — job never ran` };
    }
    const lines = raw.split('\n').filter((l) => LOG_LINE.test(l));
    if (lines.length === 0) {
      return { ok: false, label, detail: `WARN: log has no timestamped passes (${logPath})` };
    }
    const lastMatch = lines[lines.length - 1].match(LOG_LINE);
    if (!lastMatch) {
      return { ok: false, label, detail: `WARN: unparsable last log line` };
    }
    const [, ts, message] = lastMatch;
    const lastAt = new Date(ts.replace(' ', 'T'));
    const ageMinutes = Math.round((Date.now() - lastAt.getTime()) / 60000);
    const progressing = progressMarkers.some((m) => message.includes(m));
    const failed = /ERROR/.test(message);
    if (failed) {
      return {
        ok: false,
        label,
        detail: `ERROR: ${message}`,
        ageMinutes,
        lastRunAt: lastAt.toISOString(),
      };
    }
    if (!progressing) {
      return {
        ok: false,
        label,
        detail: `WARN: last pass did not complete (${message})`,
        ageMinutes,
        lastRunAt: lastAt.toISOString(),
      };
    }
    if (ageMinutes > STALE_MINUTES) {
      return {
        ok: false,
        label,
        detail: `WARN: last pass ${ageMinutes}m ago (stale — schedule stopped?)`,
        ageMinutes,
        lastRunAt: lastAt.toISOString(),
      };
    }
    return {
      ok: true,
      label,
      detail: message.replace(/^ok:\s*/, ''),
      ageMinutes,
      lastRunAt: lastAt.toISOString(),
    };
  }

  /**
   * Recent alerts: (1) the freshness job's current alert state file (DOWN /
   * still-DOWN, cleared on recovery) and (2) WARN/ERROR lines from both job
   * logs, newest first, capped at 10.
   */
  private async recentAlerts(): Promise<OpsAlert[]> {
    const alerts: OpsAlert[] = [];
    const logs = [
      { source: 'freshness', path: FRESHNESS_LOG },
      { source: 'retention', path: RETENTION_LOG },
    ];
    await Promise.all(
      logs.map(async ({ source, path }) => {
        try {
          const raw = await readFile(path, 'utf8');
          for (const line of raw.split('\n')) {
            const m = line.match(LOG_LINE);
            if (!m) continue;
            if (/WARN|ERROR/.test(m[2])) {
              alerts.push({
                at: new Date(m[1].replace(' ', 'T')).toISOString(),
                level: m[2].includes('ERROR') ? 'ERROR' : 'WARN',
                source,
                message: m[2],
              });
            }
          }
        } catch {
          /* no log yet — no alerts from this source */
        }
      })
    );
    try {
      const state = (await readFile(ALERT_STATE_FILE, 'utf8')).trim();
      if (state && state !== 'OK') {
        alerts.push({
          at: new Date().toISOString(),
          level: 'ERROR',
          source: 'freshness',
          message: `alert state: ${state}`,
        });
      }
    } catch {
      /* no state file — job is healthy */
    }
    return alerts.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  }
}
