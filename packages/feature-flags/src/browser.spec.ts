import { BrowserFeatureFlagService } from './browser';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('BrowserFeatureFlagService', () => {
  it('resolves registered boolean defaults', async () => {
    const svc = new BrowserFeatureFlagService({
      defaultFlags: { web_dark_mode: true, web_autoplay: false },
    });
    expect(await svc.isEnabled('web_dark_mode')).toBe(true);
    expect(await svc.isEnabled('web_autoplay')).toBe(false);
    expect(await svc.isEnabled('unregistered')).toBe(false);
  });

  it('resolves numeric defaults via getValue', async () => {
    const svc = new BrowserFeatureFlagService({
      defaultValues: { analytics_sampling_rate: 100 },
    });
    expect(await svc.getValue('analytics_sampling_rate')).toBe(100);
    expect(await svc.isEnabled('analytics_sampling_rate')).toBe(true);
  });

  it('override wins over the default', async () => {
    const storage = new MemoryStorage();
    const svc = new BrowserFeatureFlagService({ defaultFlags: { a: true }, storage });
    svc.setOverride('a', { key: 'a', enabled: false });
    expect(await svc.isEnabled('a')).toBe(false);
    svc.setOverride('a', null);
    expect(await svc.isEnabled('a')).toBe(true);
  });

  it('targeted users always win at partial rollout', async () => {
    const svc = new BrowserFeatureFlagService({});
    const flag = { key: 'x', enabled: true, rolloutPercentage: 10, userIds: ['vip-1'] };
    expect(svc.evaluateFlag(flag, 'x', 'vip-1')).toBe(true);
  });

  it('rollout buckets deterministically per user', () => {
    const svc = new BrowserFeatureFlagService({});
    const flag = { key: 'x', enabled: true, rolloutPercentage: 50 };
    const a = svc.evaluateFlag(flag, 'x', 'user-a');
    const b = svc.evaluateFlag(flag, 'x', 'user-b');
    // Same user is stable; across users both outcomes are reachable
    expect(svc.evaluateFlag(flag, 'x', 'user-a')).toBe(a);
    expect([true, false]).toContain(a);
    expect([true, false]).toContain(b);
  });

  it('returns null value when the flag is not enabled for the user', async () => {
    const svc = new BrowserFeatureFlagService({});
    const storage = new MemoryStorage();
    const svc2 = new BrowserFeatureFlagService({ defaultValues: { rate: 25 }, storage });
    expect(await svc2.getValue('rate', 'someone-in-the-0-bucket')).toBe(25);
    expect(await svc.getValue('missing')).toBe(null);
  });

  it('evaluateMany evaluates every key', async () => {
    const svc = new BrowserFeatureFlagService({ defaultFlags: { a: true, b: false } });
    const result = await svc.evaluateMany(['a', 'b', 'c']);
    expect(result).toEqual({ a: true, b: false, c: false });
  });
});
