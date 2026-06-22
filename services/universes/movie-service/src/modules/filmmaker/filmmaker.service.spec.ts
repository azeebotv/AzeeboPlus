import { Test, TestingModule } from '@nestjs/testing';
import { FilmmakerService } from './filmmaker.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../database/prisma.service');

describe('FilmmakerService', () => {
  let service: FilmmakerService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockProject = {
    id: 'project-1',
    filmmakerId: 'filmmaker-1',
    title: 'Test Project',
    description: 'Test description',
    thumbnail: 'thumb.jpg',
    status: 'development',
    fundingGoal: 10000,
    fundingRaised: 0,
    targetDate: new Date('2024-12-31'),
    createdAt: new Date(),
    filmmaker: { displayName: 'Test Filmmaker' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilmmakerService,
        {
          provide: PrismaService,
          useValue: {
            filmmakerProject: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            filmmakerUpdate: {
              create: jest.fn(),
            },
            filmmakerBacker: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FilmmakerService>(FilmmakerService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjects', () => {
    it('should return paginated projects', async () => {
      (prismaService.filmmakerProject.findMany as jest.Mock).mockResolvedValue([mockProject]);
      (prismaService.filmmakerProject.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getProjects(1, 20);

      expect(result.success).toBe(true);
      expect((result.data as any).items).toHaveLength(1);
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue({
        ...mockProject,
        _count: { backers: 5 },
        updates: [],
      });

      const result = await service.getProjectById('project-1');

      expect(result.success).toBe(true);
      expect((result.data as any).title).toBe('Test Project');
    });

    it('should throw NotFoundException if project not found', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProjectById('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      (prismaService.filmmakerProject.create as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.createProject('filmmaker-1', {
        title: 'Test Project',
        description: 'Test description',
        fundingGoal: 10000,
      });

      expect(result.success).toBe(true);
      expect((result.data as any).title).toBe('Test Project');
    });
  });

  describe('updateProject', () => {
    it('should update a project', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prismaService.filmmakerProject.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        title: 'Updated Title',
      });

      const result = await service.updateProject('project-1', 'filmmaker-1', {
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
      expect((result.data as any).title).toBe('Updated Title');
    });

    it('should throw NotFoundException if project not found', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateProject('not-found', 'filmmaker-1', {})).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if not authorized', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue(mockProject);

      await expect(service.updateProject('project-1', 'wrong-user', {})).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('backProject', () => {
    it('should back a project', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prismaService.filmmakerBacker.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.filmmakerBacker.create as jest.Mock).mockResolvedValue({ id: 'backer-1' });
      (prismaService.filmmakerProject.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        fundingRaised: 100,
      });
      (prismaService.filmmakerBacker.count as jest.Mock).mockResolvedValue(1);

      const result = await service.backProject('user-1', 'project-1', 100);

      expect(result.success).toBe(true);
      expect((result.data as any).message).toBe('Backed successfully');
    });

    it('should update existing backing', async () => {
      (prismaService.filmmakerProject.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prismaService.filmmakerBacker.findUnique as jest.Mock).mockResolvedValue({
        id: 'backer-1',
        amount: 100,
      });
      (prismaService.filmmakerBacker.update as jest.Mock).mockResolvedValue({
        id: 'backer-1',
        amount: 200,
      });
      (prismaService.filmmakerProject.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        fundingRaised: 200,
      });

      const result = await service.backProject('user-1', 'project-1', 100);

      expect(result.success).toBe(true);
      expect((result.data as any).message).toBe('Backing updated');
    });
  });
});
