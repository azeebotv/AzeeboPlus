import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AgbalaAdminService } from '../agbala-admin.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * Unit tests for the Agbala admin CRUD service — the upstream that backs the
 * admin console's paths/quizzes/moderation forms. Prisma is mocked; the
 * contract under test is: envelope shape ({ success, data }), 404s on missing
 * entities, and state transitions in the theory moderation queue.
 */
describe('AgbalaAdminService', () => {
  let service: AgbalaAdminService;

  const prismaMock = {
    universeMap: { findUnique: jest.fn() },
    storyworldPath: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    agbalaQuiz: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    theory: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgbalaAdminService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get<AgbalaAdminService>(AgbalaAdminService);
  });

  // ── Paths ────────────────────────────────────────────────────────────────

  describe('createPath', () => {
    it('creates a path with DTO fields and defaults', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue({ id: 'sw-1' });
      prismaMock.storyworldPath.create.mockResolvedValue({
        id: 'p-1',
        storyworldId: 'sw-1',
        name: 'Foundations',
        totalSteps: 5,
        sortOrder: 0,
      });

      const res = await service.createPath('sw-1', { name: 'Foundations' });

      expect(prismaMock.storyworldPath.create).toHaveBeenCalledWith({
        data: {
          storyworldId: 'sw-1',
          name: 'Foundations',
          description: undefined,
          icon: undefined,
          color: undefined,
          totalSteps: 5,
          sortOrder: 0,
        },
      });
      expect(res).toEqual({
        success: true,
        data: { id: 'p-1', storyworldId: 'sw-1', name: 'Foundations', totalSteps: 5, sortOrder: 0 },
      });
    });

    it('throws NotFound when the storyworld does not exist', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue(null);
      await expect(service.createPath('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
      expect(prismaMock.storyworldPath.create).not.toHaveBeenCalled();
    });
  });

  describe('getPaths', () => {
    it("lists a storyworld's paths in a paginated envelope, ordered by sortOrder then newest", async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue({ id: 'sw-1' });
      prismaMock.storyworldPath.findMany.mockResolvedValue([
        { id: 'p-1', storyworldId: 'sw-1', sortOrder: 0 },
        { id: 'p-2', storyworldId: 'sw-1', sortOrder: 1 },
      ]);
      prismaMock.storyworldPath.count.mockResolvedValue(2);

      const res = await service.getPaths({ storyworldId: 'sw-1' });

      expect(prismaMock.universeMap.findUnique).toHaveBeenCalledWith({ where: { id: 'sw-1' } });
      expect(prismaMock.storyworldPath.findMany).toHaveBeenCalledWith({
        where: { storyworldId: 'sw-1' },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: 0,
        take: 20,
      });
      expect(res).toEqual({
        success: true,
        data: {
          items: [
            { id: 'p-1', storyworldId: 'sw-1', sortOrder: 0 },
            { id: 'p-2', storyworldId: 'sw-1', sortOrder: 1 },
          ],
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('applies case-insensitive search on name and description', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue({ id: 'sw-1' });
      prismaMock.storyworldPath.findMany.mockResolvedValue([]);
      prismaMock.storyworldPath.count.mockResolvedValue(0);

      await service.getPaths({ storyworldId: 'sw-1', search: '  FoundAtions  ' });

      expect(prismaMock.storyworldPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            storyworldId: 'sw-1',
            OR: [
              { name: { contains: 'FoundAtions', mode: 'insensitive' } },
              { description: { contains: 'FoundAtions', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('honors requested page and limit within the 1..100 clamp', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue({ id: 'sw-1' });
      prismaMock.storyworldPath.findMany.mockResolvedValue([]);
      prismaMock.storyworldPath.count.mockResolvedValue(0);

      await service.getPaths({ storyworldId: 'sw-1', page: 3, limit: 500 });

      // limit clamps to 100; skip = (page-1) × clamped limit = 2 × 100
      expect(prismaMock.storyworldPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 200, take: 100 })
      );
    });

    it('throws NotFound when the storyworld does not exist', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue(null);
      await expect(service.getPaths({ storyworldId: 'missing' })).rejects.toThrow(
        NotFoundException
      );
      expect(prismaMock.storyworldPath.findMany).not.toHaveBeenCalled();
    });
  });

  describe('updatePath / deletePath', () => {
    it('updates an existing path', async () => {
      prismaMock.storyworldPath.findUnique.mockResolvedValue({ id: 'p-1' });
      prismaMock.storyworldPath.update.mockResolvedValue({ id: 'p-1', totalSteps: 4 });

      const res = await service.updatePath('p-1', { totalSteps: 4 });

      expect(prismaMock.storyworldPath.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: { totalSteps: 4 },
      });
      expect(res.data).toEqual({ id: 'p-1', totalSteps: 4 });
    });

    it('throws NotFound when updating a missing path', async () => {
      prismaMock.storyworldPath.findUnique.mockResolvedValue(null);
      await expect(service.updatePath('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('deletes an existing path', async () => {
      prismaMock.storyworldPath.findUnique.mockResolvedValue({ id: 'p-1' });
      prismaMock.storyworldPath.delete.mockResolvedValue({ id: 'p-1' });

      const res = await service.deletePath('p-1');

      expect(prismaMock.storyworldPath.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
      expect(res).toEqual({ success: true, data: { id: 'p-1', deleted: true } });
    });

    it('throws NotFound when deleting a missing path', async () => {
      prismaMock.storyworldPath.findUnique.mockResolvedValue(null);
      await expect(service.deletePath('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Quizzes ──────────────────────────────────────────────────────────────

  describe('getQuizzes', () => {
    it('returns a paginated envelope with questionCount', async () => {
      prismaMock.agbalaQuiz.findMany.mockResolvedValue([
        {
          id: 'q-1',
          title: 'Orisa Basics',
          description: null,
          storyworldId: 'sw-1',
          questions: [{ question: 'a' }, { question: 'b' }],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
        },
      ]);
      prismaMock.agbalaQuiz.count.mockResolvedValue(1);

      const res = await service.getQuizzes({ storyworldId: 'sw-1', page: 1, limit: 20 });

      expect(res.success).toBe(true);
      expect(res.data.items[0]).toMatchObject({ id: 'q-1', questionCount: 2 });
      expect(res.data.total).toBe(1);
      expect(res.data.totalPages).toBe(1);
    });

    it('filters by storyworldId when provided', async () => {
      prismaMock.agbalaQuiz.findMany.mockResolvedValue([]);
      prismaMock.agbalaQuiz.count.mockResolvedValue(0);

      await service.getQuizzes({ storyworldId: 'sw-9' });

      expect(prismaMock.agbalaQuiz.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { storyworldId: 'sw-9' } })
      );
    });
  });

  describe('createQuiz', () => {
    it('creates a quiz and validates the storyworld when scoped', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue({ id: 'sw-1' });
      prismaMock.agbalaQuiz.create.mockResolvedValue({ id: 'q-1', title: 'Quiz' });

      const res = await service.createQuiz({
        title: 'Quiz',
        storyworldId: 'sw-1',
        questions: [{ question: 'q', options: ['a', 'b'], correctAnswerIndex: 0 }],
      });

      expect(prismaMock.agbalaQuiz.create).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    it('throws NotFound when the quiz storyworld is missing', async () => {
      prismaMock.universeMap.findUnique.mockResolvedValue(null);
      await expect(
        service.createQuiz({
          title: 'Quiz',
          storyworldId: 'missing',
          questions: [{ question: 'q', options: ['a'], correctAnswerIndex: 0 }],
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes an existing quiz', async () => {
      prismaMock.agbalaQuiz.findUnique.mockResolvedValue({ id: 'q-1' });
      prismaMock.agbalaQuiz.delete.mockResolvedValue({ id: 'q-1' });

      const res = await service.deleteQuiz('q-1');

      expect(prismaMock.agbalaQuiz.delete).toHaveBeenCalledWith({ where: { id: 'q-1' } });
      expect(res).toEqual({ success: true, data: { id: 'q-1', deleted: true } });
    });

    it('throws NotFound when deleting a missing quiz', async () => {
      prismaMock.agbalaQuiz.findUnique.mockResolvedValue(null);
      await expect(service.deleteQuiz('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Moderation ───────────────────────────────────────────────────────────

  describe('review queue', () => {
    it('lists pending theories as review items', async () => {
      prismaMock.theory.findMany.mockResolvedValue([
        {
          id: 't-1',
          title: 'Esu is not evil',
          content: 'A reading of Esu as messenger…',
          authorId: 'u-1',
          authorName: 'Ayo',
          status: 'pending',
          createdAt: new Date('2026-01-01'),
        },
      ]);
      prismaMock.theory.count.mockResolvedValue(1);

      const res = await service.getReviewQueue({ page: 1, limit: 20 });

      expect(prismaMock.theory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending' } })
      );
      expect(res.data.items[0]).toMatchObject({
        id: 't-1',
        type: 'theory',
        title: 'Esu is not evil',
        status: 'pending',
      });
    });

    it('approves a queued theory (pending → published)', async () => {
      prismaMock.theory.findUnique.mockResolvedValue({ id: 't-1', status: 'pending' });
      prismaMock.theory.update.mockResolvedValue({ id: 't-1', status: 'published' });

      const res = await service.approveContent('t-1');

      expect(prismaMock.theory.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { status: 'published' },
      });
      expect(res.data).toEqual({ id: 't-1', status: 'published' });
    });

    it('rejects a queued theory with a reason (pending → rejected)', async () => {
      prismaMock.theory.findUnique.mockResolvedValue({ id: 't-1', status: 'pending' });
      prismaMock.theory.update.mockResolvedValue({ id: 't-1', status: 'rejected' });

      const res = await service.rejectContent('t-1', 'misattributes an Orisa');

      expect(prismaMock.theory.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { status: 'rejected' },
      });
      expect(res.data.status).toBe('rejected');
    });

    it('throws NotFound for unknown content ids', async () => {
      prismaMock.theory.findUnique.mockResolvedValue(null);
      await expect(service.approveContent('missing')).rejects.toThrow(NotFoundException);
      await expect(service.rejectContent('missing', 'r')).rejects.toThrow(NotFoundException);
    });
  });
});
