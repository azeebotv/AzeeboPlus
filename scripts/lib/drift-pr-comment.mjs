/**
 * drift-pr-comment.mjs — renderer for the schema-lock PR comment bot.
 *
 * Pure module: turns the machine-readable gate reports
 * (.check-prisma-drift-out/report.json from check-prisma-migrations.mjs and
 * .check-prisma-deploy-diff-out/report.json from check-deployed-schema.mjs)
 * into a markdown comment body. The posting logic lives in
 * scripts/post-drift-pr-comment.mjs; unit tests cover the rendering.
 *
 * The comment is UPSERTED per PR (matched by the stable HTML-comment marker
 * below), so re-run pushes replace the previous table instead of spamming
 * the conversation.
 */

/** Stable marker used to find/update the bot's previous comment. */
export const COMMENT_MARKER = '<!-- azeebo:prisma-drift-report -->';

const ICONS = { CLEAN: '✅', DRIFTED: '🔴', BROKEN: '💥', ERROR: '💥' };

function esc(s) {
  return String(s ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function shortSha(sha) {
  return sha ? String(sha).slice(0, 7) : null;
}

function gateSection(title, subtitle, report) {
  if (!report) return null;
  const lines = [];
  lines.push(`#### ${title}`);
  lines.push('');
  lines.push(`_${esc(subtitle)} — ${report.clean}/${report.total} clean._`);
  lines.push('');
  lines.push('| Service | Status | Detail |');
  lines.push('|---|---|---|');
  for (const s of report.services) {
    const icon = ICONS[s.status] ?? '❔';
    lines.push(`| ${esc(s.service)} | ${icon} ${s.status} | ${esc(s.detail)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Nightly live-environment section: the per-environment schema-lock report
 * produced by check-live-schema-lock.mjs in the schema-lock-nightly.yml
 * workflow (fetched from that workflow's artifacts). Shows what the PR gates
 * cannot see — the REAL databases' state (live drift, broken ledgers) and
 * where each environment's migrations stand versus the folder.
 *
 * Report shape (schema-lock-nightly.yml stores one JSON per env as
 * `report.json` under artifact name `schema-lock-nightly-<env>`):
 *   { env, services: [{ service, status, detail, … }], summary: { … } }
 */
const LIVE_ICONS = {
  CLEAN: '✅',
  'DRIFT-ADDITIVE-ONLY': '🟢',
  'DRIFT-REVIEW': '🟠',
  'DRIFT-DESTRUCTIVE': '🔴',
  'LEDGER-MISMATCH': '🔴',
  'BLOCKED-LEDGER': '🔴',
  'NO-DB': '⚪',
  UNREACHABLE: '⚪',
  ERROR: '💥',
};

/** Statuses that mean the environment genuinely violates the schema lock. */
const LIVE_BLOCKING = ['DRIFT-DESTRUCTIVE', 'DRIFT-REVIEW', 'LEDGER-MISMATCH', 'BLOCKED-LEDGER', 'ERROR'];

export function liveSection(liveReports) {
  if (!liveReports || liveReports.length === 0) return null;
  const usable = liveReports.filter((r) => r && Array.isArray(r.services));
  if (usable.length === 0) return null;

  const lines = [];
  lines.push('#### Live environments (nightly schema-lock report)');
  lines.push('');
  for (const report of usable) {
    const affected = report.services.filter((s) => LIVE_BLOCKING.includes(s.status));
    const title = `Environment: **${report.env}**`;
    lines.push(affected.length === 0 ? `##### ✅ ${title} — schema lock holds` : `##### 🔴 ${title} — ${affected.length} service(s) violating the lock`);
    lines.push('');
    lines.push('| Service | Status | Detail |');
    lines.push('|---|---|---|');
    for (const s of report.services) {
      const icon = LIVE_ICONS[s.status] ?? '❔';
      lines.push(`| ${esc(s.service)} | ${icon} ${s.status} | ${esc(s.detail)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Whether the given reports should produce an alarm comment: any gate drift
 * or any live-environment status in LIVE_BLOCKING. Shared with the posting
 * script so its post/skip policy matches exactly what the header renders.
 */
export function commentIsAlarming({ migrationReport = null, deployReport = null, liveReports = [] } = {}) {
  const gatesBad =
    (!!migrationReport && (migrationReport.drifted > 0 || migrationReport.broken > 0)) ||
    (!!deployReport && (deployReport.drifted > 0 || deployReport.broken > 0 || (deployReport.errored ?? 0) > 0));
  const liveAffected = (liveReports ?? [])
    .filter((r) => r && Array.isArray(r.services))
    .flatMap((r) => r.services)
    .filter((s) => LIVE_BLOCKING.includes(s.status)).length;
  return gatesBad || liveAffected > 0;
}

/**
 * Render the full comment body. Accepts either/both gate reports and any
 * nightly live-environment reports; returns null when NOTHING is usable
 * (caller then posts nothing rather than noise).
 */
export function renderDriftComment({ migrationReport = null, deployReport = null, liveReports = [], runUrl = null, runLabel = null, sha = null } = {}) {
  const gateSections = [
    gateSection(
      'Migrations ↔ schema replay',
      '`check-prisma-migrations.mjs` — migrations replayed from empty must equal `schema.prisma`',
      migrationReport
    ),
    gateSection(
      'Deploy-then-diff schema lock',
      '`check-deployed-schema.mjs` — a fresh `prisma migrate deploy` must equal `schema.prisma`',
      deployReport
    ),
    liveSection(liveReports),
  ].filter(Boolean);
  const sections = gateSections;

  if (sections.length === 0) return null;

  const gateClean =
    (!migrationReport || (migrationReport.drifted === 0 && migrationReport.broken === 0)) &&
    (!deployReport || (deployReport.drifted === 0 && deployReport.broken === 0 && (deployReport.errored ?? 0) === 0));
  const liveAffected = (liveReports ?? [])
    .filter((r) => r && Array.isArray(r.services))
    .flatMap((r) => r.services)
    .filter((s) => LIVE_BLOCKING.includes(s.status)).length;
  const allClean = gateClean && liveAffected === 0;

  const lines = [];
  lines.push(COMMENT_MARKER);
  lines.push('');
  if (allClean) {
    lines.push('### ✅ Schema lock holds — all services clean');
  } else {
    const drifted =
      (migrationReport?.drifted ?? 0) +
      (migrationReport?.broken ?? 0) +
      (deployReport?.drifted ?? 0) +
      (deployReport?.broken ?? 0) +
      (deployReport?.errored ?? 0);
    const parts = [];
    if (drifted > 0) parts.push(`${drifted} service(s) at the gates`);
    if (liveAffected > 0) parts.push(`${liveAffected} in live environments`);
    lines.push(`### 🚨 Schema drift detected — ${parts.join(' · ') || 'attention needed'}`);
  }
  lines.push('');
  const ctx = [];
  if (runUrl) ctx.push(`[Run ${runLabel ?? 'log'}](${runUrl})`);
  if (sha) ctx.push(`commit \`${shortSha(sha)}\``);
  if (ctx.length) {
    lines.push(ctx.join(' · '));
    lines.push('');
  }
  lines.push(...sections.map((s, i) => (i === 0 ? s : `---\n\n${s}`)));
  lines.push('---');
  lines.push('');
  lines.push('_Fixes go through migrations — author the missing migration; never hand-ALTER a database and never `migrate resolve` an unapplied one. Per-service diff SQL is in the workflow artifacts._');
  lines.push('');
  lines.push('_This comment is updated in place on re-runs (no duplicates)._');
  return lines.join('\n');
}
