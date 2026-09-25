/**
 * Unit tests for the gateway↔backend contract core
 * (scripts/lib/gateway-backend-contracts.mjs).
 *
 * Each test builds a fixture repo tree (temp dir via makeRoot): a fake
 * gateway proxy.controller.ts with SERVICE_CONFIGS blocks and fake backend
 * services with NestJS controllers, then runs the real diff. Ghosts (declared
 * but backend-missing), undeclared backend routes, verb drift, shared
 * upstreams, pathRewrite and version-neutral handlers are all covered.
 *
 * Run: `node --test scripts/__tests__/route-contracts-gateway-backend.test.mjs`
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseServiceConfigs,
  extractControllerRoutes,
  upstreamPathFor,
  diffGatewayBackend,
  ghostKey,
  undeclaredKey,
} from '../lib/gateway-backend-contracts.mjs';
import { makeRoot } from './fixtures.mjs';

/** A SERVICE_CONFIGS body the parser can consume (same shape as the real one). */
function gatewayFile(configs) {
  return `export const SERVICE_CONFIGS: ServiceRouteConfig[] = [\n${configs.join(',\n')}\n];\n`;
}

function serviceBlock({ service, envKey, strategy, rewrite, endpoints }) {
  return `  {
    path: '/${service}',
    envKey: '${envKey}',
    fallbackUrl: 'http://${service}:1234',
    supportedVersions: ['1'],
    defaultVersion: '1',${
      strategy ? `\n    pathStrategy: '${strategy}',` : ''
    }${
      rewrite
        ? `\n    pathRewrite: { ${Object.entries(rewrite)
            .map(([k, v]) => `'/${k}': '/${v}'`)
            .join(', ')} },`
        : ''
    }
    endpoints: [
${(endpoints ?? [])
  .map((e) => `      { method: '${e.method}', path: '${e.path}', description: 'x' },`)
  .join('\n')}
    ],
  }`;
}

/** Fixture backend controller file. */
function controller(prefix, handlers) {
  return `import { Controller, Get, Post, Put, Patch, Delete, All, Version } from '@nestjs/common';\n\n@Controller('${prefix}')\nexport class DemoController {\n${handlers
    .map((h) => `  ${h}`)
    .join('\n')}\n}\n`;
}

const putHandler = (path) => `@Put('${path}') health() { return null; }`;
const getHandler = (path) => `@Get('${path}') health() { return null; }`;
const postHandler = (path) => `@Post('${path}') health() { return null; }`;
const patchHandler = (path) => `@Patch('${path}') health() { return null; }`;

describe('parseServiceConfigs', () => {
  test('extracts service name, envKey, strategy, rewrite and endpoints', () => {
    const content = gatewayFile([
      serviceBlock({
        service: 'users',
        envKey: 'USER_SERVICE_URL',
        endpoints: [
          { method: 'GET', path: '/me' },
          { method: 'POST', path: '/me/history' },
        ],
      }),
      serviceBlock({
        service: 'universe',
        envKey: 'CONTENT_SERVICE_URL',
        rewrite: { universe: 'content' },
        endpoints: [{ method: 'GET', path: '/me/library' }],
      }),
      serviceBlock({
        service: 'interactions',
        envKey: 'USER_SERVICE_URL',
        strategy: 'no-prefix',
        endpoints: [{ method: 'GET', path: '/' }],
      }),
    ]);
    const configs = parseServiceConfigs(content);
    assert.equal(configs.length, 3);

    const [users, universe, interactions] = configs;
    assert.equal(users.service, 'users');
    assert.equal(users.envKey, 'USER_SERVICE_URL');
    assert.equal(users.pathStrategy, 'default');
    assert.deepEqual(users.endpoints.map((e) => `${e.method} ${e.path}`), [
      'GET /me',
      'POST /me/history',
    ]);

    assert.equal(universe.pathRewrite['/universe'], '/content');
    assert.equal(interactions.pathStrategy, 'no-prefix');
  });
});

