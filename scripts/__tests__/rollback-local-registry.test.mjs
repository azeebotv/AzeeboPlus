/**
 * Opt-in end-to-end test for scripts/rollback.sh against a real Docker daemon.
 *
 * The unit tests fake `docker`, which proves the shell logic but not that a
 * registry tag actually resolves, that the container really moves between
 * images, or that a failed health check puts the previous image back. This test
 * does that with a throwaway local registry and two tiny busybox-based "app"
 * images (one serves /health + /version, one 404s /health).
 *
 * Opt-in, because it needs a Docker daemon and registry access:
 *
 *   pnpm test:rollback-e2e
 *   # or: ROLLBACK_E2E=1 node --test scripts/__tests__/rollback-local-registry.test.mjs
 *
 * Without ROLLBACK_E2E=1 it skips immediately, so the default
 * `node --test scripts/__tests__/*.test.mjs` run stays Docker-free. It also
 * skips cleanly when the daemon is unreachable, the base images cannot be
 * pulled (no network, or a broken docker credential helper), or no free
 * loopback port can be bound. Nothing outside its own rb-* containers, tags and
 * temp dirs is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROLLBACK = join(HERE, '..', 'rollback.sh');
const OPT_IN = process.env.ROLLBACK_E2E === '1';

const BASE_IMAGE = 'busybox:1.36';
const REGISTRY_IMAGE = 'registry:2';

const firstLine = (text) => (text || '').split('\n').find(Boolean) || '(no output)';

function docker(args, options = {}) {
  const res = spawnSync('docker', args, { encoding: 'utf8', ...options });
  return {
    status: res.status,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
  };
}

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

async function httpStatus(url) {
  try {
    const res = await fetch(url);
    return res.status;
  } catch {
    return 0;
  }
}

function rollback(args, env) {
  return spawnSync('bash', [ROLLBACK, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test(
  'rollback.sh moves the deployed container between real registry tags',
  { timeout: 300_000 },
  async (t) => {
    if (!OPT_IN) {
      t.skip('opt-in: set ROLLBACK_E2E=1 (or run pnpm test:rollback-e2e) to use a real Docker daemon');
      return;
    }

    const daemon = docker(['info', '--format', '{{.ServerVersion}}']);
    if (daemon.status !== 0) {
      t.skip(`docker daemon unavailable: ${firstLine(daemon.stderr)}`);
      return;
    }
    for (const image of [BASE_IMAGE, REGISTRY_IMAGE]) {
      const pulled = docker(['pull', '-q', image]);
      if (pulled.status !== 0) {
        t.skip(`cannot pull ${image} (registry access unavailable): ${firstLine(pulled.stderr)}`);
        return;
      }
    }

    let registryPort;
    let appPort;
    try {
      registryPort = await freePort();
      appPort = await freePort();
    } catch (err) {
      t.skip(`no free loopback port: ${err.message}`);
      return;
    }

    const suffix = randomBytes(4).toString('hex');
    const registryName = `rb-registry-${suffix}`;
    const container = `rb-azeebo-${suffix}`;
    const goodTag = `staging-${randomBytes(6).toString('hex')}`;
    const badTag = `staging-${randomBytes(6).toString('hex')}`;
    const missingTag = `staging-${randomBytes(6).toString('hex')}`;
    const repo = `127.0.0.1:${registryPort}/azeebotv/azeebo-all-in-one`;
    const goodLocal = `rb-good-${suffix}:test`;
    const badLocal = `rb-bad-${suffix}:test`;
    const work = mkdtempSync(join(tmpdir(), 'rollback-e2e-'));
    const envFile = join(work, '.env.test');
    const cleanup = () => {
      docker(['rm', '-f', container]);
      docker(['rm', '-f', registryName]);
      for (const ref of [goodLocal, badLocal, `${repo}:${goodTag}`, `${repo}:${badTag}`]) {
        docker(['rmi', '-f', ref]);
      }
      rmSync(work, { recursive: true, force: true });
    };

    try {
      const registry = docker(['run', '-d', '--name', registryName, '-p', `${registryPort}:5000`, REGISTRY_IMAGE]);
      assert.equal(registry.status, 0, `registry failed to start: ${registry.stderr}`);
      assert.ok(
        await waitForHttp(`http://127.0.0.1:${registryPort}/v2/`),
        'local registry never became reachable'
      );

      // A "good" release serves /health and reports its commit; a "broken" one
      // 404s /health, which is exactly what the rollback health check watches.
      const goodDir = join(work, 'good');
      const badDir = join(work, 'bad');
      mkdirSync(goodDir, { recursive: true });
      mkdirSync(badDir, { recursive: true });
      writeFileSync(
        join(goodDir, 'Dockerfile'),
        [
          `FROM ${BASE_IMAGE}`,
          'ARG SHA',
          'RUN mkdir -p /www \\',
          ' && printf "ok\\n" > /www/health \\',
          ' && printf \'{"commitSha":"%s"}\' "$SHA" > /www/version',
          `EXPOSE ${appPort}`,
          `CMD ["httpd","-f","-p","${appPort}","-h","/www"]`,
          '',
        ].join('\n')
      );
      writeFileSync(
        join(badDir, 'Dockerfile'),
        [
          `FROM ${BASE_IMAGE}`,
          'RUN mkdir -p /www && printf "nope\\n" > /www/index.html',
          `EXPOSE ${appPort}`,
          `CMD ["httpd","-f","-p","${appPort}","-h","/www"]`,
          '',
        ].join('\n')
      );

      const goodSha = goodTag.slice('staging-'.length);
      const built = [
        docker(['build', '-q', '--build-arg', `SHA=${goodSha}`, '-t', goodLocal, goodDir]),
        docker(['build', '-q', '-t', badLocal, badDir]),
      ];
      for (const step of built) assert.equal(step.status, 0, step.stderr);

      for (const [local, tag] of [
        [goodLocal, goodTag],
        [badLocal, badTag],
      ]) {
        const tagged = docker(['tag', local, `${repo}:${tag}`]);
        assert.equal(tagged.status, 0, tagged.stderr);
        const pushed = docker(['push', '-q', `${repo}:${tag}`]);
        assert.equal(pushed.status, 0, `push ${tag} failed: ${pushed.stderr}`);
      }

      writeFileSync(envFile, 'NODE_ENV=production\n');
      const env = {
        IMAGE_REPOS: repo,
        CONTAINER_NAME: container,
        PORTS: String(appPort),
        HEALTH_CHECK_URL: `http://127.0.0.1:${appPort}/health`,
        ENV_FILE: envFile,
        ASSUME_YES: '1',
        HEALTH_CHECK_RETRIES: '20',
        HEALTH_CHECK_INTERVAL: '1',
        ROLLBACK_LOG: join(work, 'rollback.log'),
      };
      const imageOf = () => docker(['inspect', '--format', '{{.Config.Image}}', container]).stdout;
      const containerId = () => docker(['inspect', '--format', '{{.Id}}', container]).stdout;

      // The broken release is what is "currently deployed".
      const deployed = docker([
        'run',
        '-d',
        '--name',
        container,
        '-p',
        `${appPort}:${appPort}`,
        `${repo}:${badTag}`,
      ]);
      assert.equal(deployed.status, 0, deployed.stderr);
      assert.ok(await waitForHttp(`http://127.0.0.1:${appPort}/`), 'app container never came up');
      assert.equal(
        await httpStatus(`http://127.0.0.1:${appPort}/health`),
        404,
        'precondition: the deployed image must be unhealthy'
      );

      // 1. Healthy rollback: pull the tag, replace the container, verify SHA.
      const healthy = rollback([goodTag], env);
      assert.equal(healthy.status, 0, healthy.stdout + healthy.stderr);
      assert.match(healthy.stdout, new RegExp(`Resolved image: .*:${goodTag}`));
      assert.match(healthy.stdout, /VERIFIED: running commit /);
      assert.equal(imageOf(), `${repo}:${goodTag}`, 'container did not move to the target image');
      assert.equal(await httpStatus(`http://127.0.0.1:${appPort}/health`), 200);

      // 2. Broken target: fails health, previous image is restored, exit 1.
      const broken = rollback([badTag], env);
      assert.equal(broken.status, 1, broken.stdout + broken.stderr);
      assert.match(broken.stdout, /UNHEALTHY/);
      assert.match(broken.stdout, new RegExp(`Restoring previous image .*:${goodTag}`));
      assert.equal(await httpStatus(`http://127.0.0.1:${appPort}/health`), 200, 'service left down');
      assert.equal(imageOf(), `${repo}:${goodTag}`, 'previous image was not restored');

      // 3. Unpublished tag: fail before touching the running container.
      const before = containerId();
      const missing = rollback([missingTag], env);
      assert.equal(missing.status, 1, missing.stdout + missing.stderr);
      assert.match(missing.stdout, /could not pull/);
      assert.match(missing.stdout, /nothing was stopped/);
      assert.equal(containerId(), before, 'a failed pull must not replace the container');
    } finally {
      cleanup();
    }
  }
);
