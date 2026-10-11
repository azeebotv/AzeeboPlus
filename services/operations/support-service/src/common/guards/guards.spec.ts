import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ServiceAuthGuard, AdminGuard } from '@azeebo/security';

describe('Service Auth Guard Tests', () => {
  let authGuard: ServiceAuthGuard;
  let jwtService: JwtService;

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  };

  const mockContext = (request: unknown) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService = new JwtService({});
    authGuard = new ServiceAuthGuard(reflector as unknown as Reflector, jwtService);
  });

  it('should allow request with a valid bearer token', async () => {
    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'user-123',
      role: 'user',
      email: 'user@example.com',
    });

    const mockReq: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: 'Bearer valid-token' },
    };

    await expect(authGuard.canActivate(mockContext(mockReq))).resolves.toBe(true);
    expect(mockReq.user).toMatchObject({ id: 'user-123', sub: 'user-123', role: 'user' });
    expect(jwtService.verify).toHaveBeenCalledWith(
      'valid-token',
      expect.objectContaining({ algorithms: ['HS256'] })
    );
  });

  it('should reject request with no identity at all', async () => {
    const mockReq = { headers: {} };

    await expect(authGuard.canActivate(mockContext(mockReq))).rejects.toThrow(
      'Authentication required. No user identity found in request.'
    );
  });

  it('should reject request with invalid authorization format', async () => {
    const mockReq = { headers: { authorization: 'Invalid token' } };

    await expect(authGuard.canActivate(mockContext(mockReq))).rejects.toThrow(
      'Invalid authorization header format.'
    );
  });

  it('should reject request with an unverifiable token', async () => {
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const mockReq = { headers: { authorization: 'Bearer invalid-token' } };

    await expect(authGuard.canActivate(mockContext(mockReq))).rejects.toThrow('Invalid or expired token.');
  });
});

describe('Admin Guard Tests', () => {
  let adminGuard: AdminGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService = new JwtService({});
    adminGuard = new AdminGuard(jwtService, { allowedRoles: ['ADMIN', 'SUPPORT_AGENT'] });
  });

  it('should allow ADMIN role', () => {
    const mockReq: { headers: { authorization?: string }; user?: unknown } = {
      headers: { authorization: 'Bearer admin-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'admin-123',
      id: 'admin-123',
      role: 'ADMIN',
    });

    expect(adminGuard.canActivate(mockContext)).toBe(true);
    expect(mockReq.user).toBeDefined();
  });

  it('should allow SUPPORT_AGENT role', () => {
    const mockReq = {
      headers: { authorization: 'Bearer support-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'support-123',
      id: 'support-123',
      role: 'SUPPORT_AGENT',
    });

    expect(adminGuard.canActivate(mockContext)).toBe(true);
  });

  it('should reject regular USER role', () => {
    const mockReq = {
      headers: { authorization: 'Bearer user-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'user-123',
      id: 'user-123',
      role: 'USER',
    });

    expect(() => adminGuard.canActivate(mockContext)).toThrow('Insufficient permissions');
  });

  it('should reject user without role', () => {
    const mockReq = {
      headers: { authorization: 'Bearer token-without-role' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'user-123',
      id: 'user-123',
    });

    expect(() => adminGuard.canActivate(mockContext)).toThrow('Insufficient permissions');
  });

  it('should reject MODERATOR role for admin-only actions', () => {
    const mockReq = {
      headers: { authorization: 'Bearer moderator-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'moderator-123',
      id: 'moderator-123',
      role: 'MODERATOR',
    });

    expect(() => adminGuard.canActivate(mockContext)).toThrow('Insufficient permissions');
  });
});
