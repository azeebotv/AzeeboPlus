import { Test, TestingModule } from '@nestjs/testing';
import { SafetyScanningService } from './safety-scanning.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

describe('SafetyScanningService', () => {
  let service: SafetyScanningService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    safetyScan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafetyScanningService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SafetyScanningService>(SafetyScanningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scanMedia', () => {
    it('should scan media for safety issues', async () => {
      const result = await service.scanMedia({
        contentId: '1',
        mediaUrl: 'https://example.com/test.mp4',
      });
      expect(result).toBeDefined();
    });
  });
});
