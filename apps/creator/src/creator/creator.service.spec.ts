import { BadRequestException } from '@nestjs/common';
import { CreatorService } from './creator.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockPrisma = Record<string, any>;

function buildPrismaMock(): MockPrisma {
  // creatorProfile is stateful: upsert stores the profile, findUnique reads it
  // back (updateMonetization re-reads after persisting).
  let storedProfile: Record<string, unknown> | null = null;
  return {
    contentItem: {
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null, viewCount: null } }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    universe: {
      findUnique: jest.fn().mockResolvedValue({ id: 'univ-1' }),
    },
    walletTransaction: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    creatorProfile: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(storedProfile)),
      create: jest.fn().mockImplementation(({ data }) => {
        storedProfile = {
          id: 'profile-1',
          userId: data.userId,
          tipEnabled: true,
          tipMin: 1,
          tipMax: 100,
          payoutMethod: null,
          minimumPayout: null,
          bio: null,
          banner: null,
          socialLinks: null,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return Promise.resolve(storedProfile);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        storedProfile = {
          id: 'profile-1',
          userId: where.userId,
          tipEnabled: update.tipEnabled ?? create.tipEnabled ?? true,
          tipMin: update.tipMin ?? create.tipMin ?? 1,
          tipMax: update.tipMax ?? create.tipMax ?? 100,
          payoutMethod: update.payoutMethod ?? create.payoutMethod ?? 'bank_transfer',
          minimumPayout: update.minimumPayout ?? null,
          bio: create.bio ?? update.bio ?? null,
          banner: create.banner ?? update.banner ?? null,
          socialLinks: create.socialLinks ?? update.socialLinks ?? null,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return Promise.resolve(storedProfile);
      }),
    },
    payoutRequest: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'payout-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    challengeSubmission: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'sub-1', ...data, submittedAt: new Date() })
      ),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockRejectedValue(new Error('relation "following" does not exist')),
    $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('relation "following" does not exist')),
  } as MockPrisma;
}

function buildService(prisma: MockPrisma, wallet?: Partial<Record<string, unknown>>) {
  const walletClient = {
    getWallet: jest.fn().mockResolvedValue({ success: true, data: { id: 'w1', balance: 1000 } }),
    debit: jest.fn().mockResolvedValue({ success: true }),
    ...wallet,
  };
  const creatorsClient = {
    getChallenges: jest.fn().mockResolvedValue({ success: true, data: { challenges: [] } }),
  };
  const service = new CreatorService(
    prisma as never,
    walletClient as never,
    creatorsClient as never
  );
  return { service, walletClient, creatorsClient };
}

describe('CreatorService — monetization', () => {
  it('persists tip settings and returns the merged shape', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const result = await service.updateMonetization('u1', {
      tipEnabled: true,
      tipMin: 5,
      tipMax: 50,
      payoutMethod: 'paypal',
    });

    expect(prisma.creatorProfile.upsert).toHaveBeenCalled();
    expect(result.tipEnabled).toBe(true);
    expect(result.tipMin).toBe(5);
    expect(result.tipMax).toBe(50);
    expect(result.payoutMethod).toBe('paypal');
    // Mobile aliases mirror the portal fields
    expect(result.isTipEnabled).toBe(true);
    expect(result.minimumTip).toBe(5);
  });

  it('accepts the mobile aliases (isTipEnabled / minimumTip)', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const result = await service.updateMonetization('u1', {
      isTipEnabled: false,
      minimumTip: 2,
    });

    expect(result.tipEnabled).toBe(false);
    expect(result.tipMin).toBe(2);
  });

  it('rejects an invalid payout method', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(
      service.updateMonetization('u1', { payoutMethod: 'carrier_pigeon' })
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects max tip below min tip', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(service.updateMonetization('u1', { tipMin: 20, tipMax: 10 })).rejects.toThrow(
      BadRequestException
    );
  });

  it('rejects a negative minimum tip', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(service.updateMonetization('u1', { tipMin: -1 })).rejects.toThrow(
      BadRequestException
    );
  });
});

