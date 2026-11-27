/**
 * Opt-in smoke test for the all-in-one image: boots the REAL image with its
 * REAL entrypoint and asserts (a) every upstream in the gateway's routing
 * table answers a health endpoint, and (b) the table the running gateway
 * serves is the table the code declares.
 *
 * Why this exists on top of dockerized-e2e's inline steps: the workflow probes
 * a hardcoded list of 23 health URLs and a GET-route sweep. Neither catches a
 * service the gateway registers but nothing ever probes, nor a registry entry
 * that drifted between source and the image actually built. This test derives
 * every upstream from the running gateway's own `/api/routes` response, so a
 * newly registered service is covered the moment it appears in SERVICE_CONFIGS.
 *
 * Opt-in, because it needs a Docker daemon and a built image:
 *
 *   ALL_IN_ONE_E2E=1 ALL_IN_ONE_IMAGE=azeebo-all-in-one:smoke \
 *     node --test scripts/__tests__/all-in-one-smoke.test.mjs
 *   # or: pnpm test:all-in-one-e2e
 *
 * Env:
 *   ALL_IN_ONE_E2E        "1" enables the test (otherwise it skips instantly)
 *   ALL_IN_ONE_IMAGE      image ref (default azeebo-all-in-one:smoke)
 *   ALL_IN_ONE_BUILD      "1" builds Dockerfile.all-in-one when the image is
 *                         missing (slow: all services + 4 Next apps)
 *   ALL_IN_ONE_BOOT_MS    health-wait budget (default 900000 = 15 min; the
 *                         image's own start_period is 300s)
 *   ALL_IN_ONE_KEEP       "1" leaves the container running for inspection
 *
 * Skips cleanly (exit 0) when: not opted in, the daemon is unreachable, the
 * image is absent and ALL_IN_ONE_BUILD is not set, the image has no curl (the
 * image's own HEALTHCHECK depends on it), or no free loopback ports.
 * Only its own aio-smoke-* container is created or removed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATEWAY_PROXY_FILE, parseServiceConfigs } from '../lib/gateway-backend-contracts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

const OPT_IN = process.env.ALL_IN_ONE_E2E === '1';
const IMAGE = process.env.ALL_IN_ONE_IMAGE || 'azeebo-all-in-one:smoke';
const SHOULD_BUILD = process.env.ALL_IN_ONE_BUILD === '1';
const BOOT_MS = Number(process.env.ALL_IN_ONE_BOOT_MS || 900_000);
const KEEP = process.env.ALL_IN_ONE_KEEP === '1';
const PROBE_TIMEOUT_MS = 10_000;

// Published container ports → the same five the CI smoke maps. The upstream
// ports (3000-3028) are deliberately NOT published: upstream health is probed
// from inside the container, so the test does not need 30 host port mappings.
const FRONT_DOOR = 80; // nginx: /health and /api/* → gateway
const GATEWAY_PORT = 3013;
const FRONTENDS = [4000, 4014, 4016];

// CI-parity boot env. The JWT secrets must be ≥64 chars (auth-service exits on
// shorter ones) and every service's DB password defaults to POSTGRES_PASSWORD.
const SMOKE_ENV = {
  POSTGRES_USER: 'azeebo',
  POSTGRES_PASSWORD: 'smoke_postgres_pw',
  POSTGRES_DB: 'azeebo_dev',
  REDIS_PASSWORD: 'smoke_redis_pw',
  JWT_ACCESS_SECRET: 'smoke_jwt_access_secret_0123456789abcdef0123456789abcdef0123456789abcdef',
  JWT_REFRESH_SECRET: 'smoke_jwt_refresh_secret_0123456789abcdef0123456789abcdef0123456789abcdef',
  INTERNAL_API_KEY: 'smoke_internal_api_key_0123456789abcdef',
  GATEWAY_SECRET: 'smoke_gateway_secret_0123456789abcdef',
  WEBHOOK_SECRET: 'smoke_webhook_secret',
  ALLOWED_ORIGINS: 'http://localhost:80,http://localhost:3013',
};

// ── helpers ────────────────────────────────────────────────────────────────

function docker(args, options = {}) {
  const res = spawnSync('docker', args, { encoding: 'utf8', ...options });
  return {
    status: res.status,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
  };
}

const firstLine = (text) => (text || '').split('\n').find(Boolean) || '(no output)';

/** A loopback port the OS says is free right now. */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/** Polls a URL until it answers (any status) or the deadline passes. */
async function waitForHttp(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return false;
}

