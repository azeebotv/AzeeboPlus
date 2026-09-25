import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard.js';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';

describe('RolesGuard', () => {
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

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user: { id: string; role: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123', role: 'user' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin', 'moderator']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user: { id: string; role: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123', role: 'admin' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw ForbiddenException when user does not have required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user: { id: string; role: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123', role: 'user' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user?: { id: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not present', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => Record<string, never> } => ({
        getRequest: () => ({}),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should allow access for moderator when only moderator role is required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['moderator']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user: { id: string; role: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123', role: 'moderator' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access for creator when creator role is required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['creator']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user: { id: string; role: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123', role: 'creator' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access for user when only admin is required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

    const mockContext = {
      switchToHttp: (): { getRequest: () => { user: { id: string; role: string } } } => ({
        getRequest: () => ({ user: { id: 'user-123', role: 'user' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
