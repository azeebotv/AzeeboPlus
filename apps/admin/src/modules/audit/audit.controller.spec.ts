import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditLogService } from './audit.service';

const EMPTY = { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 };

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditLogService,
          useValue: {
            getLogs: jest.fn().mockResolvedValue(EMPTY),
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

  it('passes a comma-separated targetType through as a group filter (array)', async () => {
    const getLogs = (controller['auditService'] as unknown as { getLogs: jest.Mock })
      .getLogs;

    await controller.getLogs(undefined, undefined, 'content,category,tag');

    expect(getLogs).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: ['content', 'category', 'tag'] }),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('keeps a single targetType as-is', async () => {
    const getLogs = (controller['auditService'] as unknown as { getLogs: jest.Mock })
      .getLogs;

    await controller.getLogs(undefined, undefined, 'feature_flag');

    expect(getLogs).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: 'feature_flag' }),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('trims blanks out of a comma-separated targetType', async () => {
    const getLogs = (controller['auditService'] as unknown as { getLogs: jest.Mock })
      .getLogs;

    await controller.getLogs(undefined, undefined, 'admin_user, role, ,settings');

    expect(getLogs).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: ['admin_user', 'role', 'settings'] }),
      expect.any(Number),
      expect.any(Number)
    );
  });
});
