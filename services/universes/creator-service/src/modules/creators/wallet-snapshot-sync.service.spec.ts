import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { EventTypes, EVENT_BUS_SERVICE, type DomainEvent } from '@azeebo/event-bus';
import { PrismaService } from '../database/prisma.service.js';
import { WalletSnapshotSyncService } from './wallet-snapshot-sync.service.js';

// Partial mock: keep the real axios module (AxiosError instances must pass
// the service's `instanceof AxiosError` + response.status mapping) and only
// stub the network entry point `request`.
jest.mock('axios', () => {
  const actual = jest.requireActual<typeof import('axios')>('axios');
  const request = jest.fn();
  return {
    ...actual,
    default: { ...actual, request },
    request,
  };
});
const mockedAxiosRequest = jest.mocked(axios.request);

// Real wallet-service contract (WalletController.getTransactions wraps
// WalletService.getTransactions, whose data is { transactions, pagination }).
const transactionsPage = (
  transactions: Array<Record<string, unknown>>,
  page: number,
  totalPages: number
) => ({
  data: {
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit: 50,
        total: totalPages * 50,
        totalPages,
        hasNextPage: page < totalPages,
      },
    },
  },
});

const balancePage = (balance: number | string, currency = 'NGN') => ({
  data: { success: true, data: { balance, bonusBalance: 0, promoBalance: 0, currency } },
});

const walletEvent = (
  type: string,
  userId: string | undefined,
  id = 'evt-1'
): DomainEvent => ({
  id,
  type,
  source: 'wallet-service',
  timestamp: new Date().toISOString(),
  data: { userId, amount: 100 },
});

