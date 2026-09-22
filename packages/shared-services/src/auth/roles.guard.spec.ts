import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard (shared-services)', () => {
  let guard: RolesGuard;

  const makeContext = (role: string | undefined) =>
    ({
      getHandler: () => () => undefined,
      getClass: () => Object,
      switchToHttp: () => ({
        getRequest: () => ({ user: role === undefined ? undefined : { id: 'u1', role } }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN', 'MODERATOR']),
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('accepts an uppercase role exactly as decorated', () => {
    expect(guard.canActivate(makeContext('ADMIN'))).toBe(true);
  });

  it('accepts a lowercase role from the auth DB against an uppercase decorator', () => {
    // Regression: auth-service stores 'admin'/'moderator' lowercase while
    // decorators say 'ADMIN'/'MODERATOR' — exact matching 403'd everyone.
    expect(guard.canActivate(makeContext('admin'))).toBe(true);
    expect(guard.canActivate(makeContext('moderator'))).toBe(true);
  });

  it('accepts mixed case', () => {
    expect(guard.canActivate(makeContext('Admin'))).toBe(true);
  });

  it('rejects a role outside the required list', () => {
    expect(() => guard.canActivate(makeContext('creator'))).toThrow(ForbiddenException);
  });

  it('rejects when the request has no user', () => {
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
