/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('Authorization Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user?: { id: string; role?: string }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  describe('Admin Authorization', () => {
    it('should allow admin access to admin-only endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      const context = createMockContext({ id: 'admin-123', role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny non-admin access to admin-only endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      const context = createMockContext({ id: 'user-123', role: 'user' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow admin access to wallet audit endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      const context = createMockContext({ id: 'admin-456', role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny support access to admin-only wallet audit', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      const context = createMockContext({ id: 'support-123', role: 'support' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Support Authorization', () => {
    it('should allow support access to support endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support']);
      const context = createMockContext({ id: 'support-123', role: 'support' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny user access to support endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support']);
      const context = createMockContext({ id: 'user-123', role: 'user' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow admin access to support endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support']);
      const context = createMockContext({ id: 'admin-123', role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow support to access payment refund endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support', 'admin']);
      const context = createMockContext({ id: 'support-456', role: 'support' });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Moderation Authorization', () => {
    it('should allow moderator access to moderation endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['moderator']);
      const context = createMockContext({ id: 'mod-123', role: 'moderator' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny user access to moderation endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['moderator']);
      const context = createMockContext({ id: 'user-123', role: 'user' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow admin access to moderation endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['moderator']);
      const context = createMockContext({ id: 'admin-123', role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Creator Authorization', () => {
    it('should allow creator access to payout endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['creator']);
      const context = createMockContext({ id: 'creator-123', role: 'creator' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny user access to creator payout endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['creator']);
      const context = createMockContext({ id: 'user-123', role: 'user' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow creator access to content publishing endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['creator', 'admin']);
      const context = createMockContext({ id: 'creator-456', role: 'creator' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow admin access to creator endpoints', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['creator']);
      const context = createMockContext({ id: 'admin-123', role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Support Decisions Authorization', () => {
    it('should allow support to make support decisions', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support', 'admin']);
      const context = createMockContext({ id: 'support-123', role: 'support' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow admin to make support decisions', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support', 'admin']);
      const context = createMockContext({ id: 'admin-123', role: 'admin' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny moderator access to support decisions', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['support', 'admin']);
      const context = createMockContext({ id: 'mod-123', role: 'moderator' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Multi-Role Authorization', () => {
    it('should allow access when user has any of multiple required roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin', 'support', 'moderator']);
      const context = createMockContext({ id: 'support-123', role: 'support' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access when user has none of multiple required roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin', 'support', 'moderator']);
      const context = createMockContext({ id: 'user-123', role: 'user' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no role property', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      const context = createMockContext({ id: 'user-123' });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle request with no user', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      const context = createMockContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle empty roles array', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);
      const context = createMockContext({ id: 'user-123', role: 'user' });
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
