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
  },
  userKnowledgeGrant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
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
      providers: [
        KnowledgeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
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
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCanonicalEvent', () => {
    it('should return a canonical event', async () => {
      const event = { id: 'event-1', title: 'Test Event', knowledgeUnits: [], contentCheckpoints: [] };
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
        }),
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

    it('should throw if unit not found', async () => {
      mockPrisma.knowledgeUnit.findUnique.mockResolvedValue(null);

      await expect(
        service.correctKnowledgeUnit('nonexistent', { title: 'Fixed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
