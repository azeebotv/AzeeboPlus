import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWalletMethods } from '../wallet';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('Wallet API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let wallet: ReturnType<typeof createWalletMethods>;

  beforeEach(() => {
    client = createMockClient();
    wallet = createWalletMethods(client);
  });

  describe('getBalance', () => {
    it('should GET /api/v1/wallet', async () => {
      const mockBalance = { balance: 5000, currency: 'NGN', pendingBalance: 200 };
      client.request.mockResolvedValue({ success: true, data: mockBalance });

      const result = await wallet.getBalance();

      expect(client.request).toHaveBeenCalledWith('/api/v1/wallet', {}, { skipRetry: true });
      expect(result.data).toEqual(mockBalance);
    });
  });

  describe('getTransactions', () => {
    it('should GET /api/v1/wallet/transactions with default pagination', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      });

      await wallet.getTransactions();

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/wallet/transactions?page=1&limit=20',
        {},
        { skipRetry: true }
      );
    });

    it('should support custom pagination', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 2, limit: 10, hasMore: false },
      });

      await wallet.getTransactions(2, 10);

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/wallet/transactions?page=2&limit=10',
        {},
        { skipRetry: true }
      );
    });
  });

  describe('fundWallet', () => {
    it('should POST to /api/v1/wallet/fund', async () => {
      client.request.mockResolvedValue({ success: true, data: { reference: 'ref-123' } });

      await wallet.fundWallet(1000, 'card');

      expect(client.request).toHaveBeenCalledWith('/api/v1/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({ amount: 1000, paymentMethod: 'card' }),
      });
    });
  });

  describe('withdraw', () => {
    it('should POST to /api/v1/wallet/withdraw', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { message: 'Withdrawal initiated' },
      });

      await wallet.withdraw(500, { bankCode: '001', accountNumber: '1234567890' });

      expect(client.request).toHaveBeenCalledWith('/api/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: 500,
          bankDetails: { bankCode: '001', accountNumber: '1234567890' },
        }),
      });
    });
  });

  describe('transfer', () => {
    it('should POST to /api/v1/wallet/transfer', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Transfer successful' } });

      await wallet.transfer(100, 'user-2');

      expect(client.request).toHaveBeenCalledWith('/api/v1/wallet/transfer', {
        method: 'POST',
        body: JSON.stringify({ amount: 100, recipientId: 'user-2' }),
      });
    });
  });

  describe('getTransaction', () => {
    it('should GET /api/v1/wallet/transactions/:id', async () => {
      const mockTx = {
        id: 'tx-1',
        type: 'credit' as const,
        amount: 100,
        currency: 'NGN',
        status: 'completed' as const,
        createdAt: '2024-01-01',
      };
      client.request.mockResolvedValue({ success: true, data: mockTx });

      const result = await wallet.getTransaction('tx-1');

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/wallet/transactions/tx-1',
        {},
        { skipRetry: true }
      );
      expect(result.data).toEqual(mockTx);
    });
  });

  describe('getEarnings', () => {
    it('should GET /api/v1/wallet/earnings with range param', async () => {
      const mockEarnings = {
        totalEarnings: 10000,
        pendingEarnings: 2000,
        withdrawableBalance: 8000,
      };
      client.request.mockResolvedValue({ success: true, data: mockEarnings });

      await wallet.getEarnings({ range: '30d' });

      expect(client.request).toHaveBeenCalledWith(
        '/api/v1/wallet/earnings?range=30d',
        {},
        { skipRetry: true }
      );
    });
  });
});
