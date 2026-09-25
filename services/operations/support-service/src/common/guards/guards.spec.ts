import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from '@azeebo/security';

describe('Auth Guard Tests', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should allow authenticated user', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockReq: { headers: { authorization?: string }; user?: any } = {
      headers: { authorization: 'Bearer valid-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockReturnValue({
      sub: 'user-123',
      id: 'user-123',
      role: 'user',
    });

    expect(authGuard.canActivate(mockContext)).toBe(true);
    expect(mockReq.user).toBeDefined();
  });

  it('should reject request without authorization header', () => {
    const mockReq = {
      headers: {},
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    expect(() => authGuard.canActivate(mockContext)).toThrow('Missing authorization header');
  });

  it('should reject request with invalid authorization format', () => {
    const mockReq = {
      headers: { authorization: 'Invalid token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    expect(() => authGuard.canActivate(mockContext)).toThrow('Invalid authorization format');
  });

  it('should reject request with invalid token', () => {
    const mockReq = {
      headers: { authorization: 'Bearer invalid-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;

    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => authGuard.canActivate(mockContext)).toThrow('Invalid or expired token');
  });
});

describe('Admin Guard Tests', () => {
  let adminGuard: AdminGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AdminGuard,
          useFactory: (jwtService: JwtService) =>
            new AdminGuard(jwtService, { allowedRoles: ['ADMIN', 'SUPPORT_AGENT'] }),
          inject: [JwtService],
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
      ],
    }).compile();

    adminGuard = module.get<AdminGuard>(AdminGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should allow ADMIN role', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockReq: { headers: { authorization?: string }; user?: any } = {
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
