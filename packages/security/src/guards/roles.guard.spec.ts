import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const createContext = (user?: { role?: string }): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('should allow routes without @Roles metadata', () => {
    expect(guard.canActivate(createContext({ role: 'user' }))).toBe(true);
  });

  it('should allow a user holding one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['moderator', 'admin']);

    const context = createContext({ role: 'moderator' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should let admins through any role gate', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['moderator']);

    expect(guard.canActivate(createContext({ role: 'admin' }))).toBe(true);
  });

  it('should reject a user without a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['moderator', 'admin']);

    expect(() => guard.canActivate(createContext({ role: 'user' }))).toThrow(ForbiddenException);
  });

  it('should reject unauthenticated requests on gated routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['moderator']);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext({}))).toThrow(ForbiddenException);
  });
});
