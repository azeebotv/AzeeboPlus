/**
 * Single source of truth for every `com.azeebo.*` SERVICE LaunchAgent.
 *
 * Why this exists: service plists were hand-written and drifted. Eleven of
 * them once carried inline `DATABASE_URL`s pointing at direct 5432, which
 * launchd injects with HIGHER precedence than `node --env-file` — so even
 * after the pgbouncer cutover those services silently bypassed the pooler.
 * The fix is structural: plists are GENERATED from this manifest, carry no
 * inline env at all, and every service loads its own `<dir>/.env` via
 * `node --env-file`. `gen-service-plists.mjs` enforces the contract and its
 * guard makes an inline `DATABASE_URL` (or any secret) impossible to emit.
 *
 * Contract per service:
 *   - `entry`    → repo-root-relative path to the entrypoint (absolute in argv)
 *   - `envFile` is implied: every DB-backed service gets
 *     `--env-file=<repo>/<dir>/.env` (nest kind passes it to `nest start`),
 *     and the generator verifies the .env exists and defines PORT.
 *   - `env` (optional) → inline launchd env, allowed ONLY for non-DB kinds
 *     (vite/scanner) and only for non-secret keys; the generator refuses
 *     forbidden keys (see FORBIDDEN_ENV_KEYS) on ANY entry.
 *   - jobs (freshness, retention, pool-audit, …) are NOT in this manifest —
 *     their own scripts' `install` modes remain the source of truth.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Node binary for plists. Original plists used the FlyEnv `env/node` shim
 * (stable across FlyEnv node-version switches); prefer it when present so
 * generated plists keep that behavior, falling back to this process's own
 * binary elsewhere.
 */
const FLYENV_NODE = path.join(os.homedir(), 'Library', 'FlyEnv', 'env', 'node', 'bin', 'node');
export const NODE_BIN = fs.existsSync(FLYENV_NODE) ? FLYENV_NODE : process.execPath;

/**
 * PATH injected into every service plist. Required for kinds that shell out
 * (nest start spawns `sh -c node …` — without it: exit 127 "node: command
 * not found" under launchd, whose default PATH has no node dir).
 */
export const DEFAULT_PATH = '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin';

/**
 * Keys that must NEVER appear in a generated plist's EnvironmentVariables.
 * launchd env overrides `--env-file`, so a secret here silently pins the
 * whole fleet to whatever value was pasted in — that is how the direct-5432
 * bypass happened. The generator treats any match as a hard error.
 */
export const FORBIDDEN_ENV_KEYS = [
  'DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'GATEWAY_SECRET',
  'INTERNAL_API_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_ACCESS_KEY_ID',
  'REDIS_PASSWORD',
  'DATABASE_PASSWORD',
];

/**
 * kind → how the entrypoint is launched:
 *   node    → node --env-file=<dir>/.env <main>            (compiled Nest dist)
 *   tsx     → node --env-file=<dir>/.env <tsx> src/main.ts (run from TS)
 *   nest    → node <nest-cli> start                         (dev mode; .env via cwd)
 *   vite    → node <vite> --config client/vite.config.ts    (vite loads .env itself)
 *   script  → node <script>                                 (plain node script)
 */
