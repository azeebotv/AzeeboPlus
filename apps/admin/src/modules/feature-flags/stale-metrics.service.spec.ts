import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StaleFlagMetricsService } from './stale-metrics.service';

jest.mock('axios');

const mockedAxiosGet = axios.get as jest.Mock;

describe('StaleFlagMetricsService', () => {
  let service: StaleFlagMetricsService;

  const boot = async (prometheusUrl?: string, cacheTtlMs?: string) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleFlagMetricsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PROMETHEUS_URL') return prometheusUrl;
              if (key === 'PROMETHEUS_CACHE_TTL_MS') return cacheTtlMs;
              return undefined;
            }),
          },
        },
      ],
    }).compile();
    return module.get(StaleFlagMetricsService);
  };

  const result = () => ({
    data: {
      data: {
        result: [{ metric: { key: 'wallet_withdrawals_enabled' }, value: [1710000000, '42'] }],
      },
    },
  });

  beforeEach(() => {
    mockedAxiosGet.mockReset();
  });

  it('merges lifetime total, 5m rate, and auto-disable counts per key', async () => {
    service = await boot('http://prom:9090');
    mockedAxiosGet
      .mockResolvedValueOnce({
        data: {
          data: {
            result: [
              { metric: { key: 'search_suggestions_ai' }, value: [1710000000, '517'] },
              { metric: { key: 'wallet_withdrawals_enabled' }, value: [1710000000, '42'] },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            result: [
              { metric: { key: 'search_suggestions_ai' }, value: [1710000000, '0.83'] },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            result: [
              { metric: { key: 'wallet_withdrawals_enabled' }, value: [1710000000, '3'] },
            ],
          },
        },
      });

    const out = await service.getStaleRunningByKey();

    expect(out.available).toBe(true);
    expect(out.fetchedAt).toEqual(expect.any(String));
    expect(out.staleRunning).toEqual({
      search_suggestions_ai: { total: 517, rate5m: 0.83 },
      wallet_withdrawals_enabled: { total: 42, rate5m: 0 },
    });
    // autoDisabled only contains keys the safety actually flipped off.
    expect(out.autoDisabled).toEqual({
      wallet_withdrawals_enabled: { total: 3 },
    });
    // All three PromQL queries were issued.
    expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
    expect(mockedAxiosGet.mock.calls[0][1].params.query).toContain('flag_stale_running_total');
    expect(mockedAxiosGet.mock.calls[1][1].params.query).toContain('rate(flag_stale_running_total[5m])');
    expect(mockedAxiosGet.mock.calls[2][1].params.query).toContain('flag_auto_disabled_total');
  });

  it('reports available:false without a configured PROMETHEUS_URL and never queries', async () => {
    service = await boot(undefined);
    const out = await service.getStaleRunningByKey();
    expect(out).toEqual({ available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} });
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it('degrades to available:false when Prometheus is unreachable (never throws)', async () => {
    service = await boot('http://prom:9090');
    mockedAxiosGet.mockRejectedValue(new Error('ECONNREFUSED'));

    const out = await service.getStaleRunningByKey();
    expect(out.available).toBe(false);
    expect(out.staleRunning).toEqual({});
    expect(out.autoDisabled).toEqual({});
    expect(out.fetchedAt).toBeNull();
  });

  it('tolerates an unexpected Prometheus payload shape', async () => {
    service = await boot('http://prom:9090');
    mockedAxiosGet.mockResolvedValue({ data: { data: { result: 'not-an-array' } } });

    const out = await service.getStaleRunningByKey();
    expect(out.available).toBe(true);
    expect(out.staleRunning).toEqual({});
    expect(out.autoDisabled).toEqual({});
  });

  it('serves the cached join within the 30s TTL without re-querying Prometheus', async () => {
    service = await boot('http://prom:9090');
    mockedAxiosGet.mockResolvedValue(result());

    const first = await service.getStaleRunningByKey();
    const second = await service.getStaleRunningByKey();

    expect(mockedAxiosGet).toHaveBeenCalledTimes(3); // one fetch, not six
    expect(second).toEqual(first);
    // fetchedAt reflects the Prometheus fetch, preserved across cache hits.
    expect(second.fetchedAt).toBe(first.fetchedAt);
    // Same fixture feeds all three queries, so the rate picks up 42 as well.
    expect(second.staleRunning.wallet_withdrawals_enabled).toEqual({ total: 42, rate5m: 42 });
    expect(second.autoDisabled.wallet_withdrawals_enabled).toEqual({ total: 42 });
  });

  it('refetches once the cache has expired (TTL 0 never caches)', async () => {
    service = await boot('http://prom:9090', '0');
    mockedAxiosGet.mockResolvedValue(result());

    await service.getStaleRunningByKey();
    await service.getStaleRunningByKey();

    expect(mockedAxiosGet).toHaveBeenCalledTimes(6); // fresh fetch per call
  });

  it('dedupes concurrent in-flight fetches (single-flight, no stampede)', async () => {
    service = await boot('http://prom:9090');
    const resolvers: Array<(v: unknown) => void> = [];
    mockedAxiosGet.mockImplementation(
      () => new Promise((resolve) => resolvers.push(resolve))
    );

    const p1 = service.getStaleRunningByKey();
    const p2 = service.getStaleRunningByKey();

    // Both callers share the single in-flight fetch (3 queries, not 6).
    expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
    resolvers.splice(0).forEach((r) => r(result()));

    const [o1, o2] = await Promise.all([p1, p2]);
    expect(o1).toEqual(o2);
    expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
  });

  it('never caches failures — the next call retries Prometheus', async () => {
    service = await boot('http://prom:9090');
    mockedAxiosGet.mockRejectedValue(new Error('ECONNREFUSED'));

    await service.getStaleRunningByKey();
    expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
    await service.getStaleRunningByKey();
    expect(mockedAxiosGet).toHaveBeenCalledTimes(6);
  });
});
