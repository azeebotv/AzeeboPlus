#!/usr/bin/env node
// ============================================================================
// check-dockerfile-drift.mjs — Dockerfile template gate
//
// deploy/Dockerfile.service is the canonical parameterized Dockerfile for
// every NestJS service. Each services/*/*/Dockerfile must be byte-identical
// to the template rendered with that service's args — editing a per-service
// file directly fails CI; edit the template and re-render instead.
//
// Also enforces repo-wide image hygiene: every FROM in services/*/Dockerfile,
// apps/*/Dockerfile and Dockerfile.all-in-one must be digest-pinned (no
// float tags, no :latest).
//
// Usage:
//   node scripts/check-dockerfile-drift.mjs            # gate (exit 1 on drift)
//   node scripts/check-dockerfile-drift.mjs --update   # re-render service Dockerfiles
//   node scripts/check-dockerfile-drift.mjs --list     # show args table
//
// CI wiring: security-scanning.yml (Dockerfile Lint job).
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_PATH = path.join(ROOT, 'deploy', 'Dockerfile.service');

/**
 * Render args per service. PRISMA and CLIENT_COPY semantics are documented
 * in deploy/Dockerfile.service. A service absent from this table fails the
 * gate — new services must be registered here.
 */
const SERVICES = {
  'services/core/auth-service': { port: 3000, prisma: 'script', clientCopy: 'src' },
  'services/core/content-service': { port: 3004, prisma: 'inline', clientCopy: 'client' },
  'services/core/knowledge-service': { port: 3011, prisma: 'inline', clientCopy: 'client' },
  'services/core/media-service': { port: 3019, prisma: 'inline', clientCopy: 'none' },
  'services/core/payment-service': { port: 3003, prisma: 'inline', clientCopy: 'src' },
  'services/core/search-service': { port: 3005, prisma: 'inline', clientCopy: 'src' },
  'services/core/user-service': { port: 3001, prisma: 'inline', clientCopy: 'src' },
  'services/core/wallet-service': { port: 3002, prisma: 'inline', clientCopy: 'src' },
  'services/engagement/engagement-service': { port: 3023, prisma: 'script', clientCopy: 'none' },
  'services/engagement/messaging-service': { port: 3024, prisma: 'inline', clientCopy: 'none' },
  'services/engagement/notification-service': { port: 3006, prisma: 'inline', clientCopy: 'client' },
  'services/engagement/referral-service': { port: 3025, prisma: 'inline', clientCopy: 'client' },
  'services/engagement/reward-service': { port: 3007, prisma: 'inline', clientCopy: 'client' },
  'services/engagement/subscription-service': { port: 3026, prisma: 'inline', clientCopy: 'client' },
  // api-gateway is intentionally NOT template-managed: it is a single-stage
  // image (its build must compile workspace dist in the final stage — see the
  // header of its Dockerfile). Only the repo-wide digest-pin check applies.
  'services/intelligence/analytics-service': { port: 3008, prisma: 'inline', clientCopy: 'client' },
  'services/intelligence/recommendation-service': { port: 3009, prisma: 'inline', clientCopy: 'client' },
  'services/operations/moderation-service': { port: 3022, prisma: 'inline', clientCopy: 'client' },
  'services/operations/queue-service': { port: 3015, prisma: 'inline', clientCopy: 'client' },
  'services/operations/support-service': { port: 3020, prisma: 'script', clientCopy: 'client' },
  'services/universes/comedy-service': { port: 3012, prisma: 'inline', clientCopy: 'client' },
  'services/universes/creator-service': { port: 3018, prisma: 'inline', clientCopy: 'client' },
  'services/universes/games-service': { port: 3014, prisma: 'inline', clientCopy: 'client' },
  'services/universes/lifestyle-service': { port: 3016, prisma: 'script', clientCopy: 'none' },
  'services/universes/live-event-service': { port: 3027, prisma: 'inline', clientCopy: 'client' },
  'services/universes/movie-service': { port: 3011, prisma: 'inline', clientCopy: 'client' },
  'services/universes/reality-service': { port: 3010, prisma: 'inline', clientCopy: 'client' },
  'services/universes/sports-service': { port: 3021, prisma: 'inline', clientCopy: 'client' },
  'services/universes/vertical-service': { port: 3017, prisma: 'inline', clientCopy: 'client' },
};

