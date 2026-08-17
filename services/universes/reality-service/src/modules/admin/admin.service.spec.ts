import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('AdminService auto-elimination (reality_auto_elimination)', () => {
  let service: AdminService;
  let prisma: {
    realityShow: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const showWithContestants = (
    contestants: { id: string; name: string; votes: { quantity: number }[] }[]
  ) => ({
    id: 'show-1',
    name: 'Reality Show',
    metadata: { eliminationRound: 2 },
    contestants,
  });

  beforeEach(() => {
    prisma = {
      realityShow: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new AdminService(prisma as unknown as PrismaService);
  });

  it('throws NotFoundException for an unknown show', async () => {
    prisma.realityShow.findUnique.mockResolvedValue(null);

    await expect(service.autoEliminate('missing-show')).rejects.toThrow(NotFoundException);
    expect(prisma.realityShow.update).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when fewer than 2 contestants remain', async () => {
    prisma.realityShow.findUnique.mockResolvedValue(
      showWithContestants([{ id: 'c1', name: 'Solo', votes: [{ quantity: 5 }] }])
    );

    await expect(service.autoEliminate('show-1')).rejects.toThrow(BadRequestException);
    expect(prisma.realityShow.update).not.toHaveBeenCalled();
  });

  it('eliminates the lowest-voted contestant and records the verdict in metadata', async () => {
    prisma.realityShow.findUnique.mockResolvedValue(
      showWithContestants([
        { id: 'c1', name: 'Top Dog', votes: [{ quantity: 42 }] },
        { id: 'c2', name: 'Also-Ran', votes: [{ quantity: 7 }] },
        { id: 'c3', name: 'Middle', votes: [{ quantity: 21 }] },
      ])
    );
    prisma.realityShow.update.mockResolvedValue({ id: 'show-1' });

    const result = await service.autoEliminate('show-1');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      round: 3, // previous eliminationRound 2 → 3
      contestantId: 'c2',
      contestantName: 'Also-Ran',
      voteCount: 7,
    });
    expect(prisma.realityShow.update).toHaveBeenCalledWith({
      where: { id: 'show-1' },
      data: {
        metadata: expect.objectContaining({
          lastElimination: expect.objectContaining({
            contestantId: 'c2',
            eliminatedAt: expect.any(String),
          }),
          eliminationRound: 3,
        }),
      },
    });
  });

  it('starts at round 1 when the show has no elimination history', async () => {
    prisma.realityShow.findUnique.mockResolvedValue({
      id: 'show-1',
      name: 'Fresh Show',
      metadata: null,
      contestants: [
        { id: 'c1', name: 'A', votes: [{ quantity: 1 }] },
        { id: 'c2', name: 'B', votes: [] },
      ],
    });
    prisma.realityShow.update.mockResolvedValue({ id: 'show-1' });

    const result = await service.autoEliminate('show-1');

    expect(result.data.round).toBe(1);
    expect(result.data.contestantId).toBe('c2');
  });
});
