import { ErasureConsumerService } from './erasure-consumer.service';
import { PrismaService } from '../../database/prisma.service';
import { EventBusService, EventTypes } from '@azeebo/event-bus';

type Handler = (event: { data: { userId?: string } }) => Promise<void>;

describe('ErasureConsumerService (auth DB purge)', () => {
  let service: ErasureConsumerService;
  let handlers: Record<string, Handler>;

  const mockPrisma = {
    session: { deleteMany: jest.fn() },
    otp: { deleteMany: jest.fn() },
    socialAccount: { deleteMany: jest.fn() },
    registeredDevice: { deleteMany: jest.fn() },
    deviceLinkCode: { deleteMany: jest.fn() },
    user: { update: jest.fn().mockResolvedValue({}) },
  };

  const mockEventBus = {
    subscribe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = {};
    mockEventBus.subscribe.mockImplementation(async (type: string, handler: Handler) => {
      handlers[type] = handler;
    });

    service = new ErasureConsumerService(
      mockEventBus as unknown as EventBusService,
      mockPrisma as unknown as PrismaService
    );
    await service.onModuleInit();
  });

  it('registers a handler for user.erasure.requested', () => {
    expect(handlers[EventTypes.USER_ERASURE_REQUESTED]).toBeDefined();
  });

  it('purges sessions, OTPs, social accounts, devices and link codes', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } });

    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockPrisma.otp.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(mockPrisma.socialAccount.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(mockPrisma.registeredDevice.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(mockPrisma.deviceLinkCode.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('anonymizes the identity row and destroys credentials/MFA secrets', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        email: 'deleted_user-1@anonymized.local',
        displayName: 'Deleted User',
        avatar: null,
        password: '',
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    });
  });

  it('tolerates an already-removed identity row without failing the purge', async () => {
    mockPrisma.user.update.mockRejectedValueOnce(new Error('P2025: record not found'));

    await expect(
      handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } })
    ).resolves.toBeUndefined();

    expect(mockPrisma.session.deleteMany).toHaveBeenCalled();
  });

  it('ignores events without a userId', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: {} });

    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
