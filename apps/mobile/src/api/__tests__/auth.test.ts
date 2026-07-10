import { authApi } from '../auth';
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

describe('Mobile Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should POST to /v1/auth/login', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'tok',
          refreshToken: 'ref',
          user: { id: '1', email: 'a@b.com', name: 'A', role: 'user' },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue(mockResponse as any);

      const result = await authApi.login({ email: 'a@b.com', password: 'pass' });

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/login', {
        email: 'a@b.com',
        password: 'pass',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should propagate login failure', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: false, message: 'Invalid' } as any);

      const result = await authApi.login({ email: 'a@b.com', password: 'wrong' });

      expect(result.success).toBe(false);
    });
  });

  describe('register', () => {
    it('should POST to /v1/auth/register', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true, data: { accessToken: 'tok' } } as any);

      await authApi.register({ name: 'Test', email: 'a@b.com', password: 'pass' });

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/register', {
        name: 'Test',
        email: 'a@b.com',
        password: 'pass',
      });
    });
  });

  describe('logout', () => {
    it('should POST to /v1/auth/logout', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.logout();

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/logout');
    });
  });

  describe('forgotPassword', () => {
    it('should POST to /v1/auth/forgot-password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.forgotPassword('a@b.com');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/forgot-password', {
        email: 'a@b.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('should POST to /v1/auth/reset-password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.resetPassword('token123', 'newPass');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/reset-password', {
        token: 'token123',
        newPassword: 'newPass',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should POST to /v1/auth/verify-email', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.verifyEmail('verify-token');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/verify-email', {
        token: 'verify-token',
      });
    });
  });

  describe('getProfile', () => {
    it('should GET /v1/users/me', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.get.mockResolvedValue({ success: true, data: { id: '1' } } as any);

      await authApi.getProfile();

      expect(mockedClient.get).toHaveBeenCalledWith('/v1/users/me');
    });
  });

  describe('updateProfile', () => {
    it('should PUT to /v1/users/me', async () => {
      mockedClient.put.mockResolvedValue({
        success: true,
        data: { id: '1', name: 'Updated' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await authApi.updateProfile({ name: 'Updated' });

      expect(mockedClient.put).toHaveBeenCalledWith('/v1/users/me', { name: 'Updated' });
    });
  });

  describe('changePassword', () => {
    it('should PUT to /v1/users/me/password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.put.mockResolvedValue({ success: true } as any);

      await authApi.changePassword('oldPass', 'newPass');

      expect(mockedClient.put).toHaveBeenCalledWith('/v1/users/me/password', {
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      });
    });
  });

  describe('refreshToken', () => {
    it('should POST to /v1/auth/refresh', async () => {
      mockedClient.post.mockResolvedValue({
        success: true,
        data: { accessToken: 'new-tok' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await authApi.refreshToken('old-ref');

      expect(mockedClient.post).toHaveBeenCalledWith('/v1/auth/refresh', {
        refreshToken: 'old-ref',
      });
    });
  });
});
