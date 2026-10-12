import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    wallet: {
      upsert: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
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
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ id: 'sub-1', ...data, submittedAt: new Date() })
        ),
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      update: jest.fn().mockResolvedValue({}),
    },
    challengeSubmissionReviewEvent: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    subscriptionTier: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(({ data }) =>
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
    credit: jest.fn().mockResolvedValue({ success: true, data: { balance: 10250 } }),
    getPayoutRequests: jest
      .fn()
      .mockResolvedValue({ success: true, data: { items: [], total: 0 } }),
    ...wallet,
  };
  const creatorsClient = {
    getChallenges: jest.fn().mockResolvedValue({ success: true, data: { challenges: [] } }),
    getMyChallengeEntries: jest.fn().mockResolvedValue({ success: true, data: { challenges: [] } }),
    participateInChallenge: jest
      .fn()
      .mockResolvedValue({ success: true, data: { entryId: 'entry-1' } }),
    getChallengeLeaderboard: jest.fn().mockResolvedValue({
      success: true,
      data: {
        challenge: { id: 'ch-1', title: 'Dance Marathon', prize: 100 },
        totalEntries: 2,
        entries: [
          {
            position: 1,
            entryId: 'e2',
            userId: 'u2',
            displayName: 'Winner',
            status: 'winner',
            submittedAt: new Date().toISOString(),
          },
          {
            position: 2,
            entryId: 'e1',
            userId: 'u1',
            displayName: 'Rookie',
            status: 'pending',
            submittedAt: new Date().toISOString(),
          },
        ],
      },
    }),
  };
  const mediaClient = {
    forwardUpload: jest.fn().mockResolvedValue(null),
    getSignedPlaybackUrl: jest
      .fn()
      .mockResolvedValue({ url: 'https://signed/x.mp4', expiresIn: 600 }),
    getPremiumUrl: jest.fn().mockResolvedValue(null),
    deleteObject: jest.fn().mockResolvedValue('deleted'),
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

    await expect(service.requestPayout('u1', 100)).rejects.toThrow('Pending payout already exists');
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
    expect(walletClient.debit).toHaveBeenCalledWith(
      'u1',
      250,
      'Payout request',
      expect.any(String)
    );
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
      data: {
        userId: 'u1',
        challengeId: 'ch1',
        title: 'My Entry',
        upstreamId: undefined,
        contentId: undefined,
      },
    });
  });

  describe('attached content (entry picker)', () => {
    function mockContent(overrides: Record<string, unknown> = {}) {
      return {
        id: 'content-1',
        creatorId: 'u1',
        title: 'My Stored Video',
        status: 'draft',
        metadata: { media: { key: 'videos/abc-123.mp4' } },
        ...overrides,
      };
    }

    it('attaches a stored upload: ownership check, upstream contentUrl is the media key, contentId persisted', async () => {
      const prisma = buildPrismaMock();
      prisma.contentItem.findUnique = jest.fn().mockResolvedValue(mockContent());
      const { service, creatorsClient } = buildService(prisma);

      await service.submitChallenge('u1', 'ch1', 'ignored-title', 'content-1');

      expect(creatorsClient.participateInChallenge).toHaveBeenCalledWith(
        'u1',
        'ch1',
        'videos/abc-123.mp4' // real storage key, not the title slug
      );
      expect(prisma.challengeSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'My Stored Video', // content title wins over the free-text title
          contentId: 'content-1',
          upstreamId: 'entry-1',
        }),
      });
    });

    it('rejects attaching content the user does not own', async () => {
      const prisma = buildPrismaMock();
      prisma.contentItem.findUnique = jest
        .fn()
        .mockResolvedValue(mockContent({ creatorId: 'someone-else' }));
      const { service } = buildService(prisma);

      await expect(service.submitChallenge('u1', 'ch1', 'T', 'content-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('rejects attaching metadata-only uploads (no stored media key)', async () => {
      const prisma = buildPrismaMock();
      prisma.contentItem.findUnique = jest.fn().mockResolvedValue(mockContent({ metadata: {} }));
      const { service } = buildService(prisma);

      await expect(service.submitChallenge('u1', 'ch1', 'T', 'content-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('rejects attaching archived content', async () => {
      const prisma = buildPrismaMock();
      prisma.contentItem.findUnique = jest
        .fn()
        .mockResolvedValue(mockContent({ status: 'archived' }));
      const { service } = buildService(prisma);

      await expect(service.submitChallenge('u1', 'ch1', 'T', 'content-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('still submits title-only entries without a content lookup', async () => {
      const prisma = buildPrismaMock();
      const { service, creatorsClient } = buildService(prisma);

      await service.submitChallenge('u1', 'ch1', 'Title Only Entry');

      expect(prisma.contentItem.findUnique).not.toHaveBeenCalled();
      expect(creatorsClient.participateInChallenge).toHaveBeenCalledWith(
        'u1',
        'ch1',
        '/submissions/ch1/title-only-entry'
      );
    });
  });

  it('hydrates upstream entries into the local submissions list', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([]) // initial local read
      .mockResolvedValueOnce([
        {
          id: 'entry-9',
          userId: 'u1',
          challengeId: 'ch9',
          title: 'Title',
          status: 'submitted',
          submittedAt: new Date(),
        },
      ]); // post-hydration read
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'entry-9',
            challengeId: 'ch9',
            contentUrl: '/x/my_cool_video.mp4',
            createdAt: '2026-09-16T00:00:00Z',
          },
        ],
      },
    });

    const rows = (await service.getChallengeSubmissions('u1')) as { title: string; id: string }[];

    expect(prisma.challengeSubmission.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ id: 'entry-9', challengeId: 'ch9', title: 'my cool video' }),
      ],
      skipDuplicates: true,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('entry-9');
  });

  it('returns local submissions untouched when the upstream is unavailable', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'local-1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'T',
        status: 'submitted',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockRejectedValue(new Error('down'));

    const rows = (await service.getChallengeSubmissions('u1')) as unknown[];

    expect(rows).toHaveLength(1);
    expect(prisma.challengeSubmission.createMany).not.toHaveBeenCalled();
  });

  it('pull-syncs upstream review transitions (winner) onto existing rows', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([
        {
          id: 'entry-1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'T',
          status: 'submitted',
          submittedAt: new Date(),
        },
      ]) // initial local read
      .mockResolvedValueOnce([
        {
          id: 'entry-1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'T',
          status: 'winner',
          submittedAt: new Date(),
        },
      ]); // post-sync refetch
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'entry-1',
            challengeId: 'ch1',
            status: 'winner',
            reviewedAt: '2026-09-17T10:00:00.000Z',
            reviewedByName: 'Ada Moderator',
          },
        ],
      },
    });

    const rows = (await service.getChallengeSubmissions('u1')) as { status: string }[];

    expect(prisma.challengeSubmission.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: {
        status: 'winner',
        reviewedAt: new Date('2026-09-17T10:00:00.000Z'),
        reviewedByName: 'Ada Moderator',
        reviewNote: null,
      },
    });
    expect(rows[0].status).toBe('winner');
  });

  it('pull-syncs under_review and rejected transitions', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'submitted',
        submittedAt: new Date(),
      },
      {
        id: 'e2',
        userId: 'u1',
        challengeId: 'ch2',
        title: 'B',
        status: 'submitted',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          { id: 'e1', challengeId: 'ch1', status: 'under_review' },
          { id: 'e2', challengeId: 'ch2', status: 'rejected' },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(prisma.challengeSubmission.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'under_review', reviewedAt: null, reviewedByName: null, reviewNote: null },
    });
    expect(prisma.challengeSubmission.update).toHaveBeenCalledWith({
      where: { id: 'e2' },
      data: { status: 'rejected', reviewedAt: null, reviewedByName: null, reviewNote: null },
    });
  });

  it('treats upstream pending as submitted without a redundant update', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'submitted',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: { challenges: [{ id: 'e1', challengeId: 'ch1', status: 'pending' }] },
    });

    await service.getChallengeSubmissions('u1');

    expect(prisma.challengeSubmission.update).not.toHaveBeenCalled();
  });

  it('updates portal-created rows matched via upstreamId, not just primary id', async () => {
    const prisma = buildPrismaMock();
    // Portal-created row: local uuid ≠ upstream entry id, linked by upstreamId.
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'local-uuid-1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'submitted',
        upstreamId: 'upstream-entry-77',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [{ id: 'upstream-entry-77', challengeId: 'ch1', status: 'under_review' }],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(prisma.challengeSubmission.update).toHaveBeenCalledWith({
      where: { id: 'local-uuid-1' },
      data: { status: 'under_review', reviewedAt: null, reviewedByName: null, reviewNote: null },
    });
  });

  it('appends a review event when a status transition is observed', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'submitted',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'e1',
            challengeId: 'ch1',
            status: 'winner',
            reviewedAt: '2026-09-17T10:00:00.000Z',
            reviewedByName: 'Ada',
          },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(prisma.challengeSubmissionReviewEvent.create).toHaveBeenCalledWith({
      data: {
        submissionId: 'e1',
        fromStatus: 'submitted',
        toStatus: 'winner',
        reviewedAt: new Date('2026-09-17T10:00:00.000Z'),
        reviewedByName: 'Ada',
        note: null,
      },
    });
  });

  it('carries the reviewer note into the row and the history event on transition', async () => {
    const prisma = buildPrismaMock();
    // First findMany: pre-sync read; second: post-sync refetch the service
    // returns so the response reflects the stored note.
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([
        {
          id: 'e1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'A',
          status: 'submitted',
          submittedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'e1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'A',
          status: 'rejected',
          reviewNote: 'Audio quality below contest standard',
          submittedAt: new Date(),
        },
      ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'e1',
            challengeId: 'ch1',
            status: 'rejected',
            reviewedAt: '2026-09-18T09:00:00.000Z',
            reviewedByName: 'Ada',
            reviewNote: 'Audio quality below contest standard',
          },
        ],
      },
    });

    const rows = (await service.getChallengeSubmissions('u1')) as {
      status: string;
      reviewNote: string | null;
    }[];

    expect(prisma.challengeSubmission.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: expect.objectContaining({
        status: 'rejected',
        reviewNote: 'Audio quality below contest standard',
      }),
    });
    expect(prisma.challengeSubmissionReviewEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        toStatus: 'rejected',
        note: 'Audio quality below contest standard',
      }),
    });
    expect(rows[0].reviewNote).toBe('Audio quality below contest standard');
  });

  it('credits the prize to the wallet when a transition to winner is observed', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'submitted',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient, walletClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'e1',
            challengeId: 'ch1',
            status: 'winner',
            reviewedAt: '2026-09-21T10:00:00.000Z',
            challenge: { prize: '₦250,000' },
          },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(walletClient.credit).toHaveBeenCalledWith(
      'u1',
      250000,
      'Challenge prize won',
      'challenge-prize:e1'
    );
    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'earning',
        amount: 250000,
        description: 'Challenge prize won',
        reference: 'challenge-prize:e1',
      }),
    });
  });

  it('credits the prize for hydrated winners (submitted elsewhere)', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([]) // nothing local yet
      .mockResolvedValueOnce([
        {
          id: 'entry-9',
          userId: 'u1',
          challengeId: 'ch9',
          title: 'T',
          status: 'winner',
          submittedAt: new Date(),
        },
      ]);
    const { service, creatorsClient, walletClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'entry-9',
            challengeId: 'ch9',
            status: 'winner',
            challenge: { prize: 500 },
            contentUrl: '/x/v.mp4',
            createdAt: '2026-09-20T00:00:00Z',
          },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(walletClient.credit).toHaveBeenCalledWith(
      'u1',
      500,
      'Challenge prize won',
      'challenge-prize:entry-9'
    );
  });

  it('skips the credit when the mirror row already exists (no double-pay)', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'submitted',
        submittedAt: new Date(),
      },
    ]);
    // Mirror row from a previous sync pass.
    prisma.walletTransaction.findFirst.mockResolvedValue({ id: 'already-paid' });
    const { service, creatorsClient, walletClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          { id: 'e1', challengeId: 'ch1', status: 'winner', challenge: { prize: '₦1,000' } },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(walletClient.credit).not.toHaveBeenCalled();
    expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('skips the credit for unparseable prizes but still records the win', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([
        {
          id: 'e1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'A',
          status: 'submitted',
          submittedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'e1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'A',
          status: 'winner',
          submittedAt: new Date(),
        },
      ]);
    const { service, creatorsClient, walletClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'e1',
            challengeId: 'ch1',
            status: 'winner',
            challenge: { prize: 'Bragging rights' },
          },
        ],
      },
    });

    const rows = (await service.getChallengeSubmissions('u1')) as { status: string }[];

    expect(walletClient.credit).not.toHaveBeenCalled();
    expect(rows[0].status).toBe('winner');
  });

  it('does not fail the sync when the wallet credit errors (self-healing retry)', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([
        {
          id: 'e1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'A',
          status: 'submitted',
          submittedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'e1',
          userId: 'u1',
          challengeId: 'ch1',
          title: 'A',
          status: 'winner',
          submittedAt: new Date(),
        },
      ]);
    const { service, creatorsClient } = buildService(prisma, {
      credit: jest.fn().mockRejectedValue(new Error('wallet down')),
    });
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          { id: 'e1', challengeId: 'ch1', status: 'winner', challenge: { prize: '₦750' } },
        ],
      },
    });

    const rows = (await service.getChallengeSubmissions('u1')) as { status: string }[];

    expect(rows[0].status).toBe('winner');
    expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('does not re-credit a winner already marked locally (idempotent across syncs)', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany.mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        challengeId: 'ch1',
        title: 'A',
        status: 'winner',
        submittedAt: new Date(),
      },
    ]);
    const { service, creatorsClient, walletClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          { id: 'e1', challengeId: 'ch1', status: 'winner', challenge: { prize: '₦500' } },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(walletClient.credit).not.toHaveBeenCalled();
  });

  it('writes baseline history for hydrated entries', async () => {
    const prisma = buildPrismaMock();
    prisma.challengeSubmission.findMany
      .mockResolvedValueOnce([]) // initial local read (nothing yet)
      .mockResolvedValueOnce([
        {
          id: 'entry-9',
          userId: 'u1',
          challengeId: 'ch9',
          title: 'T',
          status: 'winner',
          submittedAt: new Date(),
        },
      ]);
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getMyChallengeEntries.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'entry-9',
            challengeId: 'ch9',
            status: 'winner',
            contentUrl: '/x/v.mp4',
            createdAt: '2026-09-16T00:00:00Z',
          },
        ],
      },
    });

    await service.getChallengeSubmissions('u1');

    expect(prisma.challengeSubmissionReviewEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ submissionId: 'entry-9', fromStatus: null, toStatus: 'winner' }),
      ],
      skipDuplicates: true,
    });
  });
});