describe('WalletSnapshotSyncService', () => {
  let service: WalletSnapshotSyncService;
  let prisma: {
    creatorProfile: { findMany: jest.Mock };
    walletSnapshot: { upsert: jest.Mock };
    walletTransactionSnapshot: { upsert: jest.Mock };
  };
  let eventBus: { subscribe: jest.Mock };

  const mockPrismaService = () => ({
    creatorProfile: { findMany: jest.fn() },
    walletSnapshot: { upsert: jest.fn() },
    walletTransactionSnapshot: { upsert: jest.fn() },
  });

  const upsertSnapshot = (walletId: string) => ({
    id: walletId,
    userId: 'user-1',
    balance: 500,
    currency: 'NGN',
  });

  const routeWalletResponses = () => {
    mockedAxiosRequest.mockImplementation((config: { url?: string }) => {
      if (config.url?.endsWith('/v1/wallet/transactions')) {
        return Promise.resolve(
          transactionsPage(
            [
              {
                id: 'tx-1',
                type: 'debit',
                amount: 100,
                status: 'completed',
                description: 'tip',
                reference: 'tip-ref-1',
                createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
              },
            ],
            1,
            1
          )
        );
      }
      return Promise.resolve(balancePage(500));
    });
  };

  const createModule = async (withEventBus: boolean): Promise<void> => {
    prisma = mockPrismaService();
    eventBus = { subscribe: jest.fn().mockResolvedValue(undefined) };

    const providers = [
      WalletSnapshotSyncService,
      { provide: PrismaService, useValue: prisma },
      {
        provide: ConfigService,
        useValue: {
          getOrThrow: (key: string) => {
            if (key === 'WALLET_SERVICE_URL') return 'http://wallet-service';
            if (key === 'INTERNAL_API_KEY') return 'test-internal-key';
            throw new Error(`Unexpected getOrThrow for ${key}`);
          },
          get: (key: string) =>
            key === 'GATEWAY_SECRET' ? 'test-gateway-secret' : undefined,
        },
      },
    ];
    if (withEventBus) {
      providers.push({ provide: EVENT_BUS_SERVICE, useValue: eventBus } as never);
    }

    const module: TestingModule = await Test.createTestingModule({ providers }).compile();
    service = module.get(WalletSnapshotSyncService);
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('onModuleInit (event subscription)', () => {
    it('subscribes to wallet.funded and wallet.debited when the bus is wired', async () => {
      await createModule(true);
      await service.onModuleInit();

      expect(eventBus.subscribe).toHaveBeenCalledTimes(2);
      const subscribedTypes = eventBus.subscribe.mock.calls.map((c) => c[0]);
      expect(subscribedTypes).toEqual(
        expect.arrayContaining([EventTypes.WALLET_FUNDED, EventTypes.WALLET_DEBITED])
      );
    });

    it('degrades to sweep-only mode when the event bus is absent', async () => {
      await createModule(false);
      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(eventBus.subscribe).not.toHaveBeenCalled();
    });

    it('logs and continues when a single subscribe fails', async () => {
      await createModule(true);
      eventBus.subscribe.mockRejectedValueOnce(new Error('redis down'));
      await expect(service.onModuleInit()).resolves.toBeUndefined();
      expect(eventBus.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleWalletEvent (debounced sync)', () => {
    beforeEach(async () => {
      await createModule(true);
      await service.onModuleInit();
      routeWalletResponses();
      prisma.walletSnapshot.upsert.mockResolvedValue(upsertSnapshot('wallet-1'));
    });

    it('coalesces a burst of events for the same user into one sync', async () => {
      const fundedHandler = eventBus.subscribe.mock.calls.find(
        (c) => c[0] === EventTypes.WALLET_FUNDED
      )![1];
      const debitedHandler = eventBus.subscribe.mock.calls.find(
        (c) => c[0] === EventTypes.WALLET_DEBITED
      )![1];

      await fundedHandler(walletEvent(EventTypes.WALLET_FUNDED, 'user-1'));
      await debitedHandler(walletEvent(EventTypes.WALLET_DEBITED, 'user-1', 'evt-2'));
      await fundedHandler(walletEvent(EventTypes.WALLET_FUNDED, 'user-1', 'evt-3'));

      await jest.advanceTimersByTimeAsync(1_500);

      // One debounce window → exactly one balance fetch and one transactions fetch
      expect(mockedAxiosRequest).toHaveBeenCalledTimes(2);
      expect(prisma.walletSnapshot.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.walletTransactionSnapshot.upsert).toHaveBeenCalledTimes(1);
    });

    it('syncs different users independently', async () => {
      const fundedHandler = eventBus.subscribe.mock.calls.find(
        (c) => c[0] === EventTypes.WALLET_FUNDED
      )![1];

      await fundedHandler(walletEvent(EventTypes.WALLET_FUNDED, 'user-1'));
      await fundedHandler(walletEvent(EventTypes.WALLET_FUNDED, 'user-2', 'evt-2'));

      await jest.advanceTimersByTimeAsync(1_500);

      expect(prisma.walletSnapshot.upsert).toHaveBeenCalledTimes(2);
    });

    it('ignores events without a resolvable userId', async () => {
      const fundedHandler = eventBus.subscribe.mock.calls.find(
        (c) => c[0] === EventTypes.WALLET_FUNDED
      )![1];

      await fundedHandler(walletEvent(EventTypes.WALLET_FUNDED, undefined));

      await jest.advanceTimersByTimeAsync(5_000);

      expect(mockedAxiosRequest).not.toHaveBeenCalled();
      expect(prisma.walletSnapshot.upsert).not.toHaveBeenCalled();
    });

    it('never throws out of the event handler when wallet-service is down', async () => {
      const fundedHandler = eventBus.subscribe.mock.calls.find(
        (c) => c[0] === EventTypes.WALLET_FUNDED
      )![1];
      mockedAxiosRequest.mockRejectedValue(
        Object.assign(new Error('connect ECONNREFUSED'), { isAxiosError: true })
      );

      await fundedHandler(walletEvent(EventTypes.WALLET_FUNDED, 'user-1'));
      await expect(jest.advanceTimersByTimeAsync(1_500)).resolves.toBeUndefined();
    });
  });

  describe('syncWalletForUser', () => {
    beforeEach(async () => {
      await createModule(false);
      routeWalletResponses();
      prisma.walletSnapshot.upsert.mockResolvedValue(upsertSnapshot('wallet-1'));
    });

    it('upserts the snapshot and mirrors transactions', async () => {
      const result = await service.syncWalletForUser('user-1');

      expect(result).toEqual({ walletId: 'wallet-1', balance: '500' });
      expect(prisma.walletSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          update: { balance: 500, currency: 'NGN' },
        })
      );
      expect(prisma.walletTransactionSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tx-1' },
          create: expect.objectContaining({ walletId: 'wallet-1', type: 'debit' }),
        })
      );
    });

    it('throws NotFoundException when the user has no wallet (404)', async () => {
      mockedAxiosRequest.mockRejectedValue(
        new AxiosError(
          'Request failed with status code 404',
          'ERR_BAD_REQUEST',
          undefined,
          undefined,
          { status: 404 } as AxiosResponse
        )
      );

      await expect(service.syncWalletForUser('user-404')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });

    it('wraps transport failures in ServiceUnavailableException', async () => {
      mockedAxiosRequest.mockRejectedValue(
        new AxiosError(
          'socket hang up',
          'ECONNRESET',
          undefined,
          undefined,
          { status: 503 } as AxiosResponse
        )
      );

      await expect(service.syncWalletForUser('user-1')).rejects.toBeInstanceOf(
        ServiceUnavailableException
      );
    });
  });

  describe('syncAllCreators (nightly sweep)', () => {
    beforeEach(async () => {
      await createModule(false);
      routeWalletResponses();
      prisma.walletSnapshot.upsert.mockResolvedValue(upsertSnapshot('wallet-1'));
    });

    it('sweeps every creator profile and continues past individual failures', async () => {
      prisma.creatorProfile.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);
      // First user's balance fetch fails; the sweep must still sync the rest.
      mockedAxiosRequest.mockImplementationOnce(() =>
        Promise.reject(
          new AxiosError('boom', 'ERR_BAD_RESPONSE', undefined, undefined, {
            status: 500,
          } as AxiosResponse)
        )
      );

      await expect(service.syncAllCreators()).resolves.toBeUndefined();
      expect(prisma.walletSnapshot.upsert).toHaveBeenCalledTimes(2);
    });

    it('is a no-op when there are no creator profiles', async () => {
      prisma.creatorProfile.findMany.mockResolvedValue([]);
      await expect(service.syncAllCreators()).resolves.toBeUndefined();
      expect(mockedAxiosRequest).not.toHaveBeenCalled();
    });
  });
});
