import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { UploadModule } from '../upload/upload.module';
import { S3Service } from '../upload/s3.service';
import { RedisService, CacheService } from '@azeebo/shared-services';
import { PrismaService } from '../database/prisma.service';
import { FileValidationService } from '../../common/services/file-validation.service';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor } from '@azeebo/logger';
import { FeatureFlagGuard, FeatureFlagModule, FeatureFlagService } from '@azeebo/feature-flags';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

/**
 * Integration: DELETE /media/:key idempotency against the real S3-compatible
 * blob store (rustfs on :9000, the same endpoint the running media-service
 * uses), driven over HTTP through the real controller + S3Service.
 *
 * Proves, with real S3 semantics:
 *  1. Delete an existing object → success, and a SECOND delete of the same
 *     key returns `alreadyGone: true` (the HeadObject 404 is absorbed).
 *  2. When the blob store is unreachable, the circuit breaker opens and the
 *     endpoint surfaces an honest 503 — never a false "deleted" success.
 *
 * Skips when no S3_ENDPOINT is reachable so `jest` stays green on machines
 * without the local blob store.
 */
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
const BUCKET = process.env.AWS_S3_BUCKET || 'azeebo-media';

const maybeIntegration =
  process.env.S3_ENDPOINT !== '' &&
  (process.env.S3_INTEGRATION === '1' || process.env.S3_INTEGRATION === 'true')
    ? describe
    : describe.skip;

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

class MockAdminGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