describe('CreatorService — submission detail view', () => {
  const baseSubmission = {
    id: 'sub-1',
    userId: 'u1',
    challengeId: 'ch1',
    title: 'My Entry',
    status: 'winner',
    contentId: null as string | null,
    reviewedAt: new Date('2026-09-17T10:00:00.000Z'),
    reviewedByName: 'Ada Moderator',
    submittedAt: new Date('2026-09-16T09:00:00.000Z'),
  };

  it('404s when the submission does not exist or belongs to someone else', async () => {
    const prisma = buildPrismaMock();
    const { service } = buildService(prisma);

    await expect(service.getChallengeSubmissionDetail('u1', 'missing')).rejects.toThrow(
      NotFoundException
    );
  });

  it('returns submission + challenge + synthesized baseline history when no events exist', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findFirst as jest.Mock).mockResolvedValue({ ...baseSubmission });
    const { service, creatorsClient } = buildService(prisma);
    creatorsClient.getChallenges.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'ch1',
            title: 'Dance Marathon',
            prize: '5000',
            status: 'active',
            endDate: '2026-10-01T00:00:00Z',
          },
        ],
      },
    });

    const detail = await service.getChallengeSubmissionDetail('u1', 'sub-1');

    expect(detail.submission.status).toBe('winner');
    expect(detail.challenge).toEqual(
      expect.objectContaining({ id: 'ch1', title: 'Dance Marathon', prize: 5000 })
    );
    // No recorded events → one synthesized baseline row so the timeline is never empty.
    expect(detail.history).toHaveLength(1);
    expect(detail.history[0]).toEqual(
      expect.objectContaining({ toStatus: 'winner', reviewedByName: 'Ada Moderator' })
    );
    expect(detail.content).toBeNull();
    // Prize exists, no tagged payouts yet → awaiting.
    expect(detail.prizePayout).toEqual(
      expect.objectContaining({ status: 'awaiting_payout', prize: 5000 })
    );
  });

  it('returns recorded history events when they exist', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findFirst as jest.Mock).mockResolvedValue({ ...baseSubmission });
    prisma.challengeSubmissionReviewEvent.findMany.mockResolvedValue([
      {
        id: 'ev1',
        fromStatus: null,
        toStatus: 'submitted',
        reviewedAt: null,
        reviewedByName: null,
        note: 'Synced from platform',
        createdAt: new Date('2026-09-16T09:00:00.000Z'),
      },
      {
        id: 'ev2',
        fromStatus: 'submitted',
        toStatus: 'under_review',
        reviewedAt: new Date('2026-09-17T08:00:00.000Z'),
        reviewedByName: 'Ada Moderator',
        note: null,
        createdAt: new Date('2026-09-17T08:00:00.000Z'),
      },
      {
        id: 'ev3',
        fromStatus: 'under_review',
        toStatus: 'winner',
        reviewedAt: new Date('2026-09-17T10:00:00.000Z'),
        reviewedByName: 'Ada Moderator',
        note: null,
        createdAt: new Date('2026-09-17T10:00:00.000Z'),
      },
    ]);
    const { service } = buildService(prisma);

    const detail = await service.getChallengeSubmissionDetail('u1', 'sub-1');

    expect(detail.history).toHaveLength(3);
    expect(detail.history.map((h) => h.toStatus)).toEqual(['submitted', 'under_review', 'winner']);
  });

  it('includes attached content with a signed playback URL and degrades on playback failure', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findFirst as jest.Mock).mockResolvedValue({
      ...baseSubmission,
      contentId: 'content-1',
    });
    // Stored content carries the media key in metadata (the playback flow's
    // key source); the detail view must surface a working signed URL.
    const storedContent = {
      id: 'content-1',
      creatorId: 'u1',
      title: 'My Stored Video',
      type: 'video',
      status: 'published',
      isExclusive: false,
      mediaUrl: 'https://cdn/x.mp4',
      metadata: { media: { key: 'videos/abc-123.mp4' } },
    };
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({ ...storedContent });
    const { service } = buildService(prisma);

    const ok = await service.getChallengeSubmissionDetail('u1', 'sub-1');
    expect(ok.content).toEqual(
      expect.objectContaining({
        id: 'content-1',
        playbackUrl: 'https://signed/x.mp4',
        playbackKind: 'signed',
      })
    );

    // Playback failure → error surfaced, detail still renders.
    const { service: failing } = buildService(
      prisma,
      {},
      {
        getSignedPlaybackUrl: jest.fn().mockResolvedValue(null),
      }
    );
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({ ...storedContent });
    const degraded = await failing.getChallengeSubmissionDetail('u1', 'sub-1');
    expect(degraded.content?.playbackUrl).toBeNull();
    expect(degraded.content?.playbackError).toBeTruthy();
  });

  it('derives prize payout state from tagged payout requests', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findFirst as jest.Mock).mockResolvedValue({ ...baseSubmission });
    const { service, walletClient } = buildService(prisma, {
      getPayoutRequests: jest.fn().mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 'p1', amount: 5000, status: 'completed', metadata: { challengePrize: 'ch1' } },
          ],
          total: 1,
        },
      }),
    });

    const detail = await service.getChallengeSubmissionDetail('u1', 'sub-1');

    expect(walletClient.getPayoutRequests).toHaveBeenCalledWith('u1', 1, 50);
    expect(detail.prizePayout).toEqual(
      expect.objectContaining({ status: 'paid', totalPaid: 5000, payoutIds: ['p1'] })
    );
  });

  it('ignores payouts not tagged for this challenge and reports partial payment', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findFirst as jest.Mock).mockResolvedValue({ ...baseSubmission });
    const { service, creatorsClient } = buildService(prisma, {
      getPayoutRequests: jest.fn().mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'p-other',
              amount: 9000,
              status: 'completed',
              metadata: { challengePrize: 'other-ch' },
            },
            { id: 'p1', amount: 2000, status: 'completed', metadata: { challengePrize: 'ch1' } },
          ],
          total: 2,
        },
      }),
    });
    creatorsClient.getChallenges.mockResolvedValue({
      success: true,
      data: {
        challenges: [
          {
            id: 'ch1',
            title: 'Dance Marathon',
            prize: '5000',
            status: 'active',
            endDate: '2026-10-01T00:00:00Z',
          },
        ],
      },
    });

    const detail = await service.getChallengeSubmissionDetail('u1', 'sub-1');

    // Only the ch1-tagged payout counts → 2000 of 5000 → partially paid.
    expect(detail.prizePayout).toEqual(
      expect.objectContaining({ status: 'partially_paid', totalPaid: 2000, payoutIds: ['p1'] })
    );
  });

  it('returns null payout state when the wallet service is unreachable', async () => {
    const prisma = buildPrismaMock();
    (prisma.challengeSubmission.findFirst as jest.Mock).mockResolvedValue({ ...baseSubmission });
    const { service } = buildService(prisma, {
      getPayoutRequests: jest.fn().mockRejectedValue(new Error('down')),
    });

    const detail = await service.getChallengeSubmissionDetail('u1', 'sub-1');

    expect(detail.prizePayout).toBeNull();
  });
});

