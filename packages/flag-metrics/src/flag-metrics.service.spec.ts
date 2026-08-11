import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { FlagMetricsService, setFlagHooks, getFlagHooks, flagHooks } from './flag-metrics.service';
import { FlagMetricsModule } from './flag-metrics.module';

describe('FlagMetricsService', () => {
  let service: FlagMetricsService;

  beforeEach(() => {
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
      metrics
        .split('\n')
        .some((l) => l.startsWith('flag_evaluation_total{service="auth-service"'))
    ).toBe(true);
    expect(metrics).toMatch(
      /flag_evaluation_total\{service="auth-service",key="mobile_autoplay",result="enabled"\} 1/
    );
  });
});

describe('FlagMetricsModule', () => {
  it('serves metrics at the default /metrics path', async () => {
    const app = await bootApp('media-service');
    try {
      const res = await request(app.getHttpServer()).get('/metrics').expect(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/);
      expect(res.text).toContain('flag_evaluation_total');
    } finally {
      await app.close();
    }
  });

  it('serves metrics at a custom path when one is configured', async () => {
    const app = await bootApp('payment-service', 'flag-metrics');
    try {
      const res = await request(app.getHttpServer()).get('/flag-metrics').expect(200);
      expect(res.text).toContain('flag_evaluation_total');
      await request(app.getHttpServer()).get('/metrics').expect(404);
    } finally {
      await app.close();
    }
  });

  it('hooks wired through the module reach the live counters end-to-end', async () => {
    const app = await bootApp('notification-service');
    try {
      // Simulate what FeatureFlagModule.register({ ...flagHooks('notification-service') })
      // does after app init: evaluations flow into the counters.
      getFlagHooks('notification-service').onEvaluation?.('notification_digest', true, {});

      const res = await request(app.getHttpServer()).get('/metrics').expect(200);
      expect(res.text).toContain(
        'flag_evaluation_total{service="notification-service",key="notification_digest",result="enabled"} 1'
      );
    } finally {
      await app.close();
    }
  });
});

async function bootApp(service: string, path?: string): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [FlagMetricsModule.register({ service, path })],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
