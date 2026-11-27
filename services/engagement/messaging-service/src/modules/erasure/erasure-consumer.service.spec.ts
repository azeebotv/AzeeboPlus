import { ErasureConsumerService } from './erasure-consumer.service';
import { PrismaService } from '../database/prisma.service';
import { EventBusService, EventTypes } from '@azeebo/event-bus';

type Handler = (event: { data: { userId?: string } }) => Promise<void>;

describe('ErasureConsumerService (message content nulling)', () => {
  let service: ErasureConsumerService;
  let handlers: Record<string, Handler>;

  const mockPrisma = {
    messageReaction: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
    message: { updateMany: jest.fn().mockResolvedValue({ count: 7 }) },
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

  it('removes reactions and nulls message content instead of leaving rows intact', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } });

    expect(mockPrisma.messageReaction.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
      where: { senderId: 'user-1', isDeleted: false },
      data: { content: '[deleted]', mediaUrl: null, isDeleted: true },
    });
  });

  it('ignores events without a userId', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: {} });

    expect(mockPrisma.message.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.messageReaction.deleteMany).not.toHaveBeenCalled();
  });
});
