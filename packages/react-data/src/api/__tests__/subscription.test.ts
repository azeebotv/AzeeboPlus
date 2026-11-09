import { subscriptionApi } from '../subscription';
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

describe('Mobile Subscription API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should GET /v1/subscription/plans', async () => {
      const mockPlans = [{ id: 'plan-1', name: 'Premium', price: 5000 }];
      mockedClient.get.mockResolvedValue(mockPlans);

      const result = await subscriptionApi.getPlans();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/subscription/plans');
      expect(result.data).toEqual(mockPlans);
    });
  });

  describe('getPlanById', () => {
    it('should GET /v1/subscription/plans/:id', async () => {
      mockedClient.get.mockResolvedValue({ id: 'plan-1', name: 'Premium' });

      const result = await subscriptionApi.getPlanById('plan-1');

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/subscription/plans/plan-1');
      expect(result.data?.name).toBe('Premium');
    });
  });

  describe('getCurrentSubscription', () => {
    it('should GET /v1/subscription/current', async () => {
      const mockCurrent = { id: 'sub-1', planId: 'plan-1', status: 'active' };
      mockedClient.get.mockResolvedValue(mockCurrent);

      const result = await subscriptionApi.getCurrentSubscription();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/subscription/current');
      expect(result.data?.status).toBe('active');
    });
  });

  describe('subscribe', () => {
    it('should POST /v1/subscription/subscribe with dto', async () => {
      const mockResponse = { id: 'sub-2', status: 'active' };
      mockedClient.post.mockResolvedValue(mockResponse);

      const result = await subscriptionApi.subscribe({ planId: 'plan-1', autoRenew: true });

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/subscription/subscribe', {
        planId: 'plan-1',
        autoRenew: true,
      });
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('cancelSubscription', () => {
    it('should DELETE /v1/subscription/:id', async () => {
      mockedClient.delete.mockResolvedValue({ message: 'Cancelled' });

      const result = await subscriptionApi.cancelSubscription('sub-1');

      expect(mockedClient.delete).toHaveBeenCalledWith('/v1/subscription/sub-1');
      expect(result.data?.message).toBe('Cancelled');
    });
  });

  describe('getSubscriptionHistory', () => {
    it('should GET /v1/subscription/history with pagination', async () => {
      mockedClient.get.mockResolvedValue({
        subscriptions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      await subscriptionApi.getSubscriptionHistory(1, 20);

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/subscription/history?page=1&limit=20');
    });
  });

  describe('renewSubscription', () => {
    it('should POST /v1/subscription/renew/:id', async () => {
      mockedClient.post.mockResolvedValue({ id: 'sub-1', status: 'active' });

      const result = await subscriptionApi.renewSubscription('sub-1');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/subscription/renew/sub-1', {});
      expect(result.data?.status).toBe('active');
    });
  });
});
