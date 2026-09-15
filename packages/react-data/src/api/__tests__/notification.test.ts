import { notificationApi } from '../notification';
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

describe('Mobile Notification API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should GET /v1/notifications with pagination', async () => {
      const mockApiResponse = {
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      mockedClient.get.mockResolvedValue(mockApiResponse);

      const result = await notificationApi.getNotifications(1, 20);

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/notifications?page=1&limit=20');
      expect(result.data).toEqual(mockApiResponse.data);
    });
  });

  describe('markAsRead', () => {
    it('should PATCH /v1/notifications/:id/read', async () => {
      mockedClient.patch.mockResolvedValue({ success: true, data: { message: 'Read' } });

      await notificationApi.markAsRead('n-1');

      expect(mockedClient.patch).toHaveBeenCalledWith('/v1/notifications/n-1/read');
    });
  });

  describe('markAllAsRead', () => {
    it('should PATCH /v1/notifications/read-all', async () => {
      mockedClient.patch.mockResolvedValue({ success: true, data: { message: 'All marked read' } });

      const result = await notificationApi.markAllAsRead();

      expect(mockedClient.patch).toHaveBeenCalledWith('/v1/notifications/read-all');
      expect(result.data?.message).toBe('All marked read');
    });
  });

  describe('deleteNotification', () => {
    it('should DELETE /v1/notifications/:id', async () => {
      mockedClient.delete.mockResolvedValue({ success: true, data: { message: 'Deleted' } });

      const result = await notificationApi.deleteNotification('n-1');

      expect(mockedClient.delete).toHaveBeenCalledWith('/v1/notifications/n-1');
      expect(result.data?.message).toBe('Deleted');
    });
  });

  describe('registerPushToken', () => {
    it('should POST /v1/notifications/register-token with token', async () => {
      mockedClient.post.mockResolvedValue({ success: true, data: { message: 'Registered' } });

      await notificationApi.registerPushToken('push-tok-123');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/notifications/register-token', {
        token: 'push-tok-123',
      });
    });
  });

  describe('getPreferences', () => {
    it('should GET /v1/notifications/settings', async () => {
      const mockPrefs = { email: true, push: true, sms: false };
      mockedClient.get.mockResolvedValue({ success: true, data: mockPrefs });

      const result = await notificationApi.getPreferences();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/notifications/settings');
      expect(result.data).toEqual(mockPrefs);
    });
  });

  describe('updatePreferences', () => {
    it('should PUT /v1/notifications/settings', async () => {
      const prefs = { email: true, push: false };
      mockedClient.put.mockResolvedValue({ success: true, data: prefs });

      const result = await notificationApi.updatePreferences(prefs);

      expect(mockedClient.put).toHaveBeenCalledWith('/v1/notifications/settings', prefs);
      expect(result.data).toEqual(prefs);
    });
  });
});
