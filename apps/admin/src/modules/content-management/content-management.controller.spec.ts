import { Test, TestingModule } from '@nestjs/testing';
import { ContentManagementController } from './content-management.controller';
import { ContentManagementService } from './content-management.service';

describe('ContentManagementController', () => {
  let controller: ContentManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentManagementController],
      providers: [
        {
          provide: ContentManagementService,
          useValue: {
            getContent: jest.fn().mockResolvedValue({ items: [], total: 0 }),
            updateContentStatus: jest.fn().mockResolvedValue(null),
            deleteContent: jest.fn().mockResolvedValue(null),
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
    const result = await controller.getContent(1, 20);
    expect(result).toBeDefined();
  });
});
