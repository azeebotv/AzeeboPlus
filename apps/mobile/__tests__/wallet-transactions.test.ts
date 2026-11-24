import { walletApi } from '@azeebo/react-data/api/wallet';
import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 2: Wallet Funding, Debit & Idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retrieves user wallet balance and currency denomination', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      success: true,
      data: {
        balance: 250000,
        currency: 'NGN',
        updatedAt: '2026-11-18T12:00:00Z',
      },
    });

    const res = await walletApi.getBalance();

    expect(getSpy).toHaveBeenCalledWith('/v1/wallet');
    expect(res.success).toBe(true);
    expect(res.data?.balance).toBe(250000);
    expect(res.data?.currency).toBe('NGN');
  });

  it('initiates wallet funding with selected payment rail (Paystack/Flutterwave)', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        authorizationUrl: 'https://checkout.paystack.com/access_ref_123',
        reference: 'azeebo-fund-ref-001',
      },
    });

    const res = await walletApi.fundWallet({
      amount: 100000,
      provider: 'paystack',
      email: 'user@azeeboplus.com',
    });

    expect(postSpy).toHaveBeenCalledWith(
      '/v1/wallet/fund',
      { amount: 100000, provider: 'paystack', email: 'user@azeeboplus.com' }
    );
    expect(res.data?.authorizationUrl).toContain('paystack.com');
  });

  it('applies SuperVote debit with strict idempotency header', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        transactionId: 'tx-supervote-789',
        debitedAmount: 50000,
        newBalance: 200000,
      },
    });

    const idempotencyKey = 'idem-supervote-unique-key-999';
    const res = (await apiClient.post(
      '/wallet/debit',
      {
        amount: 50000,
        purpose: 'super_vote',
        metadata: { contestantId: 'contestant-04' },
      },
      {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      }
    )) as { success: boolean; data?: { transactionId: string; debitedAmount: number; newBalance: number } };

    expect(postSpy).toHaveBeenCalledWith(
      '/wallet/debit',
      expect.objectContaining({ amount: 50000, purpose: 'super_vote' }),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Idempotency-Key': idempotencyKey }),
      })
    );
    expect(res.data?.newBalance).toBe(200000);
  });
});
