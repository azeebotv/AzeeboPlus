import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

export interface BootedTestApp {
  app: INestApplication;
  baseUrl: string;
}

export type TestAppConfigurator = (app: INestApplication) => void;

/**
 * Boots a Nest application once for supertest and returns the app plus a
 * `baseUrl` for URL-string requests.
 *
 * Why this exists: supertest 7 closes the HTTP server after EVERY request
 * when handed the server object (`request(app.getHttpServer())`), which races
 * keep-alive sockets and ephemeral port reuse and intermittently fails with
 * "socket hang up" (ECONNRESET). Binding the app once via `listen(0)` and
 * making requests against the returned `baseUrl` keeps the server alive for
 * the whole suite and makes requests deterministic. Always request with
 * `request(baseUrl)`, never `request(app.getHttpServer())`.
 *
 * The app is bound to 127.0.0.1 explicitly (not `listen(0)`'s default `::`):
 * a bare IPv6-wildcard bind can silently coexist with another process's
 * 127.0.0.1 listener on the same port, and the v4 socket then answers our
 * requests — so a dev server's response (e.g. 403) is served instead of the
 * test app's. Pinning 127.0.0.1 guarantees loopback traffic reaches us.
 *
 * Usage:
 *   let app: INestApplication;
 *   let baseUrl: string;
 *
 *   beforeAll(async () => {
 *     const moduleFixture = await Test.createTestingModule({
 *       controllers: [HealthController],
 *     }).compile();
 *     ({ app, baseUrl } = await bootTestApp(moduleFixture));
 *   });
 *
 *   afterAll(async () => {
 *     await app.close();
 *   });
 *
 *   it('GET /health', () => request(baseUrl).get('/health').expect(200));
 *
 * Pass an optional `configure` callback to set the app up before it boots
 * (global pipes/prefixes/versioning, middleware, etc.):
 *
 *   await bootTestApp(moduleFixture, (app) => {
 *     app.enableVersioning({
 *       type: VersioningType.URI,
 *       prefix: 'v',
 *       defaultVersion: '1',
 *     });
 *     app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
 *   });
 */
export async function bootTestApp(
  moduleFixture: TestingModule,
  configure?: TestAppConfigurator
): Promise<BootedTestApp> {
  const app = moduleFixture.createNestApplication();
  configure?.(app);
  await app.init();
  // Explicit IPv4-loopback bind — see the docblock above for why `listen(0)`
  // alone is not deterministic on hosts running other servers.
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') {
    throw new Error('bootTestApp: app is not listening on a TCP port');
  }
  return { app, baseUrl: `http://127.0.0.1:${address.port}` };
}