describe('extractControllerRoutes', () => {
  test('controller prefix + handler paths join into full routes', () => {
    const routes = extractControllerRoutes(
      controller('auth', [postHandler('signup'), getHandler('me')])
    );
    assert.deepEqual(
      routes.map((r) => `${r.method} ${r.path}`),
      ['POST /auth/signup', 'GET /auth/me']
    );
  });

  test('empty controller and handler paths produce the root route', () => {
    const routes = extractControllerRoutes(
      `@Controller()\nexport class C {\n  @Get()\n  list() { return null; }\n}\n`
    );
    assert.deepEqual(routes.map((r) => `${r.method} ${r.path}`), ['GET /']);
  });

  test('@All() is kept as a single ALL pseudo-method', () => {
    const routes = extractControllerRoutes(
      `@Controller('proxy')\nexport class C {\n  @All('*')\n  handle() { return null; }\n}\n`
    );
    assert.deepEqual(routes.map((r) => `${r.method} ${r.path}`), ['ALL /proxy']);
  });

  test('@Version("") marks the route version-neutral', () => {
    const routes = extractControllerRoutes(
      `@Controller('health')\nexport class C {\n  @Version('')\n  @Get()\n  health() { return null; }\n}\n`
    );
    assert.equal(routes.length, 1);
    assert.equal(routes[0].versionNeutral, true);
  });

  test('multiple controllers in one file are all extracted', () => {
    const content = [
      `@Controller('a')`,
      `export class A {`,
      `  @Get('x') ax() { return null; }`,
      `}`,
      `@Controller('b')`,
      `export class B {`,
      `  @Post('y') by() { return null; }`,
      `}`,
    ].join('\n');
    const routes = extractControllerRoutes(content);
    assert.deepEqual(
      routes.map((r) => `${r.method} ${r.path}`).sort(),
      ['GET /a/x', 'POST /b/y']
    );
  });
});

describe('upstreamPathFor', () => {
  const base = { service: 'users', defaultVersion: '1', pathRewrite: {} };

  test('default strategy prefixes /v{version}/{service}', () => {
    assert.equal(upstreamPathFor({ ...base, pathStrategy: 'default' }, '/me', '1'), '/v1/users/me');
  });

  test('no-prefix strategy keeps only the service prefix', () => {
    assert.equal(
      upstreamPathFor({ ...base, pathStrategy: 'no-prefix' }, '/recent', '1'),
      '/users/recent'
    );
  });

  test('pathRewrite applies after strategy expansion', () => {
    const cfg = { service: 'universe', defaultVersion: '1', pathRewrite: { '/universe': '/content' } };
    assert.equal(upstreamPathFor(cfg, '/me/library', '1'), '/v1/content/me/library');
  });

  test('root endpoint paths collapse to the bare prefix', () => {
    assert.equal(upstreamPathFor({ ...base, pathStrategy: 'default' }, '/', '1'), '/v1/users');
  });
});

