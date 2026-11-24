import { describe, it, expect } from 'vitest';
import { sourceBadgeFor, archivedFromDetails } from '@/lib/audit-log-helpers';
import type { AuditLogEntry } from '@/lib/api/admin';

const entry = (over: Partial<AuditLogEntry>): AuditLogEntry => ({
  id: '1',
  actorId: 'admin-1',
  action: 'feature_flag.deleted',
  targetType: 'feature_flag',
  targetId: 'wallet_withdrawals_enabled',
  createdAt: '2026-08-12T00:00:00.000Z',
  ...over,
});

describe('sourceBadgeFor', () => {
  it('labels each known source distinctly', () => {
    expect(sourceBadgeFor('auth-service')).toBe('Auth service');
    expect(sourceBadgeFor('admin')).toBe('Admin panel');
  });

  it('falls back to Admin panel for undefined or unknown sources', () => {
    expect(sourceBadgeFor(undefined)).toBe('Admin panel');
    expect(sourceBadgeFor('mystery-source')).toBe('Admin panel');
  });
});

describe('archivedFromDetails', () => {
  it('derives the global flag key from targetId (snapshot has no key field)', () => {
    const log = entry({
      details: {
        archivedSnapshot: { enabled: true, staleAfter: '2026-01-01', archivedAt: 'x' },
      },
    });

    const result = archivedFromDetails(log);

    expect(result.count).toBe(1);
    expect(result.keys).toEqual(['wallet_withdrawals_enabled']);
  });

  it('uses the universe snapshot featureKey + universeName', () => {
    const log = entry({
      targetType: 'universe_feature_flag',
      targetId: 'reality.voting_enabled',
      details: {
        archivedSnapshot: {
          featureKey: 'voting_enabled',
          universeName: 'reality',
          isEnabled: true,
          archivedAt: 'x',
        },
      },
    });

    const result = archivedFromDetails(log);

    expect(result.count).toBe(1);
    expect(result.keys).toEqual(['reality.voting_enabled']);
  });

  it('falls back to the universe display name when universeName is absent', () => {
    const log = entry({
      targetType: 'universe_feature_flag',
      targetId: 'reality.voting_enabled',
      details: {
        archivedSnapshot: { featureKey: 'voting_enabled', universeDisplayName: 'Reality TV' },
      },
    });

    expect(archivedFromDetails(log).keys).toEqual(['Reality TV.voting_enabled']);
  });

  it('handles the plural archivedSnapshots array (defensive) with all keys', () => {
    const log = entry({
      targetType: 'universe_feature_flag',
      details: {
        archivedSnapshots: [
          { featureKey: 'voting_enabled', universeName: 'reality' },
          { featureKey: 'predictions_enabled', universeName: 'reality' },
        ],
      },
    });

    const result = archivedFromDetails(log);

    expect(result.count).toBe(2);
    expect(result.keys).toEqual(['reality.voting_enabled', 'reality.predictions_enabled']);
  });

  it('reports zero when no snapshot was archived', () => {
    const log = entry({ details: undefined });

    expect(archivedFromDetails(log)).toEqual({ count: 0, keys: [] });
  });
});
