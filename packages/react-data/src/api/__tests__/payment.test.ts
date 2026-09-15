import { paymentApi } from '../payment';
import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Mobile Payment API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should POST to /v1/payments/initialize', async () => {
      const mockApiResponse = {
        success: true,
        data: { reference: 'ref-123', authorizationUrl: 'https://pay.url' },
      };
      mockedClient.post.mockResolvedValue(mockApiResponse);

      const result = await paymentApi.initialize({
        amount: 5000,
        currency: 'NGN',
        email: 'a@b.com',
      });

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/payments/initialize', {
        amount: 5000,
        currency: 'NGN',
        email: 'a@b.com',
      });
      expect(result.data?.reference).toBe('ref-123');
    });
  });

  describe('verify', () => {
    it('should POST to /v1/payments/verify with reference', async () => {
      mockedClient.post.mockResolvedValue({
        success: true,
        data: { status: 'success', reference: 'ref-123' },
      });

      const result = await paymentApi.verify('ref-123');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/payments/verify', {
        reference: 'ref-123',
      });
      expect(result.data?.status).toBe('success');
    });
  });

  describe('getTransactions', () => {
    it('should GET /v1/payments/history with pagination', async () => {
      mockedClient.get.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await paymentApi.getTransactions(1, 20);

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/payments/history?page=1&limit=20');
    });

    it('should use default pagination', async () => {
      mockedClient.get.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await paymentApi.getTransactions();
      expect(mockedClient.get).toHaveBeenCalledWith('/v1/payments/history?page=1&limit=20');
    });
  });

  describe('getProviders', () => {
    it('should GET /v1/payments/providers', async () => {
      mockedClient.get.mockResolvedValue({
        success: true,
        data: [{ provider: 'paystack', name: 'Paystack' }],
      });

      const result = await paymentApi.getProviders();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/payments/providers');
      expect(result.data).toEqual([{ provider: 'paystack', name: 'Paystack' }]);
    });
  });
});