async function httpStatus(url, headers = {}) {
  try {
    const res = await fetch(url, { headers });
    return { status: res.status, body: await res.text() };
  } catch {
    return { status: 0, body: '' };
  }
}

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

/** HS256 admin token — what /api/routes (AdminGuard) accepts. */
function mintAdminToken(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    iss: 'azeebo-auth',
    aud: 'azeebo-api',
    iat: now,
    exp: now + 3600,
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'smoke@azeebo.local',
    role: 'admin',
  });
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

/**
 * One entry per distinct upstream in the gateway's routing table. Several
 * registry prefixes share an upstream (content serves /content, /reviews,
 * /sharing, …), so probing per registry entry would re-probe the same process
 * and fail on sub-prefix paths that have no health route.
 */
export function healthTargetsFromRoutes(routes) {
  const byUpstream = new Map();
  for (const route of [...routes].sort((a, b) => a.path.localeCompare(b.path))) {
    if (!route.targetUrl) continue;
    const existing = byUpstream.get(route.targetUrl);
    if (existing) {
      existing.prefixes.push(route.path);
      continue;
    }
    byUpstream.set(route.targetUrl, { targetUrl: route.targetUrl, prefixes: [route.path] });
  }
  // Sorted by upstream so failures report in a stable order across runs.
  return [...byUpstream.values()].sort((a, b) => a.targetUrl.localeCompare(b.targetUrl));
}

/** Parse an HTTP code + body from a curl `-w '\n%{http_code}'` run. */
export function parseCurlOutput(stdout) {
  const lines = (stdout || '').split('\n');
  const code = Number(lines.pop()?.trim() || 0) || 0;
  return { code, body: lines.join('\n').trim() };
}

/** Probes a URL from inside the container (where localhost:<port> is a service). */
function probeInside(container, url) {
  const res = docker([
    'exec',
    container,
    'curl',
    '-sS',
    '--max-time',
    String(Math.round(PROBE_TIMEOUT_MS / 1000)),
    '-w',
    '\n%{http_code}',
    url,
  ]);
  const { code, body } = parseCurlOutput(res.stdout);
  return { code, body, stderr: res.stderr };
}

/** Health endpoints, in the order check-gateway-upstreams.mjs probes them. */
const HEALTH_PATHS = ['/v1/health', '/health'];

function healthOf(container, targetUrl) {
  const attempts = [];
  for (const path of HEALTH_PATHS) {
    const res = probeInside(container, `${targetUrl}${path}`);
    attempts.push({ path, ...res });
    if (res.code === 200) return { ok: true, path, ...res };
  }
  return { ok: false, attempts };
}

// ── pure checks (run on every `node --test` invocation) ────────────────────

test('the declared routing table parses into one unique prefix per entry', () => {
  const configs = parseServiceConfigs(readFileSync(join(ROOT, GATEWAY_PROXY_FILE), 'utf8'));
  assert.ok(configs.length >= 40, `expected the full gateway registry, parsed ${configs.length}`);

  const paths = configs.map((c) => c.service);
  assert.equal(new Set(paths).size, paths.length, `duplicate registry prefixes: ${paths.join(', ')}`);
  for (const config of configs) {
    assert.match(config.service, /^[a-z0-9_-]+$/, `bad service prefix: ${config.service}`);
    assert.ok(config.envKey, `${config.service} has no envKey`);
    assert.equal(config.defaultVersion, '1', `${config.service} defaultVersion drifted from 1`);
  }
});

test('health targets collapse registry prefixes onto distinct upstreams', () => {
  const routes = [
    { path: '/content', targetUrl: 'http://localhost:3004' },
    { path: '/reviews', targetUrl: 'http://localhost:3004' },
    { path: '/auth', targetUrl: 'http://localhost:3000' },
    { path: '/users', targetUrl: 'http://localhost:3001' },
  ];
  const targets = healthTargetsFromRoutes(routes);
  assert.deepEqual(
    targets.map((t) => t.targetUrl),
    ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3004']
  );
  assert.deepEqual(targets.at(-1).prefixes, ['/content', '/reviews']);
});

