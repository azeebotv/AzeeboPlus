import { walletApi } from '../wallet';
import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Mobile Wallet API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getBalance should GET /v1/wallet', async () => {
    mockedClient.get.mockResolvedValue({
      success: true,
      data: { balance: 5000, currency: 'NGN' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const result = await walletApi.getBalance();

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/wallet');
    expect(result.data).toEqual({ balance: 5000, currency: 'NGN' });
  });

  it('getTransactions should GET /v1/wallet/transactions with pagination', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedClient.get.mockResolvedValue({ success: true, data: { items: [], total: 0 } } as any);

    await walletApi.getTransactions(1, 20);

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/wallet/transactions?page=1&limit=20');
  });

  it('getTransaction should GET /v1/wallet/transactions/:id', async () => {
    mockedClient.get.mockResolvedValue({
      success: true,
      data: { id: 'tx1', type: 'credit' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await walletApi.getTransaction('tx1');

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/wallet/transactions/tx1');
  });

  it('fundWallet should POST to /v1/wallet/fund', async () => {
    mockedClient.post.mockResolvedValue({
      success: true,
      data: { authorizationUrl: 'https://pay.com', reference: 'ref-123' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await walletApi.fundWallet({ amount: 1000, provider: 'paystack', email: 'a@b.com' });

    expect(mockedClient.post).toHaveBeenCalledWith('/v1/wallet/fund', {
      amount: 1000,
      provider: 'paystack',
      email: 'a@b.com',
    });
  });

  it('withdraw should POST to /v1/wallet/withdraw', async () => {
    mockedClient.post.mockResolvedValue({
      success: true,
      data: { message: 'Withdrawal initiated' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await walletApi.withdraw({
      amount: 500,
      bankCode: '001',
      accountNumber: '1234567890',
      idempotencyKey: 'test-wd-key',
    });

    expect(mockedClient.post).toHaveBeenCalledWith('/v1/wallet/withdraw', {
      amount: 500,
      bankCode: '001',
      accountNumber: '1234567890',
      idempotencyKey: 'test-wd-key',
    });
  });

  it('getSummary should GET /v1/wallet/summary', async () => {
    mockedClient.get.mockResolvedValue({
      success: true,
      data: { balance: 5000, totalFunded: 10000 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await walletApi.getSummary();

    expect(mockedClient.get).toHaveBeenCalledWith('/v1/wallet/summary');
  });

  it('redeemReward should POST to /v1/wallet/redeem-reward', async () => {
    mockedClient.post.mockResolvedValue({
      success: true,
      data: { message: 'Redeemed', creditedAmount: 500 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await walletApi.redeemReward({ points: 1000 });

    expect(mockedClient.post).toHaveBeenCalledWith('/v1/wallet/redeem-reward', { points: 1000 });
  });
});
