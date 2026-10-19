import { describe, it, expect } from 'vitest';
import {
  CREATOR_FLAG_KEYS,
  CREATOR_FLAG_DEFAULTS,
  resolveCreatorFlag,
  resolveUniverseVisible,
  visibleUniverseSlugs,
} from './useCreatorFlags';

const flag = (key: string, enabled: boolean) => ({ key, enabled });

describe('resolveCreatorFlag', () => {
  it('defaults every creator UI flag to off when nothing is stored', () => {
    for (const key of Object.values(CREATOR_FLAG_KEYS)) {
      expect(resolveCreatorFlag([], key)).toBe(false);
    }
    expect(CREATOR_FLAG_DEFAULTS[CREATOR_FLAG_KEYS.newAnalytics]).toBe(false);
    expect(CREATOR_FLAG_DEFAULTS[CREATOR_FLAG_KEYS.uploadV2]).toBe(false);
    expect(CREATOR_FLAG_DEFAULTS[CREATOR_FLAG_KEYS.payoutsUi]).toBe(false);
    expect(CREATOR_FLAG_DEFAULTS[CREATOR_FLAG_KEYS.onboardingWizard]).toBe(false);
  });

  it('returns the explicit server value when present', () => {
    const flags = [flag(CREATOR_FLAG_KEYS.newAnalytics, true)];
    expect(resolveCreatorFlag(flags, CREATOR_FLAG_KEYS.newAnalytics)).toBe(true);
    expect(resolveCreatorFlag(flags, CREATOR_FLAG_KEYS.uploadV2)).toBe(false);
  });

  it('respects an explicit false even when the default is on', () => {
    const flags = [flag(CREATOR_FLAG_KEYS.uploadV2, true)];
    expect(resolveCreatorFlag(flags, CREATOR_FLAG_KEYS.uploadV2)).toBe(true);
  });

  it('falls back to off for unregistered keys', () => {
    expect(resolveCreatorFlag([], 'creator_unknown_flag')).toBe(false);
  });
});

describe('universe visibility sentinels', () => {
  it('a stored-disabled sentinel hides the universe, an enabled one keeps it', () => {
    const flags = [flag('universe.comedy.enabled', false), flag('universe.reality.enabled', true)];
    expect(resolveUniverseVisible(flags, 'comedy')).toBe(false);
    expect(resolveUniverseVisible(flags, 'reality')).toBe(true);
  });

  it('an absent sentinel means default-visible (never blanks the picker)', () => {
    expect(resolveUniverseVisible([], 'movie')).toBe(true);
  });

  it('the picker excludes disabled universes and the creator role slug', () => {
    const flags = [flag('universe.sports.enabled', false)];
    const slugs = visibleUniverseSlugs(flags);
    expect(slugs).not.toContain('sports');
    expect(slugs).not.toContain('creator');
    expect(slugs).toContain('reality');
    expect(slugs).toContain('movie');
  });
});