export const SERVICES = [
  // ---- apps (frontends + their backends) --------------------------------
  { label: 'admin-backend', dir: 'apps/admin', kind: 'node', entry: 'apps/admin/dist/main.js', wd: '.', port: 4016 },
  { label: 'creator-portal', dir: 'apps/creator', kind: 'tsx', entry: 'apps/creator/src/main.ts', wd: 'apps/creator', port: 4014 },
  { label: 'admin-vite', dir: 'apps/admin', kind: 'vite', entry: 'node_modules/vite/bin/vite.js', wd: 'apps/admin', port: 5173 },
  { label: 'creator-vite', dir: 'apps/creator', kind: 'vite', entry: 'apps/creator/node_modules/vite/bin/vite.js', wd: 'apps/creator', port: 5174 },

  // ---- gateway -----------------------------------------------------------
  { label: 'api-gateway', dir: 'services/gateway/api-gateway', kind: 'node', entry: 'services/gateway/api-gateway/dist/main.js', wd: 'services/gateway/api-gateway', port: 3013 },

  // ---- core services -----------------------------------------------------
  { label: 'user-service', dir: 'services/core/user-service', kind: 'node', entry: 'services/core/user-service/dist/main.js', wd: 'services/core/user-service', port: 3001 },
  { label: 'auth-service', dir: 'services/core/auth-service', kind: 'node', entry: 'services/core/auth-service/dist/main.js', wd: 'services/core/auth-service', port: 3000 },
  { label: 'wallet-service', dir: 'services/core/wallet-service', kind: 'tsx', entry: 'services/core/wallet-service/src/main.ts', wd: 'services/core/wallet-service', port: 3002 },
  { label: 'content', dir: 'services/core/content-service', kind: 'node', entry: 'services/core/content-service/dist/main.js', wd: '.', port: 3004 },
  { label: 'search', dir: 'services/core/search-service', kind: 'node', entry: 'services/core/search-service/dist/main.js', wd: '.', port: 3005 },
  { label: 'media', dir: 'services/core/media-service', kind: 'node', entry: 'services/core/media-service/dist/main.js', wd: '.', port: 3019 },
  { label: 'payment', dir: 'services/core/payment-service', kind: 'node', entry: 'services/core/payment-service/dist/main.js', wd: '.', port: 3003 },
  { label: 'knowledge', dir: 'services/core/knowledge-service', kind: 'node', entry: 'services/core/knowledge-service/dist/main.js', wd: '.', port: 3020 },

  // ---- engagement --------------------------------------------------------
  { label: 'notification-service', dir: 'services/engagement/notification-service', kind: 'node', entry: 'services/engagement/notification-service/dist/main.js', wd: 'services/engagement/notification-service', port: 3006 },
  { label: 'subscription', dir: 'services/engagement/subscription-service', kind: 'node', entry: 'services/engagement/subscription-service/dist/main.js', wd: '.', port: 3026 },
  { label: 'engagement', dir: 'services/engagement/engagement-service', kind: 'node', entry: 'services/engagement/engagement-service/dist/main.js', wd: '.', port: 3023 },
  { label: 'messaging', dir: 'services/engagement/messaging-service', kind: 'node', entry: 'services/engagement/messaging-service/dist/main.js', wd: '.', port: 3024 },
  { label: 'referral', dir: 'services/engagement/referral-service', kind: 'node', entry: 'services/engagement/referral-service/dist/main.js', wd: '.', port: 3025 },
  { label: 'reward', dir: 'services/engagement/reward-service', kind: 'node', entry: 'services/engagement/reward-service/dist/main.js', wd: '.', port: 3007 },

  // ---- universes ----------------------------------------------------------
  { label: 'creator-svc', dir: 'services/universes/creator-service', kind: 'node', entry: 'services/universes/creator-service/dist/main.js', wd: '.', port: 3018 },
  { label: 'vertical', dir: 'services/universes/vertical-service', kind: 'node', entry: 'services/universes/vertical-service/dist/main.js', wd: '.', port: 3017 },
  { label: 'live-event', dir: 'services/universes/live-event-service', kind: 'node', entry: 'services/universes/live-event-service/dist/main.js', wd: '.', port: 3027 },
  { label: 'reality', dir: 'services/universes/reality-service', kind: 'node', entry: 'services/universes/reality-service/dist/main.js', wd: '.', port: 3010 },
  { label: 'movie', dir: 'services/universes/movie-service', kind: 'node', entry: 'services/universes/movie-service/dist/main.js', wd: '.', port: 3011 },
  { label: 'comedy', dir: 'services/universes/comedy-service', kind: 'node', entry: 'services/universes/comedy-service/dist/main.js', wd: '.', port: 3012 },
  { label: 'games', dir: 'services/universes/games-service', kind: 'node', entry: 'services/universes/games-service/dist/main.js', wd: '.', port: 3014 },
  { label: 'sports', dir: 'services/universes/sports-service', kind: 'node', entry: 'services/universes/sports-service/dist/main.js', wd: '.', port: 3021 },
  { label: 'lifestyle-dev', dir: 'services/universes/lifestyle-service', kind: 'nest', entry: 'node_modules/@nestjs/cli/bin/nest.js', wd: 'services/universes/lifestyle-service', port: 3016, env: { PATH: DEFAULT_PATH } },

  // ---- intelligence -------------------------------------------------------
  { label: 'analytics', dir: 'services/intelligence/analytics-service', kind: 'node', entry: 'services/intelligence/analytics-service/dist/main.js', wd: '.', port: 3008 },
  { label: 'recommendation', dir: 'services/intelligence/recommendation-service', kind: 'node', entry: 'services/intelligence/recommendation-service/dist/main.js', wd: '.', port: 3009 },

  // ---- operations ----------------------------------------------------------
  { label: 'queue', dir: 'services/operations/queue-service', kind: 'node', entry: 'services/operations/queue-service/dist/main.js', wd: '.', port: 3015 },
  { label: 'moderation', dir: 'services/operations/moderation-service', kind: 'node', entry: 'services/operations/moderation-service/dist/main.js', wd: '.', port: 3022 },
  { label: 'support', dir: 'services/operations/support-service', kind: 'node', entry: 'services/operations/support-service/dist/main.js', wd: '.', port: 3028 },

  // ---- local infra ---------------------------------------------------------
  { label: 'dev-virus-scanner', dir: '.', kind: 'script', entry: 'scripts/dev-virus-scanner-stub.mjs', wd: '.', port: 8085, env: { PORT: '8085' } },
];

