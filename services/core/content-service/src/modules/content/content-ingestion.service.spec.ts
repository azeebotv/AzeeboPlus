import { Test, TestingModule } from '@nestjs/testing';
import { ContentIngestionService } from './content-ingestion.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService, contentFlags } from '@azeebo/feature-flags';
import type { CreateContentDto } from './dto/create-content.dto';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  const mockFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentIngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: FeatureFlagService,
          useValue: mockFlagService,
        },
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
        {
          title: 'Test Clip',
          type: 'video',
          universeId: 'reality',
          thumbnail: 'thumb.jpg',
        } as CreateContentDto,
        'parent-1',
        0,
        30
      );
      expect(result).toBeDefined();
    });
  });

  describe('AI tagging (content_ai_tags)', () => {
    it('does not call the tagger while the flag is off', async () => {
      mockFlagService.isEnabled.mockResolvedValue(false);
      mockPrismaService.contentItem.create.mockResolvedValue({
        id: '1',
        title: 'T',
        metadata: {},
      });

      await service.ingestShortFormContent('user-1', {
        title: 'T',
        type: 'video',
        universeId: 'reality',
      } as CreateContentDto);

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockPrismaService.contentItem.update).not.toHaveBeenCalled();
    });

    it('writes aiTags into metadata when the flag is on and the tagger responds', async () => {
      mockFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === contentFlags.aiTags)
      );
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'CONTENT_AI_TAGS_URL') return 'http://tagger:8080';
        return undefined;
      });
      mockPrismaService.contentItem.create.mockResolvedValue({
        id: '1',
        title: 'Cool Movie',
        description: 'An adventure',
        metadata: {},
      });
      mockedAxios.post.mockResolvedValue({
        data: { tags: ['adventure', 'action'] },
      });

      await service.ingestShortFormContent('user-1', {
        title: 'Cool Movie',
        type: 'video',
        universeId: 'reality',
        description: 'An adventure',
      } as CreateContentDto);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tag'),
        expect.objectContaining({ title: 'Cool Movie' }),
        expect.any(Object)
      );
      expect(mockPrismaService.contentItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({ aiTags: ['adventure', 'action'] }),
          }),
        })
      );
    });
  });
});
