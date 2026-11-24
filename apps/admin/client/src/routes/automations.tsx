import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface InfraJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  runner: 'launchd (dev)' | 'k8s CronJob (prod)';
  managedBy: string;
  healthRoute: string;
  color: string;
}

/* ── Data: the real scheduled jobs, as they run today ─────────────────────────
 *
 * There is no scheduled-task CRUD API: jobs are owned by the infrastructure
 * layer (launchd on dev machines, k8s CronJobs in production) and cannot be
 * created, paused, or triggered from the UI. This page documents the real
 * jobs instead of rendering a fake interactive table. Sources: RUNBOOK.md
 * and the Ops Health page (live execution status).
 */

const INFRA_JOBS: InfraJob[] = [
  {
    id: 'prisma-freshness',
    name: 'Prisma Client Freshness Check',
    description:
      'Verifies the generated Prisma client matches the committed schema before any service boot. Fails fast on drift instead of producing runtime errors.',
    schedule: 'pre-commit + pre-deploy',
    runner: 'launchd (dev)',
    managedBy: 'package.json hooks',
    healthRoute: '/ops-health',
    color: 'var(--admin-purple)',
  },
  {
    id: 'db-drill',
    name: 'Database Backup Drill',
    description:
      'Runs pg_dump against each azeebo_* database and restores into a scratch DB to prove backups are usable, not merely present.',
    schedule: 'nightly 03:00',
    runner: 'launchd (dev)',
    managedBy: 'scripts/database/drill.sh',
    healthRoute: '/ops-health',
    color: 'var(--admin-blue)',
  },
  {
    id: 'schema-lock',
    name: 'Schema Lock Nightly',
    description:
      'Diffs every service Prisma schema against the DB catalog and raises when an unapplied drift is detected (see .github/workflows/schema-lock-nightly.yml).',
    schedule: 'nightly 04:00',
    runner: 'k8s CronJob (prod)',
    managedBy: 'GitHub Actions',
    healthRoute: '/ops-health',
    color: 'var(--admin-emerald)',
  },
  {
    id: 'session-cleanup',
    name: 'Auth Session Sweeper',
    description:
      'Deletes expired refresh-token sessions and stale rate-limit block keys from Redis; keeps the auth tables bounded.',
    schedule: 'hourly',
    runner: 'k8s CronJob (prod)',
    managedBy: 'auth-service deployment',
    healthRoute: '/service-health',
    color: 'var(--admin-amber)',
  },
  {
    id: 'media-ttl',
    name: 'Media TTL Sweeper',
    description:
      'Removes expired uncommitted uploads from object storage and reconciles blob metadata (media-service uploadTtlSweeper).',
    schedule: 'every 15 min',
    runner: 'k8s CronJob (prod)',
    managedBy: 'media-service deployment',
    healthRoute: '/service-health',
    color: 'var(--admin-red)',
  },
];

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function AutomationsPage() {
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--admin-text)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="cpu" size={28} color="var(--admin-orange)" />
            <span>Automations</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Scheduled jobs run at the infrastructure level — not creatable or triggerable from the
            UI
          </p>
        </div>
      </div>

      {/* Honest notice: why this page is read-only */}
      <div
        style={{
          padding: 20,
          marginBottom: 20,
          borderRadius: 12,
          border: '1px solid rgba(245,158,11,0.3)',
          background: 'rgba(245,158,11,0.1)',
          color: 'var(--admin-amber)',
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        <strong>Scheduled tasks are infrastructure-owned.</strong> There is no scheduled-task CRUD
        API: jobs are defined in launchd plists (dev) and k8s CronJobs (production), so they cannot
        be created, paused, or re-run from the console. Live execution status for the services these
        jobs touch is on the <strong>Ops Health</strong> and <strong>Service Health</strong> pages.
      </div>

      {/* Jobs reference grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 16,
        }}
      >
        {INFRA_JOBS.map((job) => (
          <div
            key={job.id}
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: `${job.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="cpu" size={20} color={job.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 15 }}>
                    {job.name}
                  </div>
                  <div style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                    {job.schedule}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  color: 'var(--admin-emerald)',
                }}
              >
                scheduled
              </div>
            </div>

            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, lineHeight: 1.6 }}>
              {job.description}
            </p>

            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--admin-card)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--admin-text-muted)',
              }}
            >
              <span>Runner: {job.runner}</span>
              <span>Owned by: {job.managedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