/** Which labels are DB-backed (their .env must exist for the guard to pass). */
export const DB_SERVICES = new Set([
  'admin-backend', 'creator-portal', 'api-gateway', 'user-service', 'auth-service',
  'wallet-service', 'content', 'search', 'media', 'notification-service',
  'subscription', 'creator-svc', 'vertical', 'live-event', 'lifestyle-dev', 'analytics',
  'payment', 'knowledge', 'engagement', 'messaging', 'referral', 'reward',
  'reality', 'movie', 'comedy', 'games', 'sports', 'recommendation',
  'queue', 'moderation', 'support',
]);

export function serviceByLabel(label) {
  return SERVICES.find((s) => s.label === label);
}

/** Build the full ProgramArguments array for a manifest entry. */
export function programArgumentsFor(svc) {
  const repoEntry = path.join(REPO_ROOT, svc.entry);
  switch (svc.kind) {
    case 'node':
    case 'vite':
    case 'script': {
      const args = [NODE_BIN];
      if (DB_SERVICES.has(svc.label)) args.push(`--env-file=${path.join(REPO_ROOT, svc.dir, '.env')}`);
      args.push(repoEntry);
      if (svc.kind === 'vite') args.push('--config', 'client/vite.config.ts');
      return args;
    }
    case 'tsx': {
      const tsxCli = path.join(REPO_ROOT, 'node_modules/.pnpm/tsx@4.23.0/node_modules/tsx/dist/cli.mjs');
      return [NODE_BIN, `--env-file=${path.join(REPO_ROOT, svc.dir, '.env')}`, tsxCli, repoEntry];
    }
    case 'nest':
      return [NODE_BIN, repoEntry, 'start', `--env-file=${path.join(REPO_ROOT, svc.dir, '.env')}`];
    default:
      throw new Error(`unknown kind ${svc.kind} for ${svc.label}`);
  }
}

/** Standard plist dict for a service (KeepAlive + logs + cwd, no inline env). */
export function plistDictFor(svc) {
  const dict = {
    Label: `com.azeebo.${svc.label}`,
    ProgramArguments: programArgumentsFor(svc),
    WorkingDirectory: path.resolve(REPO_ROOT, svc.wd),
    KeepAlive: true,
    RunAtLoad: true,
    StandardOutPath: `/tmp/azeebo-${svc.label}.log`,
    StandardErrorPath: `/tmp/azeebo-${svc.label}.log`,
  };
  if (svc.env !== undefined) dict.EnvironmentVariables = svc.env;
  return dict;
}
