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
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    subscriptionTier: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 'tier-1', ...data, createdAt: new Date(), updatedAt: new Date() })
      ),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    $queryRaw: jest.fn().mockRejectedValue(new Error('relation "following" does not exist')),
    $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('relation "following" does not exist')),
  } as MockPrisma;
}

function buildService(
  prisma: MockPrisma,
  wallet?: Partial<Record<string, unknown>>,
  media?: Partial<Record<string, unknown>>
) {
  const walletClient = {
    getWallet: jest.fn().mockResolvedValue({ success: true, data: { id: 'w1', balance: 1000 } }),
    debit: jest.fn().mockResolvedValue({ success: true }),
    ...wallet,
  };
  const creatorsClient = {
    getChallenges: jest.fn().mockResolvedValue({ success: true, data: { challenges: [] } }),
    getMyChallengeEntries: jest.fn().mockResolvedValue({ success: true, data: { challenges: [] } }),
    participateInChallenge: jest.fn().mockResolvedValue({ success: true, data: { entryId: 'entry-1' } }),
  };
  const mediaClient = {
    forwardUpload: jest.fn().mockResolvedValue(null),
    ...media,
  };
  const service = new CreatorService(
    prisma as never,
    walletClient as never,
    creatorsClient as never,
    mediaClient as never
  );
  return { service, walletClient, creatorsClient, mediaClient };
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

    expect(result.success).toBe(true);      expect(walletClient.debit).toHaveBeenCalledWith('u1', 250, 'Payout request', expect.any(String));
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

  it('forwards the file to the media pipeline and persists the stored object', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.create as jest.Mock).mockResolvedValue({
      id: 'c2',
      title: 'My Video',
      createdAt: new Date(),
    });
    const media = {
      forwardUpload: jest.fn().mockResolvedValue({
        key: 'videos/abc.mp4',
        url: 'https://s3/azeebo-media/videos/abc.mp4',
        cdnUrl: 'https://cdn/videos/abc.mp4',
        filename: 'abc.mp4',
        mimetype: 'video/mp4',
        size: 1234,
        scanStatus: 'clean' as const,
      }),
    };
    const { service, mediaClient } = buildService(prisma, undefined, media);

    const file = {
      buffer: Buffer.from('video-bytes'),
      originalname: 'clip.mp4',
      mimetype: 'video/mp4',
      size: 1234,
    };
    await service.createUpload('u1', { title: 'My Video', type: 'video' }, file as never);

    expect(mediaClient.forwardUpload).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'clip.mp4', mimetype: 'video/mp4' })
    );
    expect(prisma.contentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c2' },
        data: expect.objectContaining({
          mediaUrl: 'https://cdn/videos/abc.mp4',
          metadata: expect.objectContaining({
            media: expect.objectContaining({ key: 'videos/abc.mp4', scanStatus: 'clean' }),
          }),
        }),
      })
    );
  });

  it('degrades to a metadata-only record when the media pipeline is unavailable', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.create as jest.Mock).mockResolvedValue({
      id: 'c3',
      title: 'My Video',
      createdAt: new Date(),
    });
    const { service } = buildService(prisma); // forwardUpload resolves null

    const file = {
      buffer: Buffer.from('video-bytes'),
      originalname: 'clip.mp4',
      mimetype: 'video/mp4',
      size: 1234,
    };
    await service.createUpload('u1', { title: 'My Video', type: 'video' }, file as never);

    expect(prisma.contentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            upload: expect.objectContaining({ storage: 'pending' }),
          }),
        }),
      })
    );
  });
});

