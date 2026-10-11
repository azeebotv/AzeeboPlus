import { ImmutableAuditDbService } from './immutable-audit-db.service';
import { pseudonymizeIdentifier } from '../log-redaction';
import type { AuditPrismaClient } from '../types';

describe('ImmutableAuditDbService.pseudonymizeNetworkMetadata (AUD-48)', () => {
  let groupBy: jest.Mock;
  let updateMany: jest.Mock;
  let service: ImmutableAuditDbService;
  const cutoff = new Date('2026-01-01T00:00:00Z');

  beforeEach(() => {
    groupBy = jest.fn();
    updateMany = jest.fn();
    service = new ImmutableAuditDbService({
      auditLog: { groupBy, updateMany },
    } as unknown as AuditPrismaClient);
  });

  it('pseudonymizes each distinct stale pair and sums updated row counts', async () => {
    groupBy.mockResolvedValue([
      { ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0' },
      { ipAddress: null, userAgent: 'curl/8.0' },
    ]);
    updateMany
      .mockResolvedValueOnce({ count: 3 })
      .mockResolvedValueOnce({ count: 2 });

    const { compacted } = await service.pseudonymizeNetworkMetadata(cutoff);

    expect(compacted).toBe(5);
    expect(groupBy).toHaveBeenCalledWith({
      by: ['ipAddress', 'userAgent'],
      where: {
        timestamp: { lt: cutoff },
        OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
      },
    });
    expect(updateMany).toHaveBeenCalledTimes(2);

    const first = updateMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
      data: { ipAddress: string; userAgent: string };
    };
    expect(first.where).toEqual({
      timestamp: { lt: cutoff },
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
    expect(first.data.ipAddress).toBe(pseudonymizeIdentifier('10.0.0.1'));
    expect(first.data.userAgent).toBe(pseudonymizeIdentifier('Mozilla/5.0'));

    const second = updateMany.mock.calls[1][0] as {
      data: { ipAddress: string | null; userAgent: string };
    };
    expect(second.data.ipAddress).toBeNull();
    expect(second.data.userAgent).toBe(pseudonymizeIdentifier('curl/8.0'));
  });

  it('returns zero when no stale network metadata exists', async () => {
    groupBy.mockResolvedValue([]);
    const { compacted } = await service.pseudonymizeNetworkMetadata(cutoff);
    expect(compacted).toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
