import { authApi } from '../auth';
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

describe('Mobile Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should POST to /auth/login', async () => {
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

      const result = await authApi.login('a@b.com', 'pass');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'a@b.com',
        password: 'pass',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should propagate login failure', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: false, message: 'Invalid' } as any);

      const result = await authApi.login('a@b.com', 'wrong');

      expect(result.success).toBe(false);
    });
  });

  describe('register', () => {
    it('should POST to /auth/signup', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true, data: { accessToken: 'tok' } } as any);

      await authApi.register({ name: 'Test', email: 'a@b.com', password: 'pass' });

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/signup', {
        name: 'Test',
        email: 'a@b.com',
        password: 'pass',
      });
    });
  });

  describe('logout', () => {
    it('should POST to /auth/logout', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.logout();

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('forgotPassword', () => {
    it('should POST to /auth/forgot-password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.forgotPassword('a@b.com');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'a@b.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('should POST to /auth/reset-password', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.resetPassword('token123', 'newPass');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token123',
        newPassword: 'newPass',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should POST to /auth/verify-email', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.verifyEmail('verify-token');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/verify-email', {
        token: 'verify-token',
      });
    });
  });

  describe('getProfile', () => {
    it('should GET /auth/me', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.get.mockResolvedValue({ success: true, data: { id: '1' } } as any);

      await authApi.getProfile();

      expect(mockedClient.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('updateProfile', () => {
    it('should PATCH to /users/me', async () => {
      mockedClient.patch.mockResolvedValue({
        success: true,
        data: { id: '1', name: 'Updated' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await authApi.updateProfile({ name: 'Updated' });

      expect(mockedClient.patch).toHaveBeenCalledWith('/users/me', { name: 'Updated' });
    });
  });

  describe('refreshToken', () => {
    it('should POST to /auth/refresh', async () => {
      mockedClient.post.mockResolvedValue({
        success: true,
        data: { access_token: 'new-tok' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await authApi.refreshToken('old-ref');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-ref',
      });
    });
  });

  describe('verifyOTP', () => {
    it('should POST to /auth/otp/verify', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true, data: {} } as any);

      await authApi.verifyOTP('123456');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/otp/verify', { code: '123456' });
    });
  });

  describe('resendOTP', () => {
    it('should POST to /auth/otp/send', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue({ success: true } as any);

      await authApi.resendOTP();

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/otp/send');
    });
  });

  describe('selectRole', () => {
    it('posts the chosen role and returns the flat answer with the re-minted token', async () => {
      // The endpoint answers {success, message, access_token} with no `data`
      // envelope; the token has to survive verbatim for AuthContext to adopt it.
      const answer = {
        success: true,
        message: 'Role selected successfully',
        access_token: 'fresh-access-token',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedClient.post.mockResolvedValue(answer as any);

      const result = await authApi.selectRole('creator');

      expect(mockedClient.post).toHaveBeenCalledWith('/auth/select-role', { role: 'creator' });
      expect(result).toEqual(answer);
    });
  });
});
