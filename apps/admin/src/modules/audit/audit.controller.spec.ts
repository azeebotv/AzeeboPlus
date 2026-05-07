import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditLogService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditLogService,
          useValue: {
            getLogs: jest
              .fn()
              .mockResolvedValue({ logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
            getLogsForTarget: jest
              .fn()
              .mockResolvedValue({ logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
            getLogsByActor: jest
              .fn()
              .mockResolvedValue({ logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return audit logs', async () => {
    const result = await controller.getLogs();
    expect(result).toBeDefined();
  });
});
