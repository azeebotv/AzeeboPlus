import { Test, TestingModule } from '@nestjs/testing';
import { ContentIngestionService } from './content-ingestion.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ContentIngestionService', () => {
  let service: ContentIngestionService;

  const mockPrismaService = {
    contentItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentIngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ContentIngestionService>(ContentIngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestClipContent', () => {
    it('should ingest clip content successfully', async () => {
      const mockParent = { id: 'parent-1', windowType: 'rental' };
      const mockContent = { id: '1', title: 'Test Clip', status: 'draft' };
      mockPrismaService.contentItem.findUnique.mockResolvedValue(mockParent);
      mockPrismaService.contentItem.create.mockResolvedValue(mockContent);

      const result = await service.ingestClipContent(
        'user-1',
        { title: 'Test Clip', type: 'video', universe: 'reality' } as any,
        'parent-1',
        0,
        30
      );
      expect(result).toBeDefined();
    });
  });
});