test('curl output parsing keeps the body and the trailing status code', () => {
  assert.deepEqual(parseCurlOutput('{"status":"ok"}\n200'), { code: 200, body: '{"status":"ok"}' });
  assert.deepEqual(parseCurlOutput('\n503'), { code: 503, body: '' });
  assert.deepEqual(parseCurlOutput(''), { code: 0, body: '' });
});

// ── the real thing (opt-in) ────────────────────────────────────────────────

test(
  'all-in-one image: every upstream health + the gateway routing table',
  { timeout: SHOULD_BUILD ? 5_400_000 : 1_800_000 },
  async (t) => {
    if (!OPT_IN) {
      t.skip('opt-in: set ALL_IN_ONE_E2E=1 (or run pnpm test:all-in-one-e2e) to boot a real image');
      return;
    }

    const daemon = docker(['info', '--format', '{{.ServerVersion}}']);
    if (daemon.status !== 0) {
      t.skip(`docker daemon unavailable: ${firstLine(daemon.stderr)}`);
      return;
    }

    let imagePresent = docker(['image', 'inspect', IMAGE]).status === 0;
    if (!imagePresent && SHOULD_BUILD) {
      const built = docker(
        [
          'build',
          '-f',
          'Dockerfile.all-in-one',
          '-t',
          IMAGE,
          '--build-arg',
          'NEXT_PUBLIC_API_URL=http://localhost:3013',
          '--build-arg',
          `CACHEBUST=${process.env.GITHUB_SHA || 'local'}`,
          '.',
        ],
        { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }
      );
      if (built.status !== 0) {
        t.skip(`image build failed: ${firstLine(built.stderr)}`);
        return;
      }
      imagePresent = true;
    }
    if (!imagePresent) {
      t.skip(
        `image ${IMAGE} is not built — build it (ALL_IN_ONE_BUILD=1) or point ALL_IN_ONE_IMAGE at a built/tagged image`
      );
      return;
    }

    // The image's HEALTHCHECK curls the gateway; without curl neither the image
    // nor this test can probe anything.
    const curl = docker(['run', '--rm', '--entrypoint', 'sh', IMAGE, '-c', 'command -v curl']);
    if (curl.status !== 0) {
      t.skip(`image ${IMAGE} has no curl: ${firstLine(curl.stderr) || 'command not found'}`);
      return;
    }

    let portMap;
    try {
      const wanted = [FRONT_DOOR, GATEWAY_PORT, ...FRONTENDS];
      const hostPorts = [];
      for (let i = 0; i < wanted.length; i++) hostPorts.push(await freePort());
      portMap = Object.fromEntries(wanted.map((container, i) => [container, hostPorts[i]]));
    } catch (err) {
      t.skip(`no free loopback port: ${err.message}`);
      return;
    }

    const suffix = randomBytes(4).toString('hex');
    const container = `aio-smoke-${suffix}`;
    const base = `http://127.0.0.1:${portMap[GATEWAY_PORT]}`;
    const frontDoor = `http://127.0.0.1:${portMap[FRONT_DOOR]}`;
    const cleanup = () => {
      if (!KEEP) docker(['rm', '-f', container]);
    };

    try {
      const started = docker([
        'run',
        '-d',
        '--name',
        container,
        '--shm-size=1g',
        ...Object.entries(portMap).flatMap(([c, h]) => ['-p', `${h}:${c}`]),
        ...Object.entries(SMOKE_ENV).flatMap(([k, v]) => ['-e', `${k}=${v}`]),
        IMAGE,
      ]);
      assert.equal(started.status, 0, `container failed to start: ${started.stderr}`);

      // Wait for the image's OWN healthcheck (nginx /health → gateway), not
      // just for the port to open: that is what deploy gates on.
      const deadline = Date.now() + BOOT_MS;
      let status = 'starting';
      while (Date.now() < deadline) {
        const inspected = docker([
          'inspect',
          '-f',
          '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}',
          container,
        ]);
        status = inspected.stdout || 'unknown';
        if (status === 'healthy') break;
        if (status === 'unhealthy') break;
        await new Promise((r) => setTimeout(r, 5000));
      }
      assert.ok(
        status !== 'none',
        'the image defines no HEALTHCHECK — the deploy gate would have nothing to wait on'
      );
      assert.equal(status, 'healthy', `container never reported healthy (last: ${status})`);

      // Front door and gateway must both answer before anything else means much.
      const nginxHealth = await httpStatus(`${frontDoor}/health`);
      assert.equal(nginxHealth.status, 200, `nginx /health → ${nginxHealth.status}`);
      const gatewayHealth = await httpStatus(`${base}/health`);
      assert.equal(gatewayHealth.status, 200, `gateway /health → ${gatewayHealth.status}`);

      // ── 1. Routing table: runtime (the image) == declared (the source) ────
      const declared = parseServiceConfigs(readFileSync(join(ROOT, GATEWAY_PROXY_FILE), 'utf8'));
      const declaredPaths = declared.map((c) => `/${c.service}`).sort();

      const token = mintAdminToken(SMOKE_ENV.JWT_ACCESS_SECRET);
      const routesRes = await httpStatus(`${base}/api/routes`, {
        authorization: `Bearer ${token}`,
      });
      assert.equal(
        routesRes.status,
        200,
        `GET /api/routes → ${routesRes.status} (admin token rejected or route not deployed)`
      );
      const payload = JSON.parse(routesRes.body);
      assert.equal(payload.success, true, `/api/routes envelope: ${routesRes.body.slice(0, 200)}`);
      const runtime = payload.data;
      assert.ok(Array.isArray(runtime) && runtime.length > 0, 'runtime routing table is empty');

      const runtimePaths = runtime.map((r) => r.path).sort();
      assert.deepEqual(
        runtimePaths,
        declaredPaths,
        'the image routes a different prefix set than the source declares — the built gateway is stale'
      );
      for (const route of runtime) {
        assert.ok(route.targetUrl, `${route.path} has no targetUrl in the runtime table`);
        assert.equal(route.defaultVersion, '1', `${route.path} defaultVersion drifted`);
        assert.ok(
          Array.isArray(route.supportedVersions) && route.supportedVersions.length > 0,
          `${route.path} advertises no supported versions`
        );
      }

      // The table is authoritative: an unregistered prefix is a gateway 404,
      // not a proxied request or a 502.
      const unknown = await httpStatus(`${base}/api/v1/__smoke_unknown__/health`);
      assert.equal(unknown.status, 404, `unregistered prefix → ${unknown.status}`);
      assert.match(
        unknown.body,
        /Service not found/,
        `unregistered prefix must be the gateway's own 404, got: ${unknown.body.slice(0, 200)}`
      );

      // ── 2. Every upstream in the table answers a health endpoint ──────────
      const targets = healthTargetsFromRoutes(runtime);
      const failures = [];
      for (const target of targets) {
        const health = healthOf(container, target.targetUrl);
        if (!health.ok) {
          const detail = health.attempts
            .map((a) => `${a.path}→${a.code || 'ERR'}${a.stderr ? ` (${firstLine(a.stderr)})` : ''}`)
            .join(', ');
          failures.push(`${target.targetUrl} [${target.prefixes.join(', ')}]: ${detail}`);
          continue;
        }
        if (health.body) {
          try {
            const body = JSON.parse(health.body);
            if (body.status) assert.match(body.status, /^(ok|up)$/i, `${target.targetUrl} status`);
          } catch {
            /* non-JSON health body is tolerated; the 200 is the contract */
          }
        }
      }
      assert.deepEqual(
        failures,
        [],
        `${failures.length}/${targets.length} upstreams are not healthy:\n  ${failures.join('\n  ')}`
      );

      // ── 3. Frontends boot (supervisord priority 60, so last) ──────────────
      for (const port of [FRONT_DOOR, ...FRONTENDS]) {
        const url = `http://127.0.0.1:${portMap[port]}/`;
        let answered = 0;
        const frontendDeadline = Date.now() + 120_000;
        while (Date.now() < frontendDeadline) {
          answered = (await httpStatus(url)).status;
          if (answered) break;
          await new Promise((r) => setTimeout(r, 2000));
        }
        assert.notEqual(answered, 0, `:${port} never answered over the published port`);
      }
    } catch (err) {
      const logs = docker(['logs', '--tail', '120', container]);
      throw new Error(`${err.message}\n\n--- ${container} log tail ---\n${logs.stdout}\n${logs.stderr}`);
    } finally {
      cleanup();
    }
  }
);
