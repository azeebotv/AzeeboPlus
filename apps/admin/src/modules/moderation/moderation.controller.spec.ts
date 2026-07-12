import { Test, TestingModule } from '@nestjs/testing';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { AuditLogService } from '../audit/audit.service';

describe('ModerationController', () => {
  let controller: ModerationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [
        {
          provide: ModerationService,
          useValue: {
            getReports: jest.fn().mockResolvedValue({ reports: [], total: 0, page: 1, limit: 20 }),
            getModerationStats: jest.fn().mockResolvedValue({ pendingReports: 0, totalReports: 0 }),
            getReportTypes: jest.fn().mockResolvedValue([]),
            getReportById: jest.fn().mockResolvedValue(null),
            resolveReport: jest.fn().mockResolvedValue(null),
            dismissReport: jest.fn().mockResolvedValue(null),
            takeSafetyAction: jest.fn().mockResolvedValue(null),
            getSafetyActions: jest.fn().mockResolvedValue([]),
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

    controller = module.get<ModerationController>(ModerationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return moderation reports', async () => {
    const result = await controller.getReports();
    expect(result).toBeDefined();
  });
});