(maybeIntegration as jest.Describe)('DELETE /media/:key against real S3-compatible store', () => {
  let app: INestApplication;
  let baseUrl: string;
  let probeClient: S3Client;
  let endpointReachable = false;

  const ownerAuth = 'Bearer it-owner-token';

  /** Raw S3 probe client — independent of the service under test. */
  const objectExists = async (key: string): Promise<boolean> => {
    try {
      await probeClient.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-jwt-secret';

    // Reachability probe before bootstrapping the whole app.
    probeClient = new S3Client({
      region: 'us-east-1',
      endpoint: S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'rustfsadmin',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'rustfsadmin',
      },
    });
    try {
      await probeClient.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: 'integration-probe-nonexistent' })
      );
    } catch (err) {
      // A signed/transport error means the endpoint ANSWERED → reachable.
      // Connection-level failures (ECONNREFUSED, ENOTFOUND) mean skip.
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      endpointReachable = !/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed/i.test(msg);
      if (!endpointReachable) {
        probeClient.destroy();
        return;
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UploadModule,
        // Global FeatureFlagModule registration mirrors app.module; the stub
        // redis keeps the real (overridden below) service from connecting.
        FeatureFlagModule.register({ global: true, redis: { quit: jest.fn() } as never }),
      ],
    })
      .overrideProvider(RedisService)
      .useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn(), keys: jest.fn() })
      .overrideProvider(PrismaService)
      .useValue({
        transcodingJob: { findUnique: jest.fn(), update: jest.fn() },
        mediaUpload: { findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
      })
      .overrideProvider(CacheService)
      .useValue({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })
      .overrideProvider(FileValidationService)
      .useValue({ validateFile: jest.fn(), validatePresignedUpload: jest.fn() })
      .overrideProvider(FeatureFlagService)
      .useValue({ isEnabled: jest.fn().mockResolvedValue(true) })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .overrideGuard(FeatureFlagGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseWrapperInterceptor());
    // Same ServiceAuthGuard mock as the contract spec: header ⇒ req.user.
    app.use(
      (
        req: { headers: { authorization?: string }; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer ') &&
          !req.user
        ) {
          req.user = { id: 'it-owner', sub: 'it-owner', role: 'user' };
        }
        next();
      }
    );
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    if (app) await app.close();
    // S3 clients hold keep-alive sockets that keep jest alive forever unless
    // explicitly destroyed — the classic "suite passed but jest hangs" trap.
    probeClient?.destroy();
    try {
      (
        app?.get(S3Service, { strict: false }) as unknown as { s3Client?: S3Client }
      )?.s3Client?.destroy();
    } catch {
      /* app already torn down */
    }
  });

  maybeIntegration('idempotent delete flow', () => {
    it('deletes an existing object, then reports alreadyGone on the second delete', async () => {
      const key = `uploads/it-idem-${Date.now()}.txt`;
      await probeClient.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: Buffer.from('integration test payload'),
          ContentType: 'text/plain',
          Metadata: { userid: 'it-owner' },
        })
      );
      await expect(objectExists(key)).resolves.toBe(true);

      // First delete: object exists → plain success.
      const first = await request(baseUrl)
        .delete(`/media/${encodeURIComponent(key)}`)
        .set('Authorization', ownerAuth);
      expect(first.status).toBe(200);
      expect(first.body.success).toBe(true);
      expect(first.body.data.alreadyGone).toBeUndefined();

      await expect(objectExists(key)).resolves.toBe(false);

      // Second delete: object gone → idempotent alreadyGone success.
      const second = await request(baseUrl)
        .delete(`/media/${encodeURIComponent(key)}`)
        .set('Authorization', ownerAuth);
      expect(second.status).toBe(200);
      expect(second.body.success).toBe(true);
      expect(second.body.data).toEqual(
        expect.objectContaining({ alreadyGone: true, message: 'File deleted successfully' })
      );
    });

    it('keeps objectNotFound out of the owner-check so re-delete never 403s', async () => {
      const key = `uploads/it-never-existed-${Date.now()}.txt`;
      // A delete of a key that NEVER existed must also be alreadyGone (not
      // a Forbidden from a metadata-less owner probe).
      const res = await request(baseUrl)
        .delete(`/media/${encodeURIComponent(key)}`)
        .set('Authorization', 'Bearer it-someone-else-token');
      expect(res.status).toBe(200);
      expect(res.body.data.alreadyGone).toBe(true);
    });
  });

  maybeIntegration('unreachable store → circuit-open 503', () => {
    it('raises the circuit-open rejection from a real S3Service on a dead endpoint', async () => {
      // A REAL S3Service pointed at a dead port: connection failures trip
      // the circuit breaker exactly like a production outage.
      const deadS3 = new S3Service(
        {
          get: (key: string) => {
            const cfg: Record<string, string> = {
              AWS_REGION: 'us-east-1',
              AWS_S3_BUCKET: BUCKET,
              S3_ENDPOINT: 'http://127.0.0.1:1', // reserved port ⇒ refused
              AWS_ACCESS_KEY_ID: 'dead',
              AWS_SECRET_ACCESS_KEY: 'dead',
              CDN_URL: '',
            };
            return cfg[key];
          },
        } as never
      );

      const deadKey = 'uploads/it-dead-store.txt';

      // Exhaust the failure threshold (5) so the circuit actually opens;
      // otherwise the first attempt fails with the raw connection error.
      for (let i = 0; i < 5; i++) {
        await deadS3.getFileMetadata(deadKey).catch(() => undefined);
      }
      expect(
        (deadS3 as unknown as { circuitBreaker: { isOpen(): boolean } }).circuitBreaker.isOpen()
      ).toBe(true);

      // Once open, the error is the honest 503-flavored message — crucially
      // NOT an S3 'NotFound', which is what the controller absorbs as
      // alreadyGone. This is what keeps outages from faking idempotent
      // deletes.
      await expect(deadS3.getFileMetadata(deadKey)).rejects.toThrow(
        'File metadata service temporarily unavailable'
      );
    });

    it('returns 503 over HTTP when the wired S3Service cannot reach the store', async () => {
      // Fresh app whose S3Service points at a dead endpoint: proves the
      // controller maps circuit-open to HTTP 503 end to end. Mirrors main.ts:
      // without URI versioning the /v1/… routes don't exist (404).
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          UploadModule,
          FeatureFlagModule.register({ global: true, redis: { quit: jest.fn() } as never }),
        ],
      })
        .overrideProvider(RedisService)
        .useValue({ get: jest.fn(), set: jest.fn(), del: jest.fn(), keys: jest.fn() })
        .overrideProvider(PrismaService)
        .useValue({
          transcodingJob: { findUnique: jest.fn(), update: jest.fn() },
          mediaUpload: {
            findMany: jest.fn().mockResolvedValue([]),
            findUnique: jest.fn(),
            delete: jest.fn(),
          },
        })
        .overrideProvider(CacheService)
        .useValue({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })
        .overrideProvider(FileValidationService)
        .useValue({ validateFile: jest.fn(), validatePresignedUpload: jest.fn() })
        .overrideProvider(FeatureFlagService)
        .useValue({ isEnabled: jest.fn().mockResolvedValue(true) })
        .overrideGuard(RateLimitGuard)
        .useClass(MockRateLimitGuard)
        .overrideGuard(AdminGuard)
        .useClass(MockAdminGuard)
        .overrideGuard(FeatureFlagGuard)
        .useClass(MockRateLimitGuard)
        .compile();

      // Replace the S3Service instance's client with a dead endpoint while
      // keeping the real service + circuit breaker logic intact.
      const deadS3 = moduleFixture.get<S3Service>(S3Service);
      (deadS3 as unknown as { s3Client: S3Client }).s3Client = new S3Client({
        region: 'us-east-1',
        endpoint: 'http://127.0.0.1:1',
        forcePathStyle: true,
        credentials: { accessKeyId: 'dead', secretAccessKey: 'dead' },
        // Fail fast on the dead endpoint so the threshold exhausts in ms,
        // not SDK-default retry seconds.
        requestHandler: { requestTimeout: 1000, connectionTimeout: 500 },
      });

      const deadApp = moduleFixture.createNestApplication();
      deadApp.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
      deadApp.useGlobalInterceptors(new ResponseWrapperInterceptor());
      deadApp.use(
        (
          req: { headers: { authorization?: string }; user?: unknown },
          _res: unknown,
          next: () => void
        ) => {
          if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ') &&
            !req.user
          ) {
            req.user = { id: 'it-owner', sub: 'it-owner', role: 'user' };
          }
          next();
        }
      );
      await deadApp.init();
      await deadApp.listen(0); // bind a real port before reading the address
      const deadBaseUrl = `http://127.0.0.1:${deadApp.getHttpServer().address().port}`;

      // Exhaust the circuit (5 failures) on the dead endpoint.
      for (let i = 0; i < 5; i++) {
        await deadS3.getFileMetadata('uploads/circuit-probe.txt').catch(() => undefined);
      }
      expect((deadS3 as unknown as { circuitBreaker: { isOpen(): boolean } }).circuitBreaker.isOpen())
        .toBe(true);

      const res = await request(deadBaseUrl)
        // URI versioning is enabled (mirrors main.ts) ⇒ /v1 prefix, and the
        // :key route is a single segment ⇒ the key must be percent-encoded
        // (the same uploads%2F… shape the gateway forwards in production).
        .delete(`/v1/media/${encodeURIComponent('uploads/it-circuit-503.txt')}`)
        .set('Authorization', ownerAuth);

      // Error responses come from the GlobalExceptionFilter (not the
      // ResponseWrapper), so the shape is { message, error, statusCode }.
      expect(res.status).toBe(503);
      expect(String(res.body.message)).toContain('temporarily unavailable');
      expect(res.body.statusCode).toBe(503);

      // Tear down the dead client's sockets before jest looks for open handles.
      (deadS3 as unknown as { s3Client: S3Client }).s3Client.destroy();
      await deadApp.close();
    }, 30000);
  });
});