describe('CreatorService — payouts', () => {
  it('rejects a request when a pending payout already exists', async () => {
    const prisma = buildPrismaMock();
    (prisma.payoutRequest.findFirst as jest.Mock).mockResolvedValue({ id: 'p0' });
    (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({ userId: 'u1' });
    const { service } = buildService(prisma);

    await expect(service.requestPayout('u1', 100)).rejects.toThrow(
      'Pending payout already exists'
    );
  });

  it('rejects an invalid payout method', async () => {
    const prisma = buildPrismaMock();
    (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({ userId: 'u1' });
    const { service } = buildService(prisma);

    await expect(service.requestPayout('u1', 100, 'cash')).rejects.toThrow('Invalid payout method');
  });

  it('rejects an amount above the wallet balance', async () => {
    const prisma = buildPrismaMock();
    (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u1',
      minimumPayout: null,
    });
    const { service, walletClient } = buildService(prisma);
    (walletClient.getWallet as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'w1', balance: 100 },
    });

    await expect(service.requestPayout('u1', 500)).rejects.toThrow('Insufficient balance');
    expect(walletClient.debit).not.toHaveBeenCalled();
  });

  it('honors the profile minimum payout', async () => {
    const prisma = buildPrismaMock();
    (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u1',
      minimumPayout: 50,
    });
    const { service } = buildService(prisma);

    await expect(service.requestPayout('u1', 10)).rejects.toThrow('must be at least 50');
  });

  it('creates a payout and debits the wallet on the happy path', async () => {
    const prisma = buildPrismaMock();
    (prisma.creatorProfile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'u1',
      minimumPayout: null,
    });
    const { service, walletClient } = buildService(prisma);

    const result = await service.requestPayout('u1', 250, 'paypal');

    expect(result.success).toBe(true);
    expect(walletClient.debit).toHaveBeenCalledWith('w1', 250, 'Payout request', expect.any(String));
    expect(prisma.payoutRequest.create).toHaveBeenCalledWith({
      data: { userId: 'u1', amount: 250, status: 'pending', method: 'paypal' },
    });
  });
});

describe('CreatorService — uploads', () => {
  it('rejects uploads without a title', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(service.createUpload('u1', { title: '   ' })).rejects.toThrow('Title is required');
  });

  it('registers an upload as a draft content item', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.create as jest.Mock).mockResolvedValue({
      id: 'c1',
      title: 'My Video',
      createdAt: new Date(),
    });
    const { service } = buildService(prisma);

    const item = await service.createUpload('u1', { title: 'My Video', type: 'video' });

    expect(item.status).toBe('processing');
    expect(prisma.contentItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ creatorId: 'u1', status: 'draft' }),
      })
    );
  });
});

describe('CreatorService — challenge submissions', () => {
  it('rejects a blank submission title', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(service.submitChallenge('u1', 'ch1', '  ')).rejects.toThrow(
      'Submission title is required'
    );
  });

  it('rejects duplicate submissions to the same challenge', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findUnique as jest.Mock).mockResolvedValue({ id: 'dup' });
    const { service } = buildService(prisma);

    await expect(service.submitChallenge('u1', 'ch1', 'Entry')).rejects.toThrow(
      'Already submitted to this challenge'
    );
  });

  it('stores a valid submission locally', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const result = await service.submitChallenge('u1', 'ch1', 'My Entry');

    expect(result.success).toBe(true);
    expect(prisma.challengeSubmission.create).toHaveBeenCalledWith({
      data: { userId: 'u1', challengeId: 'ch1', title: 'My Entry' },
    });
  });
});

describe('CreatorService — profile', () => {
  it('rejects an empty display name', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(
      service.updateCreatorProfile('u1', { displayName: '   ' })
    ).rejects.toThrow(BadRequestException);
  });

  it('persists bio/socials on the profile and name/avatar on the user', async () => {
    const prisma = buildPrismaMock();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      displayName: 'New Name',
      avatar: 'https://x/img.png',
      email: 'a@b.c',
    });
    const { service } = buildService(prisma);

    const result = await service.updateCreatorProfile('u1', {
      displayName: 'New Name',
      avatar: 'https://x/img.png',
      bio: 'Creator bio',
      website: 'https://me.com',
      socialLinks: { twitter: '@me' },
    });

    expect(prisma.creatorProfile.upsert).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ displayName: 'New Name', avatar: 'https://x/img.png' }),
      })
    );
    expect(result.displayName).toBe('New Name');
    expect((result.socialLinks as Record<string, string>).website).toBe('https://me.com');
  });
});
