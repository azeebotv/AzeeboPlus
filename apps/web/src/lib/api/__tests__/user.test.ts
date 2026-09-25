import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUserMethods } from '../user';
import type { RequestClient } from '../base';

function createMockClient() {
  return { request: vi.fn() } as unknown as RequestClient & { request: ReturnType<typeof vi.fn> };
}

describe('User API Methods', () => {
  let client: ReturnType<typeof createMockClient>;
  let user: ReturnType<typeof createUserMethods>;

  beforeEach(() => {
    client = createMockClient();
    user = createUserMethods(client);
  });

  describe('getProfile', () => {
    it('should GET /api/v1/users/me', async () => {
      const mockUser = { id: '1', email: 'a@b.com', name: 'Test', role: 'user' };
      client.request.mockResolvedValue({ success: true, data: mockUser });

      const result = await user.getProfile();

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me', {}, undefined);
      expect(result.data).toEqual(mockUser);
    });

    it('should pass retry options', async () => {
      client.request.mockResolvedValue({ success: true, data: {} });

      await user.getProfile({ retryOn401: true });

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me', {}, { retryOn401: true });
    });
  });

  describe('updateProfile', () => {
    it('should PATCH /api/v1/users/me', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: '1', name: 'Updated' } });

      await user.updateProfile({ name: 'Updated' });

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });
    });
  });

  describe('completeProfileSetup', () => {
    it('should POST to /api/v1/users/me/complete-profile', async () => {
      client.request.mockResolvedValue({ success: true, data: { id: '1' } });

      await user.completeProfileSetup({
        displayName: 'New Name',
        bio: 'Bio',
        interests: ['movies'],
      });

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/complete-profile', {
        method: 'POST',
        body: JSON.stringify({ displayName: 'New Name', bio: 'Bio', interests: ['movies'] }),
      });
    });
  });

  describe('getWatchHistory', () => {
    it('should GET /api/v1/users/me/history with pagination', async () => {
      client.request.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      });

      await user.getWatchHistory(2, 10);

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/history?page=2&limit=10');
    });
  });

  describe('addToWatchHistory', () => {
    it('should POST to /api/v1/users/me/history', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Added' } });

      await user.addToWatchHistory('content-1', 75);

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/history', {
        method: 'POST',
        body: JSON.stringify({ contentId: 'content-1', progress: 75 }),
      });
    });

    it('should default progress to 0', async () => {
      client.request.mockResolvedValue({ success: true, data: { message: 'Added' } });

      await user.addToWatchHistory('content-1');

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/history', {
        method: 'POST',
        body: JSON.stringify({ contentId: 'content-1', progress: 0 }),
      });
    });
  });

  describe('preferences', () => {
    it('should GET preferences', async () => {
      client.request.mockResolvedValue({ success: true, data: { theme: 'dark' } });

      await user.getPreferences();

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/preferences');
    });

    it('should PATCH preferences', async () => {
      client.request.mockResolvedValue({ success: true, data: { theme: 'light' } });

      await user.updatePreferences({ theme: 'light' });

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ theme: 'light' }),
      });
    });
  });

  describe('privacySettings', () => {
    it('should GET privacy settings', async () => {
      client.request.mockResolvedValue({ success: true, data: { profileVisible: true } });

      await user.getPrivacySettings();

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/privacy-settings');
    });

    it('should PUT privacy settings', async () => {
      client.request.mockResolvedValue({ success: true, data: { profileVisible: false } });

      await user.updatePrivacySettings({ profileVisible: false });

      expect(client.request).toHaveBeenCalledWith('/api/v1/users/me/privacy-settings', {
        method: 'PUT',
        body: JSON.stringify({ profileVisible: false }),
      });
    });
  });
});
