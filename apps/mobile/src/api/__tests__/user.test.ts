import { userApi } from '../user';
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

describe('Mobile User API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should GET /v1/users/me', async () => {
      const mockProfile = {
        success: true,
        data: { id: '1', email: 'a@b.com', displayName: 'Test', role: 'user' },
      };
      mockedClient.get.mockResolvedValue(mockProfile);

      const result = await userApi.getProfile();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/users/me');
      expect(result).toEqual(mockProfile);
    });

    it('should propagate failure', async () => {
      mockedClient.get.mockResolvedValue({ success: false, message: 'Not found' });

      const result = await userApi.getProfile();

      expect(result.success).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should PATCH /v1/users/me with data', async () => {
      const mockResponse = { success: true, data: { id: '1', displayName: 'Updated' } };
      mockedClient.patch.mockResolvedValue(mockResponse);

      const result = await userApi.updateProfile({ displayName: 'Updated' });

      expect(mockedClient.patch).toHaveBeenCalledWith('/v1/users/me', { displayName: 'Updated' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPreferences', () => {
    it('should GET /v1/users/me/preferences', async () => {
      const mockPreferences = {
        success: true,
        data: { notifications: { push: true, email: true, sms: false } },
      };
      mockedClient.get.mockResolvedValue(mockPreferences);

      const result = await userApi.getPreferences();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/users/me/preferences');
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('updatePreferences', () => {
    it('should PATCH /v1/users/me/preferences', async () => {
      mockedClient.patch.mockResolvedValue({
        success: true,
        data: { notifications: { push: false, email: true, sms: false } },
      });

      await userApi.updatePreferences({ notifications: { push: false, email: true, sms: false } });

      expect(mockedClient.patch).toHaveBeenCalledWith('/v1/users/me/preferences', {
        notifications: { push: false, email: true, sms: false },
      });
    });
  });

  describe('getWatchHistory', () => {
    it('should GET /v1/users/me/history with pagination', async () => {
      const mockHistory = {
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      mockedClient.get.mockResolvedValue(mockHistory);

      const result = await userApi.getWatchHistory(1, 20);

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/users/me/history?page=1&limit=20');
      expect(result).toEqual(mockHistory);
    });

    it('should use default pagination', async () => {
      mockedClient.get.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await userApi.getWatchHistory();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/users/me/history?page=1&limit=20');
    });
  });

  describe('getSavedItems', () => {
    it('should GET /v1/users/me/saved with pagination', async () => {
      mockedClient.get.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      });

      await userApi.getSavedItems(1, 10);

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/users/me/saved?page=1&limit=10');
    });
  });

  describe('saveItem', () => {
    it('should POST /v1/users/me/saved with contentId', async () => {
      mockedClient.post.mockResolvedValue({ success: true, data: { message: 'Saved' } });

      const result = await userApi.saveItem('content-123');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/users/me/saved', {
        contentId: 'content-123',
      });
      expect(result.data?.message).toBe('Saved');
    });
  });

  describe('unsaveItem', () => {
    it('should DELETE /v1/users/me/saved/:contentId', async () => {
      mockedClient.delete.mockResolvedValue({ success: true, data: { message: 'Removed' } });

      const result = await userApi.unsaveItem('content-123');

      expect(mockedClient.delete).toHaveBeenCalledWith('/v1/users/me/saved/content-123');
      expect(result.data?.message).toBe('Removed');
    });
  });

  describe('completeProfileSetup', () => {
    it('should POST /v1/users/me/complete-profile', async () => {
      const setupData = { displayName: 'Test', role: 'creator', interests: ['comedy'] };
      mockedClient.post.mockResolvedValue({
        success: true,
        data: { id: '1', displayName: 'Test' },
      });

      const result = await userApi.completeProfileSetup(setupData);

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/users/me/complete-profile', setupData);
      expect(result.success).toBe(true);
    });
  });
});