describe('CreatorService — playback URLs', () => {
  it('returns a signed URL for own stored content', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      creatorId: 'u1',
      isExclusive: false,
      mediaUrl: 'http://cdn/x.mp4',
      metadata: { media: { key: 'videos/x.mp4' } },
    });
    const { service, mediaClient } = buildService(prisma);

    const result = await service.getPlaybackUrl('u1', 'c1');

    expect(result.kind).toBe('signed');
    expect(result.url).toBe('https://signed/x.mp4');
    expect(result.expiresIn).toBe(600);
    expect(mediaClient.getSignedPlaybackUrl).toHaveBeenCalledWith('videos/x.mp4', 600);
  });

  it('prefers the premium token URL for exclusive content', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      creatorId: 'u1',
      isExclusive: true,
      mediaUrl: null,
      metadata: { media: { key: 'videos/x.mp4' } },
    });
    const { service, mediaClient } = buildService(prisma);
    mediaClient.getPremiumUrl.mockResolvedValue({
      url: 'https://cdn/premium?token=t1',
      expiresIn: 600,
      expiresAt: '2026-09-16T23:00:00Z',
    });

    const result = await service.getPlaybackUrl('u1', 'c1');

    expect(result.kind).toBe('premium');
    expect(result.expiresAt).toBe('2026-09-16T23:00:00Z');
    expect(mediaClient.getPremiumUrl).toHaveBeenCalledWith('c1', 'u1', 600);
    expect(mediaClient.getSignedPlaybackUrl).not.toHaveBeenCalled();
  });

  it('falls back to key-based signing when the premium flow is unavailable', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      creatorId: 'u1',
      isExclusive: true,
      mediaUrl: null,
      metadata: { media: { key: 'videos/x.mp4' } },
    });
    const { service, mediaClient } = buildService(prisma);
    mediaClient.getPremiumUrl.mockResolvedValue(null);

    const result = await service.getPlaybackUrl('u1', 'c1');

    expect(result.kind).toBe('signed');
    expect(mediaClient.getSignedPlaybackUrl).toHaveBeenCalledWith('videos/x.mp4', 600);
  });

  it('404s when the content has no stored media object', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      creatorId: 'u1',
      isExclusive: false,
      mediaUrl: null,
      metadata: {},
    });
    const { service } = buildService(prisma);

    await expect(service.getPlaybackUrl('u1', 'c1')).rejects.toThrow('No stored media');
  });

  it('403s when another creator requests playback', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      creatorId: 'someone-else',
      isExclusive: false,
      mediaUrl: null,
      metadata: {},
    });
    const { service } = buildService(prisma);

    await expect(service.getPlaybackUrl('u1', 'c1')).rejects.toThrow(ForbiddenException);
  });

  it('503s when media-service cannot sign the URL', async () => {
    const prisma = buildPrismaMock();
    (prisma.contentItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      creatorId: 'u1',
      isExclusive: false,
      mediaUrl: 'http://cdn/x.mp4',
      metadata: { media: { key: 'videos/x.mp4' } },
    });
    const { service, mediaClient } = buildService(prisma);
    mediaClient.getSignedPlaybackUrl.mockResolvedValue(null);

    await expect(service.getPlaybackUrl('u1', 'c1')).rejects.toThrow(ServiceUnavailableException);
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

    const rows = (await service.getUploads('u1')) as {
      storage: string;
      scanStatus: string | null;
    }[];

    expect(rows[0].storage).toBe('pending');
    expect(rows[0].scanStatus).toBeNull();
  });

  it('treats legacy rows without pipeline metadata as unknown storage', async () => {
    const prisma = buildPrismaMock();
    prisma.contentItem.findMany.mockResolvedValue([
      {
        id: 'c3',
        title: 'Legacy',
        status: 'published',
        createdAt: new Date(),
        mediaUrl: null,
        metadata: null,
      },
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
    await expect(service.updateCreatorProfile('u1', { displayName: '   ' })).rejects.toThrow(
      BadRequestException
    );
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

describe('CreatorService — delete content blob hook', () => {
  function buildDeletePrisma(content: Record<string, unknown> | null): MockPrisma {
    const prisma = buildPrismaMock();
    prisma.contentItem.findUnique = jest.fn().mockResolvedValue(content);
    return prisma;
  }

  const baseContent = {
    id: 'c1',
    creatorId: 'u1',
    metadata: null as unknown,
  };

  it('archives and deletes the stored blob via media-service', async () => {
    const prisma = buildDeletePrisma({
      ...baseContent,
      metadata: { media: { key: 'videos/abc.mp4' } },
    });
    const { service, mediaClient } = buildService(prisma, undefined, {
      deleteObject: jest.fn().mockResolvedValue('deleted'),
    });

    const result = await service.deleteContent('c1', 'u1');

    expect(result).toBe(true);
    expect(prisma.contentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({
          status: 'archived',
          // Delete-now also stamps the archive time for the hard-delete sweeper.
          archivedAt: expect.any(Date),
        }),
      })
    );
    expect(mediaClient.deleteObject).toHaveBeenCalledWith('videos/abc.mp4');
  });

  it('also deletes the derived object when present, tolerant of one failing', async () => {
    const prisma = buildDeletePrisma({
      ...baseContent,
      metadata: { media: { key: 'videos/abc.mp4', derivedKey: 'thumbs/abc.jpg' } },
    });
    const { service, mediaClient } = buildService(prisma, undefined, {
      deleteObject: jest.fn().mockResolvedValueOnce('deleted').mockResolvedValueOnce(null),
    });

    await service.deleteContent('c1', 'u1');

    expect(mediaClient.deleteObject).toHaveBeenCalledTimes(2);
    expect(mediaClient.deleteObject).toHaveBeenCalledWith('videos/abc.mp4');
    expect(mediaClient.deleteObject).toHaveBeenCalledWith('thumbs/abc.jpg');
  });

  it('does not call media-service for metadata-only content', async () => {
    const prisma = buildDeletePrisma({ ...baseContent, metadata: null });
    const { service, mediaClient } = buildService(prisma, undefined, {
      deleteObject: jest.fn(),
    });

    await expect(service.deleteContent('c1', 'u1')).resolves.toBe(true);
    expect(mediaClient.deleteObject).not.toHaveBeenCalled();
  });

  it('still archives when media-service is unreachable (blob cleanup is best-effort)', async () => {
    const prisma = buildDeletePrisma({
      ...baseContent,
      metadata: { media: { key: 'videos/abc.mp4' } },
    });
    const { service, mediaClient } = buildService(prisma, undefined, {
      deleteObject: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
    });

    await expect(service.deleteContent('c1', 'u1')).resolves.toBe(true);
    expect(prisma.contentItem.update).toHaveBeenCalled();
    expect(mediaClient.deleteObject).toHaveBeenCalledWith('videos/abc.mp4');
  });

  it('still throws NotFound for content the user does not own', async () => {
    const prisma = buildDeletePrisma(null);
    const { service } = buildService(prisma);

    await expect(service.deleteContent('c1', 'u1')).rejects.toThrow(NotFoundException);
  });
});

describe('CreatorService — challenge leaderboard proxy', () => {
  it('passes through the upstream ranked board', async () => {
    const prisma = buildPrismaMock();
    const { service, creatorsClient } = buildService(prisma);

    const board = await service.getChallengeLeaderboard('ch-1');

    expect(creatorsClient.getChallengeLeaderboard).toHaveBeenCalledWith('ch-1');
    expect(board.totalEntries).toBe(2);
    expect(board.entries[0]).toMatchObject({
      position: 1,
      displayName: 'Winner',
      status: 'winner',
    });
    expect(board.challenge.title).toBe('Dance Marathon');
  });

  it('degrades to an empty board when upstream fails', async () => {
    const prisma = buildPrismaMock();
    const { service, creatorsClient } = buildService(prisma);
    (creatorsClient.getChallengeLeaderboard as jest.Mock).mockResolvedValue({
      success: false,
      message: 'upstream down',
    });

    const board = await service.getChallengeLeaderboard('ch-1');

    expect(board).toEqual({
      challenge: { id: 'ch-1', title: 'Challenge' },
      totalEntries: 0,
      entries: [],
    });
  });
});
