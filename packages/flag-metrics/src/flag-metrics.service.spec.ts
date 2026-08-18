import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import axios from 'axios';
import { FlagMetricsService, setFlagHooks, getFlagHooks, flagHooks } from './flag-metrics.service';
import { FlagMetricsModule } from './flag-metrics.module';

jest.mock('axios');
const mockedAxiosPost = axios.post as jest.Mock;

describe('FlagMetricsService', () => {
  let service: FlagMetricsService;

  beforeEach(() => {
    mockedAxiosPost.mockReset();
    // Auto-mocked axios.post returns undefined — give it a resolved promise so
    // the fire-and-forget .catch() chain is valid (tests override per-call).
    mockedAxiosPost.mockResolvedValue({ data: {} });
    service = new FlagMetricsService('auth-service');
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('bumps flag_evaluation_total per evaluation with service + key + result labels', async () => {
    const hooks = service.getFlagHooks();
    hooks.onEvaluation?.('web_maintenance_mode', true, { userId: 'u-1' });
    hooks.onEvaluation?.('web_maintenance_mode', false, { anonymousId: 'a-1' });
    hooks.onEvaluation?.('web_dark_mode', true, {});

    const metrics = await service.getMetrics();
    expect(metrics).toContain('flag_evaluation_total');
    expect(metrics).toContain(
      'flag_evaluation_total{service="auth-service",key="web_maintenance_mode",result="enabled"} 1'
    );
    expect(metrics).toContain(
      'flag_evaluation_total{service="auth-service",key="web_maintenance_mode",result="disabled"} 1'
    );
    expect(metrics).toContain(
      'flag_evaluation_total{service="auth-service",key="web_dark_mode",result="enabled"} 1'
    );
  });

  it('bumps flag_toggled_total per toggle with service + key + value labels', async () => {
    const hooks = service.getFlagHooks();
    hooks.onToggle?.('web_maintenance_mode', true, 'admin-1');
    hooks.onToggle?.('web_maintenance_mode', false, 'admin-2');

    const metrics = await service.getMetrics();
    expect(metrics).toContain('flag_toggled_total');
    expect(metrics).toContain(
      'flag_toggled_total{service="auth-service",key="web_maintenance_mode",value="enabled"} 1'
    );
    expect(metrics).toContain(
      'flag_toggled_total{service="auth-service",key="web_maintenance_mode",value="disabled"} 1'
    );
  });

  it('bumps flag_stale_running_total for flags evaluated ENABLED past their staleAfter', async () => {
    const hooks = service.getFlagHooks();
    hooks.onStaleEnabled?.('expired_flag', {
      key: 'expired_flag',
      enabled: true,
      staleAfter: '2000-01-01',
    });
    hooks.onStaleEnabled?.('expired_flag', {
      key: 'expired_flag',
      enabled: true,
      staleAfter: '2000-01-01',
    });
    hooks.onStaleEnabled?.('another_expired', {
      key: 'another_expired',
      enabled: true,
      staleAfter: '2000-01-01',
    });

    const metrics = await service.getMetrics();
    expect(metrics).toContain('flag_stale_running_total');
    expect(metrics).toContain(
      'flag_stale_running_total{service="auth-service",key="expired_flag"} 2'
    );
    expect(metrics).toContain(
      'flag_stale_running_total{service="auth-service",key="another_expired"} 1'
    );
  });

  it('bumps flag_cache_hits_total and flag_redis_reads_total (TTL hit-ratio inputs)', async () => {
    const hooks = service.getFlagHooks();
    hooks.onCacheHit?.('web_dark_mode');
    hooks.onCacheHit?.('web_dark_mode');
    hooks.onCacheMiss?.('web_dark_mode');
    hooks.onCacheMiss?.('mobile_autoplay');

    const metrics = await service.getMetrics();
    expect(metrics).toContain(
      'flag_cache_hits_total{service="auth-service",key="web_dark_mode"} 2'
    );
    expect(metrics).toContain(
      'flag_redis_reads_total{service="auth-service",key="web_dark_mode"} 1'
    );
    expect(metrics).toContain(
      'flag_redis_reads_total{service="auth-service",key="mobile_autoplay"} 1'
    );
  });

  it('bumps flag_list_cache_hits_total / flag_list_redis_reads_total (bootstrap list hit-ratio inputs)', async () => {
    const hooks = service.getFlagHooks();
    hooks.onListCacheHit?.();
    hooks.onListCacheHit?.();
    hooks.onListCacheHit?.();
    hooks.onListCacheMiss?.();

    const metrics = await service.getMetrics();
    expect(metrics).toContain('flag_list_cache_hits_total{service="auth-service"} 3');
    expect(metrics).toContain('flag_list_redis_reads_total{service="auth-service"} 1');
  });

  it('bumps flag_auto_disabled_total for flags the self-disable safety turned off', async () => {
    const hooks = service.getFlagHooks();
    hooks.onAutoDisabled?.('zombie_flag', {
      key: 'zombie_flag',
      enabled: true,
      staleAfter: '2000-01-01',
    });
    hooks.onAutoDisabled?.('zombie_flag', {
      key: 'zombie_flag',
      enabled: true,
      staleAfter: '2000-01-01',
    });
    hooks.onAutoDisabled?.('other_zombie', {
      key: 'other_zombie',
      enabled: true,
      staleAfter: '2000-01-01',
    });

    const metrics = await service.getMetrics();
    expect(metrics).toContain('flag_auto_disabled_total');
    expect(metrics).toContain(
      'flag_auto_disabled_total{service="auth-service",key="zombie_flag"} 2'
    );
    expect(metrics).toContain(
      'flag_auto_disabled_total{service="auth-service",key="other_zombie"} 1'
    );
  });

  it('emits a payment-style flag_stale_enabled event per stale evaluation (with caller context)', async () => {
    const svc = new FlagMetricsService('auth-service', 'http://analytics:4000');
    try {
      svc
        .getFlagHooks()
        .onStaleEnabled?.(
          'expired_flag',
          { key: 'expired_flag', enabled: true, staleAfter: '2000-01-01', owner: 'payments' },
          { userId: 'u-1' }
        );

      expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
      const [url, payload] = mockedAxiosPost.mock.calls[0] as [string, Record<string, unknown>];
      expect(url).toBe('http://analytics:4000/analytics/track');
      expect(payload).toEqual({
        eventName: 'flag_stale_enabled',
        userId: 'u-1',
        universe: 'auth-service',
        metadata: expect.objectContaining({
          key: 'expired_flag',
          service: 'auth-service',
          staleAfter: '2000-01-01',
          owner: 'payments',
        }),
        timestamp: expect.any(String),
      });
    } finally {
      svc.onModuleDestroy();
    }
  });

  it('marks anonymous evaluations in the event metadata', async () => {
    const svc = new FlagMetricsService('auth-service', 'http://analytics:4000');
    try {
      svc
        .getFlagHooks()
        .onStaleEnabled?.(
          'expired_anon',
          { key: 'expired_anon', enabled: true },
          { anonymousId: 'anon-9' }
        );

      const [, payload] = mockedAxiosPost.mock.calls[0] as [string, Record<string, unknown>];
      expect(payload.userId).toBeUndefined();
      expect(payload.metadata).toEqual(
        expect.objectContaining({ key: 'expired_anon', anonymous: true })
      );
    } finally {
      svc.onModuleDestroy();
    }
  });

  it('skips the analytics POST when no analytics URL is configured', () => {
    service
      .getFlagHooks()
      .onStaleEnabled?.('expired_flag', { key: 'expired_flag', enabled: true }, { userId: 'u-2' });
    expect(mockedAxiosPost).not.toHaveBeenCalled();
  });

  it('swallows analytics POST failures (never affects the evaluation path)', async () => {
    const svc = new FlagMetricsService('auth-service', 'http://analytics:4000');
    mockedAxiosPost.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    try {
      expect(() =>
        svc.getFlagHooks().onStaleEnabled?.('expired_flag', { key: 'expired_flag', enabled: true })
      ).not.toThrow();
      // Give the fire-and-forget rejection a tick to be handled by the catch.
      await new Promise((r) => setTimeout(r, 5));
    } finally {
      svc.onModuleDestroy();
    }
  });

  it('flagHooks(service) forwards onAutoDisabled to the live holder', async () => {
    const hooks = flagHooks('notification-service');
    const notif = new FlagMetricsService('notification-service');
    try {
      notif.onModuleInit();
      hooks.onAutoDisabled?.('zombie_notif', { key: 'zombie_notif', enabled: true });

      const metrics = await notif.getMetrics();
      expect(metrics).toContain(
        'flag_auto_disabled_total{service="notification-service",key="zombie_notif"} 1'
      );
    } finally {
      notif.onModuleDestroy();
    }
  });

  it('flagHooks(service) forwards onStaleEnabled to the live holder', async () => {
    const hooks = flagHooks('notification-service');
    const notif = new FlagMetricsService('notification-service');
    try {
      notif.onModuleInit();
      hooks.onStaleEnabled?.('expired_notif', { key: 'expired_notif', enabled: true });

      const metrics = await notif.getMetrics();
      expect(metrics).toContain(
        'flag_stale_running_total{service="notification-service",key="expired_notif"} 1'
      );
    } finally {
      notif.onModuleDestroy();
    }
  });

  it('different service instances keep their series separate (per-service label)', async () => {
    const other = new FlagMetricsService('search-service');
    try {
      service.getFlagHooks().onEvaluation?.('search_typo_tolerance', true, {});
      other.getFlagHooks().onEvaluation?.('search_typo_tolerance', false, {});

      const metrics = await service.getMetrics();
      expect(metrics).toContain(
        'flag_evaluation_total{service="auth-service",key="search_typo_tolerance",result="enabled"} 1'
      );
      expect(metrics).not.toContain('service="search-service"');
    } finally {
      other.onModuleDestroy();
    }
  });

  it('onModuleInit swaps the no-op holder for the real hooks (keyed by service)', async () => {
    // Before init: the holder for this service is the no-op default.
    getFlagHooks('auth-service').onToggle?.('web_maintenance_mode', true, 'admin-x');

    service.onModuleInit();
    getFlagHooks('auth-service').onEvaluation?.('web_maintenance_mode', true, {});

    const metrics = await service.getMetrics();
    // The pre-init toggle hit the no-op holder → no labeled series recorded.
    expect(metrics).not.toMatch(/flag_toggled_total\{/);
    // The post-init evaluation hit the real counter (series with labels).
    expect(metrics).toMatch(/flag_evaluation_total\{/);
  });

  it('holder entries are per-service: one init does not wire another service', async () => {
    service.onModuleInit();
    // A second service never initialized — its holder is still the no-op.
    getFlagHooks('content-service').onEvaluation?.('content_comments_v2', true, {});

    const metrics = await service.getMetrics();
    expect(metrics).not.toMatch(/content_comments_v2/);
  });

  it('flagHooks(service) delegates to the live holder once initialized', async () => {
    const hooks = flagHooks('wallet-service');
    expect(hooks.onEvaluation).toBeDefined();
    expect(hooks.onToggle).toBeDefined();

    const wallet = new FlagMetricsService('wallet-service');
    try {
      wallet.onModuleInit();
      hooks.onEvaluation?.('wallet_withdrawals_enabled', true, { userId: 'u-2' });

      const metrics = await wallet.getMetrics();
      expect(metrics).toMatch(
        /flag_evaluation_total\{service="wallet-service",key="wallet_withdrawals_enabled",result="enabled"\} 1/
      );
    } finally {
      wallet.onModuleDestroy();
    }
  });

  it('setFlagHooks/getFlagHooks round-trip per service', () => {
    const fake: Parameters<typeof setFlagHooks>[1] = {
      onEvaluation: () => undefined,
      onToggle: () => undefined,
      onStaleEnabled: () => undefined,
      onAutoDisabled: () => undefined,
    };
    setFlagHooks('auth-service', fake);
    expect(getFlagHooks('auth-service')).toBe(fake);
    // Other services untouched.
    expect(getFlagHooks('media-service')).not.toBe(fake);
  });

  it('metrics output is text/plain prometheus exposition format', async () => {
    service.getFlagHooks().onEvaluation?.('mobile_autoplay', true, { userId: 'u-2' });

    const metrics = await service.getMetrics();
    expect(
      metrics.split('\n').some((l) => l.startsWith('flag_evaluation_total{service="auth-service"'))
    ).toBe(true);
    expect(metrics).toMatch(
      /flag_evaluation_total\{service="auth-service",key="mobile_autoplay",result="enabled"\} 1/
    );
  });
});

describe('FlagMetricsModule', () => {
  // Each test registers a different module config (service/path), so it needs
  // its own app — but every app is bound ONCE and stays alive for the whole
  // file (closed in afterAll), eliminating per-test close/relisten port churn.
  const apps: INestApplication[] = [];

  afterAll(async () => {
    await Promise.all(apps.map((liveApp) => liveApp.close()));
  });

  it('serves metrics at the default /metrics path', async () => {
    const { app, url: baseUrl } = await bootApp('media-service');
    apps.push(app);
    const res = await request(baseUrl).get('/metrics').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('flag_evaluation_total');
  });

  it('serves metrics at a custom path when one is configured', async () => {
    const { app, url: baseUrl } = await bootApp('payment-service', 'flag-metrics');
    apps.push(app);
    const res = await request(baseUrl).get('/flag-metrics').expect(200);
    expect(res.text).toContain('flag_evaluation_total');
    await request(baseUrl).get('/metrics').expect(404);
  });

  it('hooks wired through the module reach the live counters end-to-end', async () => {
    const { app, url: baseUrl } = await bootApp('notification-service');
    apps.push(app);
    // Simulate what FeatureFlagModule.register({ ...flagHooks('notification-service') })
    // does after app init: evaluations flow into the counters.
    getFlagHooks('notification-service').onEvaluation?.('notification_digest', true, {});

    const res = await request(baseUrl).get('/metrics').expect(200);
    expect(res.text).toContain(
      'flag_evaluation_total{service="notification-service",key="notification_digest",result="enabled"} 1'
    );
  });
});

async function bootApp(
  service: string,
  path?: string
): Promise<{ app: INestApplication; url: string }> {
  const moduleRef = await Test.createTestingModule({
    imports: [FlagMetricsModule.register({ service, path })],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(0);
  return { app, url: `http://127.0.0.1:${app.getHttpServer().address().port}` };
}