/** Keep word-cased for labels; API is an acronym. */
function labelFor(servicePath) {
  const dir = servicePath.split('/').pop();
  const name = dir
    .split('-')
    .map((w) => (w.toLowerCase() === 'api' ? 'API' : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
  return `Azeebo+ ${name}`;
}

/**
 * Render the template for one service. Supports single-level conditional
 * blocks (`# @if VAR == val` / `# @if VAR != val` … `# @endif`) — those lines
 * are Docker comments, so the template stays readable to hadolint/editors.
 */
export function renderTemplate(template, args) {
  const out = [];
  let skipping = false;
  for (const line of template.split('\n')) {
    const cond = line.match(/^# @if (\w+) (==|!=) (\w+)$/);
    if (cond) {
      const actual = args[cond[1]];
      skipping = cond[2] === '==' ? actual !== cond[3] : actual === cond[3];
      continue;
    }
    if (/^# @endif$/.test(line)) {
      skipping = false;
      continue;
    }
    if (!skipping) out.push(line);
  }
  return out
    .join('\n')
    .replaceAll('${SERVICE_PATH}', args.SERVICE_PATH)
    .replaceAll('${SERVICE_NAME}', args.SERVICE_NAME)
    .replaceAll('${PORT}', String(args.PORT));
}

function serviceArgs(servicePath) {
  const s = SERVICES[servicePath];
  return {
    SERVICE_PATH: servicePath,
    SERVICE_NAME: labelFor(servicePath),
    PORT: s.port,
    PRISMA: s.prisma,
    CLIENT_COPY: s.clientCopy,
  };
}

/** Repo-wide hygiene: every FROM must be digest-pinned. */
function checkDigestPins() {
  const files = [
    'Dockerfile.all-in-one',
    'services/gateway/api-gateway/Dockerfile',
    ...Object.keys(SERVICES).map((s) => path.join(s, 'Dockerfile')),
    'apps/web/Dockerfile',
    'apps/admin/Dockerfile',
    'apps/creator/Dockerfile',
  ];
  const problems = [];
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      problems.push(`${rel}: missing`);
      continue;
    }
    const lines = fs.readFileSync(abs, 'utf8').split('\n');
    lines.forEach((l, i) => {
      const m = l.match(/^FROM\s+(\S+)/);
      if (!m) return;
      if (!m[1].includes('@sha256:')) {
        problems.push(`${rel}:${i + 1}: FROM not digest-pinned: ${m[1]}`);
      }
      if (/:latest/.test(m[1])) {
        problems.push(`${rel}:${i + 1}: FROM uses :latest`);
      }
    });
  }
  return problems;
}

function main() {
  const argv = process.argv.slice(2);
  const update = argv.includes('--update');
  const list = argv.includes('--list');

  if (list) {
    for (const [svc, s] of Object.entries(SERVICES)) {
      console.log(`${svc.padEnd(46)} port=${s.port} prisma=${s.prisma} clientCopy=${s.clientCopy}`);
    }
    return;
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const failures = [];
  let renderedCount = 0;

  for (const [svc] of Object.entries(SERVICES)) {
    const dockerfilePath = path.join(ROOT, svc, 'Dockerfile');
    const expected = renderTemplate(template, serviceArgs(svc));
    if (update) {
      fs.mkdirSync(path.dirname(dockerfilePath), { recursive: true });
      fs.writeFileSync(dockerfilePath, expected);
      renderedCount++;
      continue;
    }
    if (!fs.existsSync(dockerfilePath)) {
      failures.push(`${svc}/Dockerfile: missing — re-register or render with --update`);
      continue;
    }
    const actual = fs.readFileSync(dockerfilePath, 'utf8');
    if (actual !== expected) {
      failures.push(`${svc}/Dockerfile drifted from deploy/Dockerfile.service — edit the template, then run: node scripts/check-dockerfile-drift.mjs --update`);
    }
  }

  for (const problem of checkDigestPins()) failures.push(problem);

  if (update) {
    console.log(`Re-rendered ${renderedCount} service Dockerfile(s) from deploy/Dockerfile.service.`);
    return;
  }

  if (failures.length > 0) {
    console.error(`🚫 ${failures.length} Dockerfile drift violation(s):`);
    for (const f of failures) console.error(`::error file=deploy/Dockerfile.service::${f}`);
    process.exit(1);
  }
  console.log(`✅ All ${Object.keys(SERVICES).length} service Dockerfiles match the template; all FROM lines digest-pinned.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
