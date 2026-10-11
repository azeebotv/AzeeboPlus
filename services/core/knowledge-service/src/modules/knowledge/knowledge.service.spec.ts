import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  canonicalEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  knowledgeUnit: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  userKnowledgeGrant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  knowledgeDependency: {
    findMany: jest.fn(),
  },
  knowledgeProjection: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  equivalenceSet: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  contentCheckpoint: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [KnowledgeService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  describe('createCanonicalEvent', () => {
    it('should create a canonical event', async () => {
      const input = {
        eventCode: 'S01E01_AIR',
        title: 'Pilot Episode Airs',
        universeId: 'universe-1',
        eventDate: new Date('2026-01-01'),
      };
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue(null);
      mockPrisma.canonicalEvent.create.mockResolvedValue({
        id: 'event-1',
        ...input,
        version: 1,
      });

      const result = await service.createCanonicalEvent(input);

      expect(result.id).toBe('event-1');
      expect(mockPrisma.canonicalEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventCode: 'S01E01_AIR',
          title: 'Pilot Episode Airs',
        }),
      });
    });

    it('should throw if event code already exists', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createCanonicalEvent({
          eventCode: 'DUP_CODE',
          title: 'Duplicate',
          universeId: 'u1',
          eventDate: new Date(),
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCanonicalEvent', () => {
    it('should return a canonical event', async () => {
      const event = {
        id: 'event-1',
        title: 'Test Event',
        knowledgeUnits: [] as Array<{ id: string; title: string }>,
        contentCheckpoints: [] as Array<{ id: string; title: string }>,
      };
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue(event);

      const result = await service.getCanonicalEvent('event-1');
      expect(result.id).toBe('event-1');
    });

    it('should throw NotFoundException for missing event', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue(null);

      await expect(service.getCanonicalEvent('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createKnowledgeUnit', () => {
    it('should create a knowledge unit', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrisma.knowledgeUnit.create.mockResolvedValue({
        id: 'unit-1',
        title: 'Episode 1 Fact',
        knowledgeType: 'fact',
      });

      const result = await service.createKnowledgeUnit({
        canonicalEventId: 'event-1',
        title: 'Episode 1 Fact',
        knowledgeType: 'fact',
      });

      expect(result.id).toBe('unit-1');
    });

    it('should throw if parent event not found', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.createKnowledgeUnit({
          canonicalEventId: 'nonexistent',
          title: 'Test',
          knowledgeType: 'fact',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('grantKnowledge', () => {
    it('should grant knowledge to a user', async () => {
      mockPrisma.userKnowledgeGrant.findUnique.mockResolvedValue(null);
      mockPrisma.userKnowledgeGrant.create.mockResolvedValue({
        id: 'grant-1',
        userId: 'user-1',
        knowledgeUnitId: 'unit-1',
        grantSource: 'checkpoint',
      });

      const result = await service.grantKnowledge({
        userId: 'user-1',
        knowledgeUnitId: 'unit-1',
        grantSource: 'checkpoint',
      });

      expect(result.userId).toBe('user-1');
    });

    it('should return existing grant if already granted', async () => {
      const existing = { id: 'grant-existing', userId: 'user-1', knowledgeUnitId: 'unit-1' };
      mockPrisma.userKnowledgeGrant.findUnique.mockResolvedValue(existing);

      const result = await service.grantKnowledge({
        userId: 'user-1',
        knowledgeUnitId: 'unit-1',
        grantSource: 'checkpoint',
      });

      expect(result.id).toBe('grant-existing');
      expect(mockPrisma.userKnowledgeGrant.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserKnownUnitIds', () => {
    it('should return array of known unit IDs', async () => {
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([
        { knowledgeUnitId: 'unit-1' },
        { knowledgeUnitId: 'unit-2' },
      ]);

      const result = await service.getUserKnownUnitIds('user-1');
      expect(result).toEqual(['unit-1', 'unit-2']);
    });
  });

  describe('computeKnowledgeProjection', () => {
    it('should upsert projection with known units', async () => {
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([
        { knowledgeUnitId: 'u1' },
        { knowledgeUnitId: 'u2' },
      ]);
      mockPrisma.knowledgeProjection.upsert.mockResolvedValue({
        userId: 'user-1',
        knownUnitIds: ['u1', 'u2'],
        projectionVersion: 1,
        lastComputedAt: new Date(),
      });

      const result = await service.computeKnowledgeProjection('user-1');
      expect(result.knownUnitIds).toEqual(['u1', 'u2']);
      expect(mockPrisma.knowledgeProjection.upsert).toHaveBeenCalled();
    });
  });

  describe('filterBySpoilerLevel', () => {
    it('should filter out units above max spoiler level', async () => {
      mockPrisma.knowledgeUnit.findMany.mockResolvedValue([
        { id: 'u1', spoilerLevel: 'none' },
        { id: 'u2', spoilerLevel: 'major' },
        { id: 'u3', spoilerLevel: 'severe' },
      ]);

      const result = await service.filterBySpoilerLevel(['u1', 'u2', 'u3'], 'mild');
      expect(result).toEqual(['u1']);
    });

    it('should include all units when max level is severe', async () => {
      mockPrisma.knowledgeUnit.findMany.mockResolvedValue([
        { id: 'u1', spoilerLevel: 'none' },
        { id: 'u2', spoilerLevel: 'major' },
        { id: 'u3', spoilerLevel: 'severe' },
      ]);

      const result = await service.filterBySpoilerLevel(['u1', 'u2', 'u3'], 'severe');
      expect(result).toEqual(['u1', 'u2', 'u3']);
    });
  });

  describe('correctKnowledgeUnit', () => {
    it('should create corrected version with audit trail', async () => {
      mockPrisma.knowledgeUnit.findUnique.mockResolvedValue({
        id: 'unit-1',
        title: 'Old Title',
        description: 'Old desc',
        canonicalEventId: 'e1',
        knowledgeType: 'fact',
        spoilerLevel: 'none',
        version: 1,
      });
      mockPrisma.knowledgeUnit.create.mockResolvedValue({
        id: 'unit-2',
        title: 'New Title',
        version: 2,
      });

      const result = await service.correctKnowledgeUnit('unit-1', {
        title: 'New Title',
      });

      expect(result.title).toBe('New Title');
      expect(result.version).toBe(2);
    });

    it('should keep original fields when corrections omit them', async () => {
      mockPrisma.knowledgeUnit.findUnique.mockResolvedValue({
        id: 'unit-1',
        title: 'Old Title',
        description: 'Old desc',
        canonicalEventId: 'e1',
        knowledgeType: 'fact',
        spoilerLevel: 'mild',
        version: 3,
      });
      mockPrisma.knowledgeUnit.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'unit-9', ...data })
      );

      const result = await service.correctKnowledgeUnit('unit-1', {
        metadata: { note: 'typo fix' },
      });

      expect(result.title).toBe('Old Title');
      expect(result.description).toBe('Old desc');
      expect(result.version).toBe(4);
      expect(result.metadata).toMatchObject({ correctedFrom: 'unit-1' });
    });

    it('should throw if unit not found', async () => {
      mockPrisma.knowledgeUnit.findUnique.mockResolvedValue(null);

      await expect(service.correctKnowledgeUnit('nonexistent', { title: 'Fixed' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateCanonicalEventVersion', () => {
    it('should bump version and stamp supersededAt', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        version: 2,
        metadata: { source: 'epg' },
      });
      mockPrisma.canonicalEvent.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'event-1', ...data })
      );

      const result = await service.updateCanonicalEventVersion('event-1', {
        reason: 'schedule change',
      });

      expect(result.version).toBe(3);
      const data = mockPrisma.canonicalEvent.update.mock.calls[0][0].data;
      expect(data).toMatchObject({ version: 3 });
      expect(data.metadata).toMatchObject({
        source: 'epg',
        reason: 'schedule change',
        supersededAt: expect.any(String),
      });
    });

    it('should merge into null metadata without crashing', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue({
        id: 'event-1',
        version: 1,
        metadata: null,
      });
      mockPrisma.canonicalEvent.update.mockResolvedValue({ id: 'event-1', version: 2 });

      await service.updateCanonicalEventVersion('event-1');

      const data = mockPrisma.canonicalEvent.update.mock.calls[0][0].data;
      expect(data.metadata).toMatchObject({ supersededAt: expect.any(String) });
    });

    it('should throw if event not found', async () => {
      mockPrisma.canonicalEvent.findUnique.mockResolvedValue(null);

      await expect(service.updateCanonicalEventVersion('missing')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getKnowledgeUnit', () => {
    it('should return a unit with relations', async () => {
      const unit = {
        id: 'unit-1',
        title: 'Fact',
        canonicalEvent: { id: 'event-1' },
        grants: [] as Array<{ id: string }>,
        equivalenceSet: null,
      };
      mockPrisma.knowledgeUnit.findUnique.mockResolvedValue(unit);

      const result = await service.getKnowledgeUnit('unit-1');
      expect(result.id).toBe('unit-1');
      expect(mockPrisma.knowledgeUnit.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'unit-1' } })
      );
    });

    it('should throw NotFoundException for missing unit', async () => {
      mockPrisma.knowledgeUnit.findUnique.mockResolvedValue(null);

      await expect(service.getKnowledgeUnit('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserKnowledge', () => {
    it('should return grants newest-first with unit and event included', async () => {
      const grants = [
        { id: 'grant-2', knowledgeUnit: { canonicalEvent: { id: 'e1' } } },
        { id: 'grant-1', knowledgeUnit: { canonicalEvent: { id: 'e2' } } },
      ];
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue(grants);

      const result = await service.getUserKnowledge('user-1');
      expect(result).toEqual(grants);
      expect(mockPrisma.userKnowledgeGrant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { grantedAt: 'desc' },
        })
      );
    });
  });

  describe('getKnowledgeProjection', () => {
    it('should return the stored projection without recomputing', async () => {
      const stored = {
        userId: 'user-1',
        knownUnitIds: ['u1'],
        projectionVersion: 7,
        lastComputedAt: new Date(),
      };
      mockPrisma.knowledgeProjection.findUnique.mockResolvedValue(stored);

      const result = await service.getKnowledgeProjection('user-1');
      expect(result).toEqual(stored);
      expect(mockPrisma.knowledgeProjection.upsert).not.toHaveBeenCalled();
    });

    it('should compute a projection on first access', async () => {
      mockPrisma.knowledgeProjection.findUnique.mockResolvedValue(null);
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([{ knowledgeUnitId: 'u1' }]);
      mockPrisma.knowledgeProjection.upsert.mockResolvedValue({
        userId: 'user-1',
        knownUnitIds: ['u1'],
        projectionVersion: 1,
        lastComputedAt: new Date(),
      });

      const result = await service.getKnowledgeProjection('user-1');
      expect(result.projectionVersion).toBe(1);
      expect(mockPrisma.knowledgeProjection.upsert).toHaveBeenCalled();
    });
  });

  describe('equivalence sets', () => {
    it('should create an equivalence set connected to units', async () => {
      mockPrisma.equivalenceSet.findUnique.mockResolvedValue(null);
      const created = { id: 'set-1', setCode: 'SET_A', knowledgeUnits: [{ id: 'u1' }] };
      mockPrisma.equivalenceSet.create.mockResolvedValue(created);

      const result = await service.createEquivalenceSet('SET_A', 'Same story', ['u1']);
      expect(result).toEqual(created);
      expect(mockPrisma.equivalenceSet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            knowledgeUnits: { connect: [{ id: 'u1' }] },
          }),
        })
      );
    });

    it('should reject a duplicate set code', async () => {
      mockPrisma.equivalenceSet.findUnique.mockResolvedValue({ id: 'set-1' });

      await expect(service.createEquivalenceSet('SET_A', 'Dup', [])).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return an equivalence set by code', async () => {
      const set = { id: 'set-1', setCode: 'SET_A', knowledgeUnits: [] };
      mockPrisma.equivalenceSet.findUnique.mockResolvedValue(set);

      const result = await service.getEquivalenceSet('SET_A');
      expect(result).toEqual(set);
    });

    it('should throw NotFoundException for missing set', async () => {
      mockPrisma.equivalenceSet.findUnique.mockResolvedValue(null);

      await expect(service.getEquivalenceSet('NOPE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createContentCheckpoint', () => {
    it('should default checkpointType to narrative', async () => {
      const created = { id: 'cp-1', checkpointType: 'narrative' };
      mockPrisma.contentCheckpoint.create.mockResolvedValue(created);

      const result = await service.createContentCheckpoint({
        contentId: 'content-1',
        canonicalEventId: 'event-1',
        title: 'Pilot aired',
      });

      expect(result).toEqual(created);
      expect(mockPrisma.contentCheckpoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ checkpointType: 'narrative' }),
      });
    });

    it('should keep an explicit checkpointType', async () => {
      mockPrisma.contentCheckpoint.create.mockResolvedValue({ id: 'cp-2', checkpointType: 'quiz' });

      await service.createContentCheckpoint({
        contentId: 'content-1',
        canonicalEventId: 'event-1',
        checkpointType: 'quiz',
        title: 'Quiz gate',
      });

      expect(mockPrisma.contentCheckpoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ checkpointType: 'quiz' }),
      });
    });
  });

  describe('triggerCheckpoint', () => {
    const checkpoint = {
      id: 'cp-1',
      grants: [
        { knowledgeUnitId: 'u1' },
        { knowledgeUnitId: 'u2' },
      ],
    };

    it('should grant every knowledge unit on the checkpoint and rebuild projection', async () => {
      mockPrisma.contentCheckpoint.findUnique.mockResolvedValue(checkpoint);
      // u1 is new; u2 was already granted (idempotent re-trigger)
      mockPrisma.userKnowledgeGrant.findUnique.mockImplementation(({ where }) =>
        where.userId_knowledgeUnitId.knowledgeUnitId === 'u2'
          ? Promise.resolve({ id: 'grant-existing' })
          : Promise.resolve(null)
      );
      mockPrisma.userKnowledgeGrant.create.mockResolvedValue({ id: 'grant-new' });
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([
        { knowledgeUnitId: 'u1' },
        { knowledgeUnitId: 'u2' },
      ]);
      mockPrisma.knowledgeProjection.upsert.mockResolvedValue({
        userId: 'user-1',
        knownUnitIds: ['u1', 'u2'],
        projectionVersion: 2,
        lastComputedAt: new Date(),
      });

      const result = await service.triggerCheckpoint('cp-1', 'user-1');

      expect(result).toMatchObject({
        checkpointId: 'cp-1',
        userId: 'user-1',
        grantsAwarded: 2,
        knowledgeUnitIds: ['u1', 'u2'],
      });
      expect(mockPrisma.knowledgeProjection.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing checkpoint', async () => {
      mockPrisma.contentCheckpoint.findUnique.mockResolvedValue(null);

      await expect(service.triggerCheckpoint('missing', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('rebuildKnowledgeProjection', () => {
    it('should delete then recompute the projection', async () => {
      mockPrisma.knowledgeProjection.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([{ knowledgeUnitId: 'u3' }]);
      mockPrisma.knowledgeProjection.upsert.mockResolvedValue({
        userId: 'user-1',
        knownUnitIds: ['u3'],
        projectionVersion: 1,
        lastComputedAt: new Date(),
      });

      const result = await service.rebuildKnowledgeProjection('user-1');

      expect(mockPrisma.knowledgeProjection.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result.knownUnitIds).toEqual(['u3']);
    });
  });

  describe('getKnowledgeSummary', () => {
    it('should report zero progress for anonymous visitors', async () => {
      mockPrisma.knowledgeUnit.count.mockResolvedValue(10);

      const result = await service.getKnowledgeSummary();

      expect(result).toEqual({ totalUnits: 10, unlockedUnits: 0, progress: 0 });
      expect(mockPrisma.userKnowledgeGrant.count).not.toHaveBeenCalled();
    });

    it('should compute rounded progress for a signed-in user', async () => {
      mockPrisma.knowledgeUnit.count.mockResolvedValue(3);
      mockPrisma.userKnowledgeGrant.count.mockResolvedValue(2);

      const result = await service.getKnowledgeSummary('user-1');
      expect(result).toEqual({ totalUnits: 3, unlockedUnits: 2, progress: 67 });
    });

    it('should avoid division by zero on an empty catalogue', async () => {
      mockPrisma.knowledgeUnit.count.mockResolvedValue(0);
      mockPrisma.userKnowledgeGrant.count.mockResolvedValue(0);

      const result = await service.getKnowledgeSummary('user-1');
      expect(result.progress).toBe(0);
    });
  });

  describe('getWhatYouKnow', () => {
    const units = [
      {
        id: 'u1',
        title: 'The betrayal',
        description: 'Who did it',
        knowledgeType: 'plot_point',
      },
      {
        id: 'u2',
        title: 'Hidden vault',
        description: null,
        knowledgeType: 'location',
      },
    ];

    it('should mark every unit locked for anonymous visitors', async () => {
      mockPrisma.knowledgeUnit.findMany.mockResolvedValue(units);

      const result = await service.getWhatYouKnow();

      expect(result.totalUnits).toBe(2);
      expect(result.totalUnlocked).toBe(0);
      expect(result.units.map((u) => u.unlocked)).toEqual([false, false]);
      expect(result.units[0].description).toBe('Who did it');
      expect(result.units[1].description).toBeUndefined();
      expect(result.units[0].unlockedAt).toBeUndefined();
    });

    it('should mark granted units unlocked with a timestamp', async () => {
      const grantedAt = new Date('2026-01-15T10:00:00Z');
      mockPrisma.knowledgeUnit.findMany.mockResolvedValue(units);
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([
        { knowledgeUnitId: 'u1', grantedAt },
      ]);

      const result = await service.getWhatYouKnow('user-1');

      expect(result.totalUnlocked).toBe(1);
      expect(result.units[0]).toMatchObject({
        id: 'u1',
        unlocked: true,
        unlockedAt: grantedAt.toISOString(),
      });
      expect(result.units[1].unlocked).toBe(false);
    });
  });

  describe('getLockedKnowledge', () => {
    it('should list locked units with default hints for anonymous visitors', async () => {
      mockPrisma.knowledgeUnit.findMany.mockResolvedValue([
        {
          id: 'u1',
          title: 'Season finale twist',
          description: null,
          knowledgeType: 'plot_point',
          spoilerLevel: 'major',
        },
        {
          id: 'u2',
          title: 'Mystery artifact',
          description: 'An unknown relic',
          knowledgeType: 'obscura',
          spoilerLevel: 'none',
        },
      ]);
      mockPrisma.knowledgeDependency.findMany.mockResolvedValue([]);

      const result = await service.getLockedKnowledge();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'u1',
        requiredLevel: 3,
        requiredMissions: 0,
        isUnlocked: false,
        unlockHint: 'Unlock by exploring more of the story',
        icon: '🎭',
        description: '',
      });
      // Unknown knowledge type falls back to the default icon
      expect(result[1].icon).toBe('📖');
    });

    it('should surface prerequisite missions and grant status', async () => {
      mockPrisma.knowledgeUnit.findMany
        .mockResolvedValueOnce([
          {
            id: 'u9',
            title: 'The emperor is dead',
            description: 'Big reveal',
            knowledgeType: 'fact',
            spoilerLevel: 'severe',
          },
        ])
        .mockResolvedValueOnce([{ id: 'u1', title: 'Pilot aired' }]);
      mockPrisma.knowledgeDependency.findMany.mockResolvedValue([
        { dependentUnitId: 'u9', dependsOnUnitId: 'u1' },
        { dependentUnitId: 'u9', dependsOnUnitId: 'u2' },
      ]);
      mockPrisma.userKnowledgeGrant.findMany.mockResolvedValue([
        { knowledgeUnitId: 'u9' },
      ]);

      const result = await service.getLockedKnowledge('user-1');

      expect(result[0]).toMatchObject({
        requiredLevel: 4,
        requiredMissions: 2,
        isUnlocked: true,
        unlockHint: 'Requires knowing: Pilot aired',
      });
    });
  });
});