describe('CreatorService — subscription tiers', () => {
  it('rejects a tier without a name or with a negative price', async () => {
    const { service } = buildService(buildPrismaMock());
    await expect(service.createSubscriptionTier('u1', { name: '  ', price: 5 })).rejects.toThrow(
      'Tier name is required'
    );
    await expect(service.createSubscriptionTier('u1', { name: 'Gold', price: -1 })).rejects.toThrow(
      'Price must be a non-negative number'
    );
  });

  it('creates a tier with sanitized perks and default state', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    const tier = await service.createSubscriptionTier('u1', {
      name: 'Gold',
      price: 1500,
      perks: ['Early access', '  Early access  ', '', '<b>BTS</b>'],
    });

    expect(tier.name).toBe('Gold');
    expect(tier.price).toBe(1500);
    expect(tier.perks).toEqual(['Early access', 'BTS']);
    expect(tier.isActive).toBe(true);
    expect(tier.subscriberCount).toBe(0);
    expect(prisma.subscriptionTier.create).toHaveBeenCalled();
  });

  it('derives subscriber counts from active platform subscriptions', async () => {
    const prisma = buildPrismaMock();
    (prisma.subscriptionTier.findMany as jest.Mock).mockResolvedValue([
      {
        id: 't1',
        name: 'Gold',
        price: 1500,
        perks: ['Early access'],
        isActive: true,
        displayOrder: 0,
      },
      {
        id: 't2',
        name: 'Silver',
        price: 500,
        perks: [],
        isActive: true,
        displayOrder: 1,
      },
    ]);
    (prisma.$queryRaw as jest.Mock).mockImplementation((parts: TemplateStringsArray) => {
      const sql = parts.join('');
      if (sql.includes('GROUP BY tier')) {
        return Promise.resolve([{ tier: 'gold', count: 7 }]);
      }
      return Promise.reject(new Error('relation "following" does not exist'));
    });
    const { service } = buildService(prisma);

    const tiers = await service.getSubscriptionTiers('u1');

    expect(tiers.find((t) => t.name === 'Gold')?.subscriberCount).toBe(7);
    expect(tiers.find((t) => t.name === 'Silver')?.subscriberCount).toBe(0);
  });

  it('blocks deleting a tier that still has active subscribers', async () => {
    const prisma = buildPrismaMock();
    (prisma.subscriptionTier.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      creatorId: 'u1',
      name: 'Gold',
    });
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 3 }]);
    const { service } = buildService(prisma);

    await expect(service.deleteSubscriptionTier('u1', 't1')).rejects.toThrow(
      'Tier has active subscribers'
    );
    expect(prisma.subscriptionTier.delete).not.toHaveBeenCalled();
  });

  it('refuses to update or delete another creator\u2019s tier', async () => {
    const prisma = buildPrismaMock();
    (prisma.subscriptionTier.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      creatorId: 'someone-else',
      name: 'Gold',
    });
    const { service } = buildService(prisma);

    await expect(service.updateSubscriptionTier('u1', 't1', { price: 99 })).rejects.toThrow(
      'Subscription tier not found'
    );
    await expect(service.deleteSubscriptionTier('u1', 't1')).rejects.toThrow(
      'Subscription tier not found'
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

  it('stores a valid submission locally and syncs upstream', async () => {
    const prisma = buildPrismaMock();
    const { service, creatorsClient } = buildService(prisma);

    const result = await service.submitChallenge('u1', 'ch1', 'My Entry');

    expect(result.success).toBe(true);
    expect(result.synced).toBe(true);
    expect(result.entryId).toBe('entry-1');
    expect(creatorsClient.participateInChallenge).toHaveBeenCalledWith(
      'u1',
      'ch1',
      expect.stringContaining('/submissions/ch1/')
    );
    expect(prisma.challengeSubmission.create).toHaveBeenCalledWith({
      data: { userId: 'u1', challengeId: 'ch1', title: 'My Entry', upstreamId: 'entry-1' },
    });
  });

  it('still records the submission locally when the upstream sync fails', async () => {
    const prisma = buildPrismaMock();
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.participateInChallenge.mockRejectedValue(new Error('upstream down'));

    const result = await service.submitChallenge('u1', 'ch1', 'My Entry');

    expect(result.success).toBe(true);
    expect(result.synced).toBe(false);
    expect(result.entryId).toBeUndefined();
    expect(prisma.challengeSubmission.create).toHaveBeenCalledWith({
      data: { userId: 'u1', challengeId: 'ch1', title: 'My Entry', upstreamId: undefined },
    });
  });

  it('hydrates upstream entries into the local submissions list', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([]) // initial local read
      .mockResolvedValueOnce([{ id: 'entry-9', userId: 'u1', challengeId: 'ch9', title: 'Title', status: 'submitted', submittedAt: new Date() }]); // post-hydration read
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          { id: 'entry-9', challengeId: 'ch9', contentUrl: '/x/my_cool_video.mp4', createdAt: '2026-09-16T00:00:00Z' },
        ],
      },
    });

    const rows = (await service.getChallengeSubmissions('u1')) as { title: string; id: string }[];

    expect(prisma.challengeSubmission.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ id: 'entry-9', challengeId: 'ch9', title: 'my cool video' })],
      skipDuplicates: true,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('entry-9');
  });

  it('returns local submissions untouched when the upstream is unavailable', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      { id: 'local-1', userId: 'u1', challengeId: 'ch1', title: 'T', status: 'submitted', submittedAt: new Date() },
    ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockRejectedValue(new Error('down'));

    const rows = (await service.getChallengeSubmissions('u1')) as unknown[];

    expect(rows).toHaveLength(1);
    expect(prisma.challengeSubmission.createMany).not.toHaveBeenCalled();
  });
});

describe('CreatorService — upload storage status', () => {
  it('reports stored uploads with their scan verdict', async () => {
    const prisma = buildPrismaMock();
    prisma.contentItem.findMany.mockResolvedValue([
      {
        id: 'c1',
        title: 'Stored',
        status: 'draft',
        createdAt: new Date(),
        mediaUrl: 'http://cdn/x.mp4',
        metadata: { media: { key: 'videos/x.mp4', scanStatus: 'clean' }, upload: {} },
      },
    ]);
    const { service } = buildService(prisma);

    const rows = (await service.getUploads('u1')) as { storage: string; scanStatus: string }[];

    expect(rows[0].storage).toBe('stored');
    expect(rows[0].scanStatus).toBe('clean');
  });

  it('flags metadata-only registrations as pending re-upload', async () => {
    const prisma = buildPrismaMock();
    prisma.contentItem.findMany.mockResolvedValue([
      {
        id: 'c2',
        title: 'Pending',
        status: 'draft',
        createdAt: new Date(),
        mediaUrl: null,
        metadata: { upload: { storage: 'pending' } },
      },
    ]);
    const { service } = buildService(prisma);

    const rows = (await service.getUploads('u1')) as { storage: string; scanStatus: string | null }[];

    expect(rows[0].storage).toBe('pending');
    expect(rows[0].scanStatus).toBeNull();
  });

  it('treats legacy rows without pipeline metadata as unknown storage', async () => {
    const prisma = buildPrismaMock();
    prisma.contentItem.findMany.mockResolvedValue([
      { id: 'c3', title: 'Legacy', status: 'published', createdAt: new Date(), mediaUrl: null, metadata: null },
    ]);
    const { service } = buildService(prisma);

    const rows = (await service.getUploads('u1')) as { storage: string; status: string }[];

    expect(rows[0].storage).toBe('unknown');
    expect(rows[0].status).toBe('completed');
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
