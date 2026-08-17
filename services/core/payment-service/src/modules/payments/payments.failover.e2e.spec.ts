import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'node:child_process';
import Redis from 'ioredis';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { PaystackProvider } from './providers/paystack.provider.js';
import { FlutterwaveProvider } from './providers/flutterwave.provider.js';
import { WebhookRetryService } from './webhook-retry.service.js';
import { RedisService, CacheService } from '@azeebo/shared-services';
import { FeatureFlagService, paymentFlags } from '@azeebo/feature-flags';

/**
 * Dockerized payment provider failover e2e: REAL Paystack + Flutterwave HTTP
 * stubs, REAL Postgres (payment schema), REAL Redis — no mocks in-process.
 *
 * Scenario: Paystack is DOWN (the paystack-mock container answers 503 by
 * default) → initializePayment must fail over to Flutterwave, and the payment
 * intent must be recorded against the provider that actually authorized the
 * checkout.
 *
 * Infra (see docker-compose.test.yml at the repo root):
 *   docker compose -f docker-compose.test.yml up -d --wait \
 *     redis-test postgres-test paystack-mock flutterwave-mock
 *   pnpm --filter @azeebo/payment-service test:e2e:failover
 *
 * The mock servers are controllable at runtime (POST /__control/status
 * {status: 200|503} + a request log at GET /__control/requests) so one run
 * covers: paystack down → fallback; paystack recovered → direct; both down →
 * intent failed; paystack flag off → flutterwave direct; confirmIntent fallback.
 *
 * Opt-in: skipped unless RUN_PAYMENT_FAILOVER_E2E=1 or PAYMENT_TEST_DATABASE_URL
 * is set, so the default `pnpm test` run never depends on docker. The schema is
 * applied with `prisma migrate deploy` (idempotent) before the module boots.
 */

const RUN = process.env.RUN_PAYMENT_FAILOVER_E2E === '1' || !!process.env.PAYMENT_TEST_DATABASE_URL;
const DB_URL =
  process.env.PAYMENT_TEST_DATABASE_URL ??
  'postgresql://azeebo_test:azeebo_test@localhost:5433/azeebo_payment_test?schema=public';
const REDIS_URL = process.env.REDIS_TEST_URL ?? 'redis://localhost:6380';
const PAYSTACK_URL = process.env.PAYSTACK_MOCK_URL ?? 'http://localhost:8091';
const FLUTTERWAVE_URL = process.env.FLUTTERWAVE_MOCK_URL ?? 'http://localhost:8092';

const TEST_USER = 'e2e-failover-user';

jest.setTimeout(120_000);

if (!RUN) {
  // eslint-disable-next-line azeebo-custom/no-console-log -- opt-in skip guidance for ops
  console.log(
    `[payments.failover.e2e] Skipping — opt-in. Boot docker infra with \`docker compose ` +
      `-f docker-compose.test.yml up -d --wait redis-test postgres-test paystack-mock ` +
      `flutterwave-mock\` then run \`pnpm --filter @azeebo/payment-service test:e2e:failover\`.`
  );
}

const liveDescribe = RUN ? describe : describe.skip;

