import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { walletApi } from './wallet';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Wallet API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should call GET /wallet/balance', async () => {
      const mockResponse = {
        success: true,
        data: { balance: 1000, currency: 'NGN', pendingBalance: 0 },
      };
      
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletApi.getBalance();

      expect(apiClient.get).toHaveBeenCalledWith('/wallet/balance');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTransactions', () => {
    it('should call GET /wallet/transactions with pagination params', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            { id: '1', type: 'credit', amount: 500, currency: 'NGN', status: 'completed', createdAt: '2024-01-01' },
          ],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };
      
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletApi.getTransactions(1, 20);

      expect(apiClient.get).toHaveBeenCalledWith('/wallet/transactions?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fundWallet', () => {
    it('should call POST /wallet/fund with correct data', async () => {
      const mockResponse = {
        success: true,
        data: { authorizationUrl: 'https://payment-gateway.com', reference: 'test-ref' },
      };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletApi.fundWallet({ amount: 1000, provider: 'paystack', email: 'test@example.com' });

      expect(apiClient.post).toHaveBeenCalledWith('/wallet/fund', { amount: 1000, provider: 'paystack', email: 'test@example.com' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('withdraw', () => {
    it('should call POST /wallet/withdraw with correct data', async () => {
      const mockResponse = { success: true, message: 'Withdrawal initiated' };
      
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await walletApi.withdraw({ amount: 500, bankCode: '001', accountNumber: '1234567890' });

      expect(apiClient.post).toHaveBeenCalledWith('/wallet/withdraw', { amount: 500, bankCode: '001', accountNumber: '1234567890' });
      expect(result).toEqual(mockResponse);
    });
  });
});
