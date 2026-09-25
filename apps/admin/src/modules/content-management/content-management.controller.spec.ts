import { Test, TestingModule } from '@nestjs/testing';
import { ContentManagementController } from './content-management.controller';
import { ContentManagementService } from './content-management.service';
import { AuditLogService } from '../audit/audit.service';

describe('ContentManagementController', () => {
  let controller: ContentManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentManagementController],
      providers: [
        {
          provide: ContentManagementService,
          useValue: {
            listContent: jest.fn().mockResolvedValue({ items: [], total: 0 }),
            updateContentStatus: jest.fn().mockResolvedValue(null),
            deleteContent: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<ContentManagementController>(ContentManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return content list', async () => {
    const result = await controller.listContent('1', '20');
    expect(result).toBeDefined();
  });
});
