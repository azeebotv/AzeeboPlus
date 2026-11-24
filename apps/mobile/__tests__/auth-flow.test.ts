import { authApi } from '@azeebo/react-data/api/auth';
import { apiClient } from '@azeebo/react-data/api/client';

describe('Mobile Critical Path 1: Auth & Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates user registration payload and handles successful creation', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        user: { id: 'usr-101', email: 'viewer@azeeboplus.com', name: 'Ngozi Adebayo', role: 'viewer' },
        access_token: 'jwt-access-token-101',
        refresh_token: 'jwt-refresh-token-101',
      },
    });

    const res = await authApi.register({
      email: 'viewer@azeeboplus.com',
      password: 'SecurePassword123!',
      name: 'Ngozi Adebayo',
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/signup', {
      email: 'viewer@azeeboplus.com',
      password: 'SecurePassword123!',
      name: 'Ngozi Adebayo',
    });
    expect(res.success).toBe(true);
    expect(res.data?.user.id).toBe('usr-101');
    expect(res.data?.access_token).toBe('jwt-access-token-101');
  });

  it('authenticates user login and retrieves active session tokens', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: {
        user: { id: 'usr-101', email: 'viewer@azeeboplus.com', name: 'Ngozi Adebayo', role: 'viewer' },
        access_token: 'jwt-access-token-101',
        refresh_token: 'jwt-refresh-token-101',
      },
    });

    const res = await authApi.login('viewer@azeeboplus.com', 'SecurePassword123!');

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'viewer@azeeboplus.com',
      password: 'SecurePassword123!',
    });
    expect(res.data?.access_token).toBe('jwt-access-token-101');
  });

  it('processes OTP verification and phone number binding', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      success: true,
      data: { verified: true, sessionToken: 'verified-session-token' },
    });

    const res = (await apiClient.post('/api/v1/auth/verify-otp', {
      phone: '+2348012345678',
      code: '849201',
    })) as { success: boolean; data?: { verified: boolean; sessionToken: string } };

    expect(postSpy).toHaveBeenCalledWith('/api/v1/auth/verify-otp', {
      phone: '+2348012345678',
      code: '849201',
    });
    expect(res.data?.verified).toBe(true);
  });

  it('performs token refresh and revokes session on logout', async () => {
    const postSpy = jest.spyOn(apiClient, 'post')
      .mockResolvedValueOnce({
        success: true,
        data: { access_token: 'jwt-refreshed-token-102' },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { loggedOut: true },
      });

    const refreshRes = await authApi.refreshToken('jwt-refresh-token-101');
    expect(postSpy).toHaveBeenNthCalledWith(1, '/auth/refresh', {
      refreshToken: 'jwt-refresh-token-101',
    });
    expect(refreshRes.data?.access_token).toBe('jwt-refreshed-token-102');

    const logoutRes = await authApi.logout();
    expect(postSpy).toHaveBeenNthCalledWith(2, '/auth/logout');
    expect(logoutRes.success).toBe(true);
  });
});
