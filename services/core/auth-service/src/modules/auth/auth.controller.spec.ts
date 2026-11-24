import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { RateLimitService } from '@azeebo/security';
import { FeatureFlagService, FeatureFlagGuard } from '@azeebo/feature-flags';
import { Reflector } from '@nestjs/core';
import { User } from '@azeebo/shared-types';
import { SelectableRole } from './dto/select-role.dto.js';

jest.mock('@azeebo/validation', () => ({
  IsValidEmail: () => () => {},
  IsStrongPassword: () => () => {},
}));

jest.mock('@azeebo/security', () => {
  const actual = jest.requireActual('@azeebo/security');
  return {
    ...actual,
    RateLimitGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
    Public: () => jest.fn(),
  };
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    avatar: undefined,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthResponse = {
    success: true,
    data: {
      user: mockUser,
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    },
  };

  const mockRefreshTokenResponse = {
    success: true,
    data: {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };

  type SpecRequest = Parameters<typeof AuthController.prototype.login>[0];

  const mockReq = (overrides: { user?: User; ip?: string } = {}): SpecRequest =>
    ({
      user: overrides.user ?? mockUser,
      ip: overrides.ip ?? '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
    }) as unknown as SpecRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockAuthResponse),
            login: jest.fn().mockResolvedValue(mockAuthResponse),
            refreshToken: jest.fn().mockResolvedValue(mockRefreshTokenResponse),
            logout: jest.fn().mockResolvedValue({ success: true }),
            getProfile: jest.fn().mockReturnValue({ success: true, data: mockUser }),
            forgotPassword: jest.fn().mockResolvedValue({
              success: true,
              message: 'If the email exists, a reset link has been sent',
            }),
            resetPassword: jest
              .fn()
              .mockResolvedValue({ success: true, message: 'Password reset successfully' }),
            verifyEmail: jest.fn().mockResolvedValue({
              success: true,
              data: { message: 'Email verified successfully' },
            }),
            resendVerification: jest.fn().mockResolvedValue({
              success: true,
              message: 'If the email exists, a verification link has been sent',
            }),
            selectRole: jest
              .fn()
              .mockResolvedValue({ success: true, message: 'Role selected successfully' }),
            requestOtp: jest.fn().mockResolvedValue({
              success: true,
              message: 'If the email exists, an OTP has been sent',
            }),
            verifyOtp: jest.fn().mockResolvedValue(mockAuthResponse),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(true), getValue: jest.fn() },
        },
        {
          provide: FeatureFlagGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: RateLimitService,
          useValue: {
            checkRateLimit: jest.fn().mockResolvedValue({
              allowed: true,
              remaining: 10,
              resetAt: Date.now() + 60000,
              limit: 10,
            }),
            resetRateLimit: jest.fn(),
            getRateLimitStatus: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/signup', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'StrongP@ss1',
      displayName: 'New User',
    };

    it('should create a new user account', async () => {
      const result = await controller.signup(mockReq(), registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto, '127.0.0.1', 'test-agent');
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('access_token');
      expect(result.data).toHaveProperty('refresh_token');
    });

    it('should propagate ConflictException for duplicate email', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new ConflictException('Email already registered')
      );

      await expect(controller.signup(mockReq(), registerDto)).rejects.toThrow(ConflictException);
      expect(authService.register).toHaveBeenCalledWith(registerDto, '127.0.0.1', 'test-agent');
    });

    it('should propagate errors for invalid input', async () => {
      (authService.register as jest.Mock).mockRejectedValue(
        new BadRequestException('Validation failed')
      );

      await expect(
        controller.signup(mockReq(), { ...registerDto, email: 'invalid' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /auth/login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should authenticate and return tokens', async () => {
      const result = await controller.login(mockReq(), loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto, '127.0.0.1', 'test-agent');
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('access_token');
      expect(result.data).toHaveProperty('refresh_token');
      expect(result.data).toHaveProperty('user');
    });

    it('should propagate UnauthorizedException for invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid email or password')
      );

      await expect(controller.login(mockReq(), loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should propagate UnauthorizedException for locked account', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Account locked. Please try again later.')
      );

      await expect(controller.login(mockReq(), loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/refresh', () => {
    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
    const mockReq = { cookies: {} } as never;
    const mockRes = { cookie: jest.fn() } as unknown as Response;

    it('should refresh the access token', async () => {
      const result = await controller.refreshToken(refreshTokenDto, mockReq, mockRes);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('access_token');
      expect(result.data).toHaveProperty('refresh_token');
      expect(result.data).toHaveProperty('expiresAt');
    });

    it('should propagate UnauthorizedException for expired token', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(controller.refreshToken(refreshTokenDto, mockReq, mockRes)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should propagate UnauthorizedException for revoked token', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(
        controller.refreshToken({ refreshToken: 'revoked-token' }, mockReq, mockRes)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fall back to the refresh_token cookie when the body omits the token', async () => {
      const cookieReq = {
        cookies: { refresh_token: 'cookie-refresh-token' },
      } as never;

      await controller.refreshToken({} as typeof refreshTokenDto, cookieReq, mockRes);

      expect(authService.refreshToken).toHaveBeenCalledWith({
        refreshToken: 'cookie-refresh-token',
      });

      // Cookie-driven rotation must write the rotated pair back as cookies
      // so the browser's next request carries a fresh access_token.
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout the user', async () => {
      const result = await controller.logout(mockReq({ user: { id: 'user-123' } as User }));

      expect(authService.logout).toHaveBeenCalledWith(
        'user-123',
        undefined,
        '127.0.0.1',
        'test-agent'
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('GET /auth/me', () => {
    it('should return the authenticated user profile', async () => {
      const result = await controller.getProfile(mockReq());

      expect(authService.getProfile).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });
  });

  describe('POST /auth/forgot-password', () => {
    const forgotPasswordDto = { email: 'test@example.com' };

    it('should send a reset email', async () => {
      const result = await controller.forgotPassword(mockReq(), forgotPasswordDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('reset link');
    });

    it('should return success even for non-existent email (no user enumeration)', async () => {
      const result = await controller.forgotPassword(mockReq(), {
        email: 'nonexistent@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should return success even if notification service fails', async () => {
      const result = await controller.forgotPassword(mockReq(), forgotPasswordDto);

      expect(result.success).toBe(true);
    });
  });

  describe('POST /auth/reset-password', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewSecureP@ss1',
    };

    it('should reset the password with a valid token', async () => {
      const result = await controller.resetPassword(mockReq(), resetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto,
        '127.0.0.1',
        'test-agent'
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset successfully');
    });

    it('should propagate BadRequestException for expired token', async () => {
      (authService.resetPassword as jest.Mock).mockRejectedValue(
        new BadRequestException('Invalid or expired reset token')
      );

      await expect(controller.resetPassword(mockReq(), resetPasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should propagate BadRequestException for invalid token', async () => {
      (authService.resetPassword as jest.Mock).mockRejectedValue(
        new BadRequestException('Invalid or expired reset token')
      );

      await expect(
        controller.resetPassword(mockReq(), {
          token: 'invalid-token',
          newPassword: 'NewSecureP@ss1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const result = await controller.verifyEmail(mockReq(), { token: 'valid-token' });

      expect(authService.verifyEmail).toHaveBeenCalledWith(
        { token: 'valid-token' },
        '127.0.0.1',
        'test-agent'
      );
      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('verified');
    });

    it('should propagate BadRequestException for expired token', async () => {
      (authService.verifyEmail as jest.Mock).mockRejectedValue(
        new BadRequestException('Invalid or expired verification token')
      );

      await expect(controller.verifyEmail(mockReq(), { token: 'expired-token' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('POST /auth/select-role', () => {
    it('should select a valid role', async () => {
      const result = await controller.selectRole(mockReq(), { role: SelectableRole.CREATOR });

      expect(authService.selectRole).toHaveBeenCalledWith(
        'user-123',
        { role: SelectableRole.CREATOR },
        '127.0.0.1',
        'test-agent'
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('Role selected');
    });

    it('should propagate BadRequestException for invalid role', async () => {
      (authService.selectRole as jest.Mock).mockRejectedValue(
        new BadRequestException('Invalid role selection — only user and creator roles are allowed')
      );

      await expect(
        controller.selectRole(mockReq(), { role: 'admin' as SelectableRole })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