liveDescribe('payment provider failover (paystack down → flutterwave fallback)', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let flagRedis: Redis;
  let flagService: FeatureFlagService;
  let moduleRef: TestingModule;

  const dto = { amount: 5000, currency: 'NGN', description: 'failover e2e' };

  const mockControl = async (base: string, status: number): Promise<void> => {
    await fetch(`${base}/__control/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const resetMock = async (base: string): Promise<void> => {
    await fetch(`${base}/__control/reset`, { method: 'POST' });
  };

  const mockRequests = async (base: string): Promise<Array<{ url: string; method: string }>> => {
    const res = await fetch(`${base}/__control/requests`);
    return (await res.json()).requests;
  };

  beforeAll(async () => {
    // Point every real client at the dockerized infra.
    process.env.DATABASE_URL = DB_URL;
    process.env.REDIS_URL = REDIS_URL;
    process.env.FEATURE_FLAG_REDIS_URL = REDIS_URL;
    process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? 'sk_test_mock';
    process.env.PAYSTACK_API_URL = PAYSTACK_URL;
    process.env.FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY ?? 'FLWSECK_TEST_mock';
    process.env.FLUTTERWAVE_API_URL = FLUTTERWAVE_URL;
    // Unreachable by design: analytics/wallet calls are best-effort and must
    // never fail a payment (the failover path emits an analytics event).
    process.env.ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL ?? 'http://127.0.0.1:1';
    process.env.WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL ?? 'http://127.0.0.1:1';

    // Apply the payment schema to the test DB (idempotent; safe to re-run).
    execSync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: 'pipe',
    });

    flagRedis = new Redis(REDIS_URL, { retryStrategy: () => null });
    flagService = new FeatureFlagService({
      redis: flagRedis,
      cacheTtlMs: 0,
      defaultFlags: {
        [paymentFlags.providerPaystack]: true,
        [paymentFlags.providerFlutterwave]: true,
      },
    });

    moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: FeatureFlagService, useValue: flagService },
        PrismaService,
        PaystackProvider,
        FlutterwaveProvider,
        // Unused by initializePayment/confirmIntent — stub to keep the retry
        // processor timer out of the test process.
        { provide: WebhookRetryService, useValue: {} },
        RedisService,
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: unknown) => process.env[key] ?? defaultValue,
            getOrThrow: (key: string) => {
              const value = process.env[key];
              if (value == null) throw new Error(`Missing env var ${key}`);
              return value;
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Default provider health: paystack DOWN, flutterwave UP.
    await resetMock(PAYSTACK_URL);
    await resetMock(FLUTTERWAVE_URL);
    await flagService.setFlag({ key: paymentFlags.providerPaystack, enabled: true });
    await flagService.setFlag({ key: paymentFlags.providerFlutterwave, enabled: true });
  });

  afterEach(async () => {
    await flagService.deleteFlag(paymentFlags.providerPaystack);
    await flagService.deleteFlag(paymentFlags.providerFlutterwave);
    await prisma.paymentIntent.deleteMany({ where: { userId: TEST_USER } });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    // moduleRef.close() quits flagRedis once via FeatureFlagService's
    // onModuleDestroy hook (and RedisService's own connection). Quitting it
    // here too would race the hook's quit — ioredis rejects the queued QUIT
    // with "Connection is closed" when the socket drains mid-teardown.
    await moduleRef?.close();
  });

  it('paystack down → falls back to flutterwave, checkout + intent recorded against flutterwave', async () => {
    const result = await service.initializePayment(TEST_USER, dto);

    expect(result.success).toBe(true);
    expect(result.data?.provider).toBe('flutterwave');
    expect(result.data?.checkoutUrl).toContain('8092');

    // The DB intent carries the flutterwave reference and a processing status.
    const intent = await prisma.paymentIntent.findUnique({
      where: { id: result.data!.paymentId },
    });
    expect(intent?.status).toBe('processing');
    expect(intent?.providerReference).toMatch(/^fw-ref-/);

    // Both mocks saw the flow: paystack was attempted, flutterwave answered.
    const psRequests = await mockRequests(PAYSTACK_URL);
    const fwRequests = await mockRequests(FLUTTERWAVE_URL);
    expect(psRequests.some((r) => r.url === '/transaction/initialize')).toBe(true);
    expect(fwRequests.some((r) => r.url === '/payments')).toBe(true);
  });

  it('paystack recovered → routes to paystack directly (no fallback)', async () => {
    await mockControl(PAYSTACK_URL, 200);

    const result = await service.initializePayment(TEST_USER, dto);

    expect(result.data?.provider).toBe('paystack');
    expect(result.data?.checkoutUrl).toContain('8091');
    const fwRequests = await mockRequests(FLUTTERWAVE_URL);
    expect(fwRequests.some((r) => r.url === '/payments')).toBe(false);
  });

  it('both providers down → intent marked failed, payment rejected', async () => {
    await mockControl(FLUTTERWAVE_URL, 503);

    await expect(service.initializePayment(TEST_USER, dto)).rejects.toThrow();

    const intents = await prisma.paymentIntent.findMany({ where: { userId: TEST_USER } });
    expect(intents.at(-1)?.status).toBe('failed');
  });

  it('paystack flag off → flutterwave used directly (kill-switch respected)', async () => {
    await flagService.setFlag({ key: paymentFlags.providerPaystack, enabled: false });

    const result = await service.initializePayment(TEST_USER, dto);

    expect(result.data?.provider).toBe('flutterwave');
  });

  it('confirmIntent fails over when the primary provider is down', async () => {
    await flagService.setFlag({ key: paymentFlags.intentsApi, enabled: true });

    const intent = await service.createIntent(TEST_USER, dto);
    const intentId = (intent.data as { intentId: string }).intentId;
    const result = await service.confirmIntent(TEST_USER, intentId);

    const data = result.data as { provider: string; checkoutUrl: string };
    expect(data.provider).toBe('flutterwave');
    expect(data.checkoutUrl).toContain('8092');

    await flagService.deleteFlag(paymentFlags.intentsApi);
  });
});