describe('diffGatewayBackend', () => {
  const BACKEND = 'services/core/auth-service/src/modules/auth/auth.controller.ts';

  function fixtureRoot(gatewayConfigs, backendFiles) {
    const files = {
      'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts': gatewayFile(
        gatewayConfigs
      ),
      ...Object.fromEntries(
        Object.entries(backendFiles).map(([rel, content]) => [
          `services/core/auth-service/${rel}`,
          content,
        ])
      ),
    };
    return makeRoot(files);
  }

  function run(root) {
    const content = readFileSync(
      `${root}/services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts`,
      'utf8'
    );
    return diffGatewayBackend(root, content);
  }

  test('matched declarations produce no violations', () => {
    const root = fixtureRoot(
      [
        serviceBlock({
          service: 'auth',
          envKey: 'AUTH_SERVICE_URL',
          endpoints: [{ method: 'POST', path: '/signup' }],
        }),
      ],
      { [BACKEND]: controller('auth', [postHandler('signup')]) }
    );
    const { results } = run(root);
    const auth = results.find((r) => r.service === 'auth');
    assert.deepEqual(auth.ghost, []);
    assert.deepEqual(auth.undeclared, []);
  });

  test('declared-but-missing endpoints are ghosts in upstream form', () => {
    const root = fixtureRoot(
      [
        serviceBlock({
          service: 'auth',
          envKey: 'AUTH_SERVICE_URL',
          endpoints: [{ method: 'POST', path: '/ghost-route' }],
        }),
      ],
      { [BACKEND]: controller('auth', [postHandler('signup')]) }
    );
    const { results } = run(root);
    const auth = results.find((r) => r.service === 'auth');
    assert.equal(auth.ghost.length, 1);
    assert.equal(auth.ghost[0].method, 'POST');
    assert.equal(auth.ghost[0].path, '/v1/auth/ghost-route');
  });

  test('verb drift: declared PATCH vs backend PUT is both ghost and undeclared', () => {
    const root = fixtureRoot(
      [
        serviceBlock({
          service: 'auth',
          envKey: 'AUTH_SERVICE_URL',
          endpoints: [{ method: 'PATCH', path: '/me/preferences' }],
        }),
      ],
      { [BACKEND]: controller('auth', [putHandler('me/preferences')]) }
    );
    const { results } = run(root);
    const auth = results.find((r) => r.service === 'auth');
    assert.equal(auth.ghost.length, 1);
    assert.equal(auth.ghost[0].method, 'PATCH');
    assert.equal(auth.undeclared.length, 1);
    assert.equal(auth.undeclared[0].method, 'PUT');
  });

  test('backend routes on a shared upstream are declared under any sibling service', () => {
    const sharedBackend = {
      'services/core/content-service/src/modules/public/public.controller.ts': controller(
        'public',
        [getHandler('universes')]
      ),
      'services/core/content-service/src/modules/content/content.controller.ts': controller(
        'content',
        [getHandler('home')]
      ),
    };
    const root = makeRoot({
      'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts': gatewayFile([
        serviceBlock({
          service: 'public',
          envKey: 'CONTENT_SERVICE_URL',
          endpoints: [{ method: 'GET', path: '/universes' }],
        }),
        serviceBlock({
          service: 'content',
          envKey: 'CONTENT_SERVICE_URL',
          endpoints: [{ method: 'GET', path: '/home' }],
        }),
      ]),
      ...sharedBackend,
    });
    const content = readFileSync(
      `${root}/services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts`,
      'utf8'
    );
    const { results } = diffGatewayBackend(root, content);
    const pub = results.find((r) => r.service === 'public');
    const con = results.find((r) => r.service === 'content');
    // Each service's declaration covers its own backend controller, and the
    // shared upstream means neither side flags the sibling's routes.
    assert.deepEqual(pub.ghost, []);
    assert.deepEqual(con.ghost, []);
    assert.deepEqual(pub.undeclared, []);
    assert.deepEqual(con.undeclared, []);
  });

  test('pathRewrite re-points a declared route onto the backend controller', () => {
    const root = makeRoot({
      'services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts': gatewayFile([
        serviceBlock({
          service: 'universe',
          envKey: 'CONTENT_SERVICE_URL',
          rewrite: { universe: 'content' },
          endpoints: [{ method: 'GET', path: '/me/library' }],
        }),
      ]),
      'services/core/content-service/src/modules/content/content.controller.ts': controller(
        'content',
        [getHandler('me/library')]
      ),
    });
    const content = readFileSync(
      `${root}/services/gateway/api-gateway/src/modules/proxy/proxy.controller.ts`,
      'utf8'
    );
    const { results } = diffGatewayBackend(root, content);
    assert.deepEqual(results.find((r) => r.service === 'universe').ghost, []);
  });

  test('an @All() upstream route satisfies a declared GET', () => {
    const root = fixtureRoot(
      [
        serviceBlock({
          service: 'auth',
          envKey: 'AUTH_SERVICE_URL',
          endpoints: [{ method: 'GET', path: '/anything' }],
        }),
      ],
      {
        [BACKEND]: `@Controller('auth')\nexport class C {\n  @All('anything')\n  handle() { return null; }\n}\n`,
      }
    );
    const { results } = run(root);
    assert.deepEqual(results.find((r) => r.service === 'auth').ghost, []);
  });

  test('version-neutral backend routes are compared bare (they serve no /vX)', () => {
    // A @Version('') handler serves the path WITHOUT a version prefix, so the
    // gateway (which always forwards /v1/...) can never reach it — it must
    // surface as undeclared (informational), never as a satisfied declaration.
    const root = fixtureRoot(
      [
        serviceBlock({
          service: 'auth',
          envKey: 'AUTH_SERVICE_URL',
          endpoints: [{ method: 'GET', path: '/health/ping' }],
        }),
      ],
      {
        'services/core/auth-service/src/modules/health/health.controller.ts': `@Controller('health')\nexport class C {\n  @Version('')\n  @Get('ping')\n  ping() { return null; }\n}\n`,
      }
    );
    const { results } = run(root);
    const auth = results.find((r) => r.service === 'auth');
    // The version-neutral /health/ping route does NOT satisfy the declared
    // /v1/auth/health/ping upstream path → ghost.
    assert.equal(auth.ghost.length, 1);
  });

  test('unknown envKeys are skipped, not failures', () => {
    const root = fixtureRoot(
      [serviceBlock({ service: 'ghost-svc', envKey: 'NOPE_SERVICE_URL', endpoints: [] })],
      {}
    );
    const { results } = run(root);
    assert.equal(results.find((r) => r.service === 'ghost-svc').skipped, 'unknown envKey');
  });

  test('baseline keys are stable and scoped', () => {
    assert.equal(ghostKey({ service: 'auth', method: 'POST', path: '/v1/auth/x' }), 'ghost:auth:POST /v1/auth/x');
    assert.equal(
      undeclaredKey({ method: 'GET', path: '/v1/auth/y' }, 'services/core/auth-service'),
      'undeclared:services/core/auth-service:GET /v1/auth/y'
    );
    assert.equal(undeclaredKey({ method: 'GET', path: '/v1/z' }), 'undeclared::GET /v1/z');
  });
});
