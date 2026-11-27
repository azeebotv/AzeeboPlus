import { ErasureConsumerService } from './erasure-consumer.service';
import { PrismaService } from '../database/prisma.service';
import { EventBusService, EventTypes } from '@azeebo/event-bus';

type Handler = (event: { data: { userId?: string } }) => Promise<void>;

describe('ErasureConsumerService (payment methods purge)', () => {
  let service: ErasureConsumerService;
  let handlers: Record<string, Handler>;

  const mockPrisma = {
    paymentMethod: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
  };

  const mockEventBus = { subscribe: jest.fn() };

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

  it('removes every stored payment method for the erased user', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } });

    expect(mockPrisma.paymentMethod.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('ignores events without a userId', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: {} });

    expect(mockPrisma.paymentMethod.deleteMany).not.toHaveBeenCalled();
  });
});
