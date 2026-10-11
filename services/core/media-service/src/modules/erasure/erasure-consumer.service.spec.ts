import { ErasureConsumerService } from './erasure-consumer.service';
import { PrismaService } from '../database/prisma.service';
import { S3Service } from '../upload/s3.service';
import { EventBusService, EventTypes } from '@azeebo/event-bus';

type Handler = (event: { data: { userId?: string } }) => Promise<void>;

describe('ErasureConsumerService (S3 media purge)', () => {
  let service: ErasureConsumerService;
  let handlers: Record<string, Handler>;

  const mockPrisma = {
    mediaUpload: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'm1', key: 'users/user-1/a.jpg' },
        { id: 'm2', key: 'users/user-1/b.jpg' },
        { id: 'm3', key: 'users/user-1/c.jpg' },
      ]),
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
  };

  const mockS3 = { deleteFile: jest.fn().mockResolvedValue(undefined) };
  const mockEventBus = { subscribe: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = {};
    mockEventBus.subscribe.mockImplementation(async (type: string, handler: Handler) => {
      handlers[type] = handler;
    });

    service = new ErasureConsumerService(
      mockEventBus as unknown as EventBusService,
      mockPrisma as unknown as PrismaService,
      mockS3 as unknown as S3Service
    );
    await service.onModuleInit();
  });

  it('deletes every stored S3 object for the user and removes the asset rows', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } });

    expect(mockPrisma.mediaUpload.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { id: true, key: true },
    });
    expect(mockS3.deleteFile).toHaveBeenCalledTimes(3);
    expect(mockS3.deleteFile).toHaveBeenCalledWith('users/user-1/a.jpg');
    expect(mockS3.deleteFile).toHaveBeenCalledWith('users/user-1/c.jpg');
    expect(mockPrisma.mediaUpload.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('keeps purging other objects when one S3 delete fails', async () => {
    mockS3.deleteFile.mockImplementation(async (key: string) => {
      if (key === 'users/user-1/b.jpg') throw new Error('NoSuchKey');
    });

    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-1' } });

    expect(mockS3.deleteFile).toHaveBeenCalledTimes(3);
    expect(mockPrisma.mediaUpload.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('does nothing when the user has no stored media', async () => {
    mockPrisma.mediaUpload.findMany.mockResolvedValueOnce([]);

    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: { userId: 'user-empty' } });

    expect(mockS3.deleteFile).not.toHaveBeenCalled();
    expect(mockPrisma.mediaUpload.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-empty' },
    });
  });

  it('ignores events without a userId', async () => {
    await handlers[EventTypes.USER_ERASURE_REQUESTED]({ data: {} });

    expect(mockPrisma.mediaUpload.findMany).not.toHaveBeenCalled();
  });
});
