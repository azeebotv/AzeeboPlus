import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminGuard } from '@azeebo/security';

describe('Admin Authorization Tests', () => {
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
      ],
    }).compile();

    adminGuard = module.get<AdminGuard>(AdminGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  const createMockContext = (authHeader?: string, user?: any): ExecutionContext => {
    const mockReq = {
      headers: { authorization: authHeader },
      user,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => mockReq,
      }),
    } as ExecutionContext;
  };

  describe('AdminGuard - Role-based Access Control', () => {
    it('should allow admin to access protected resources', () => {
      const mockContext = createMockContext('Bearer admin-token', {
        userId: 'admin-123',
        role: 'ADMIN',
      });

      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'admin-123',
        role: 'ADMIN',
      });

      expect(adminGuard.canActivate(mockContext)).toBe(true);
    });

    it('should allow support_agent to access protected resources', () => {
      const mockContext = createMockContext('Bearer support-token', {
        userId: 'support-123',
        role: 'SUPPORT_AGENT',
      });

      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'support-123',
        role: 'SUPPORT_AGENT',
      });

      expect(adminGuard.canActivate(mockContext)).toBe(true);
    });

    it('should deny regular user from accessing protected resources', () => {
      const mockContext = createMockContext('Bearer user-token', {
        userId: 'user-123',
        role: 'USER',
      });

      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'user-123',
        role: 'USER',
      });

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should deny moderator from accessing protected resources', () => {
      const mockContext = createMockContext('Bearer moderator-token', {
        userId: 'moderator-123',
        role: 'MODERATOR',
      });

      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'moderator-123',
        role: 'MODERATOR',
      });

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should throw error when no authorization header is provided', () => {
      const mockContext = createMockContext(undefined, {});

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should throw error when authorization header has invalid format', () => {
      const mockContext = createMockContext('NotBearer token', {});

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should throw error when token is invalid', () => {
      const mockContext = createMockContext('Bearer invalid-token', {});

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});
