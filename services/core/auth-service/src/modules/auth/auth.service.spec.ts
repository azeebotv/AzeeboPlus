import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { RedisService } from '@azeebo/shared-services';
import { OtpService } from './otp/otp.service.js';
import { MfaService } from './mfa/mfa.service.js';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { CacheService } from '@azeebo/shared-services';
import { AuditLogService } from '../audit/audit.service.js';
import { FeatureFlagService, authFlags } from '@azeebo/feature-flags';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('./auth.repository');
jest.mock('@azeebo/shared-services', () => {
  const actual = jest.requireActual('@azeebo/shared-services');
  return {
    ...actual,
    RedisService: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      exists: jest.fn(),
    })),
    CacheService: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    })),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;
  let mfaService: { verifyMfaCode: jest.Mock };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    password: 'hashedPassword123',
    role: 'user' as const,
    avatar: null,
    mfaEnabled: false,
    mfaSecret: null,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'hashed-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-for-access-tokens-min-32-chars';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-refresh-tokens-min-32';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: mockFeatureFlagService,
        },
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn().mockResolvedValue(null),
            findById: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            updatePassword: jest.fn().mockResolvedValue(mockUser),
            createSession: jest.fn().mockResolvedValue(mockSession),
            findSessionByUserId: jest.fn().mockResolvedValue(null),
            deleteSessionByUserId: jest.fn().mockResolvedValue(0),
            countSessionsByUserId: jest.fn().mockResolvedValue(0),
            deleteOldestSessions: jest.fn().mockResolvedValue(0),
            setOtp: jest.fn().mockResolvedValue(undefined),
            getOtp: jest.fn().mockResolvedValue(null),
            deleteOtp: jest.fn().mockResolvedValue({
              id: 'otp-123',
              userId: 'user-123',
              code: '1234',
              expiresAt: new Date(),
            }),
            findBySocialId: jest.fn().mockResolvedValue(null),
            findSocialAccount: jest.fn().mockResolvedValue(null),
            linkSocialAccount: jest.fn().mockResolvedValue({
              id: 'social-123',
              userId: 'user-123',
              provider: 'google',
              socialId: '12345',
            }),
            unlinkSocialAccount: jest.fn().mockResolvedValue(0),
            verifyEmail: jest.fn().mockResolvedValue(mockUser),
            updateRole: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(0),
            incr: jest.fn().mockResolvedValue(0),
            expire: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('access-token'),
            verify: jest.fn().mockReturnValue({ sub: 'user-123', type: 'refresh' }),
            decode: jest
              .fn()
              .mockReturnValue({ jti: 'token-123', exp: Math.floor(Date.now() / 1000) + 3600 }),
          },
        },
        {
          provide: OtpService,
          useValue: {
            generateOtp: jest.fn().mockResolvedValue({ otp: '123456', expiresAt: new Date() }),
            verifyOtp: jest.fn().mockResolvedValue(true),
            sendOtpToUser: jest.fn().mockResolvedValue({ message: 'OTP sent' }),
          },
        },
        {
          provide: MfaService,
          useValue: {
            verifyMfaCode: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                SALT_ROUNDS: 10,
                JWT_EXPIRES_IN: '30m',
                JWT_REFRESH_EXPIRES_IN: '7d',
                JWT_ACCESS_SECRET: 'test-jwt-secret-for-access-tokens-min-32-chars',
                JWT_REFRESH_SECRET: 'test-refresh-secret-for-refresh-tokens-min-32',
                JWT_AUDIENCE: 'azeebo-api',
                JWT_ISSUER: 'azeebo-auth',
                REFRESH_TOKEN_EXPIRY_DAYS: 7,
                MAX_FAILED_ATTEMPTS: 5,
                LOCKOUT_DURATION_SECONDS: 900,
                OTP_EXPIRY: 300,
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, unknown> = {
                JWT_REFRESH_SECRET: 'test-refresh-secret-for-refresh-tokens-min-32',
                JWT_ACCESS_SECRET: 'test-jwt-secret-for-access-tokens-min-32-chars',
                JWT_AUDIENCE: 'azeebo-api',
                JWT_ISSUER: 'azeebo-auth',
              };
              if (config[key] === undefined) {
                throw new Error(`Missing required config: ${key}`);
              }
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    mfaService = module.get(MfaService);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // clearAllMocks keeps implementations — reset the default (flag OFF) so
    // verification-flag tests don't leak into later tests.
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      displayName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (authRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.createSession as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('access_token');
      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(authRepository.create).toHaveBeenCalled();
    });

    it('should fail if user already exists', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should require email verification and issue no tokens when the flag is on', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (authRepository.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('requiresEmailVerification', true);
      expect(result.data).not.toHaveProperty('access_token');
      expect(result.data).not.toHaveProperty('refresh_token');
      // A verification token was stored (1h expiry) and emailed.
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^email_verification:/),
        mockUser.id,
        3600
      );
      expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(
        authFlags.emailVerificationRequired
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.createSession as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('access_token');
    });

    it('should fail with invalid password', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should fail with non-existent user', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should block login for an unverified user when the flag is on', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      (authRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should allow login for a verified user when the flag is on', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.createSession as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('access_token');
    });

    it('should allow login for an unverified user when the flag is off (default)', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });
      (authRepository.createSession as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('access_token');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully with rotation', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedToken = { sub: 'user-123', type: 'refresh' };
      const newRefreshToken = 'new-refresh-token';

      (jwtService.verify as jest.Mock).mockReturnValue(decodedToken);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.findSessionByUserId as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (authRepository.deleteSessionByUserId as jest.Mock).mockResolvedValue(1);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce(newRefreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');
      (authRepository.createSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        id: 'new-session-123',
        refreshToken: 'new-hashed-refresh-token',
      });

      const result = await service.refreshToken({ refreshToken });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('access_token', 'new-access-token');
      expect(result.data).toHaveProperty('refresh_token', newRefreshToken);
      expect(authRepository.deleteSessionByUserId).toHaveBeenCalledWith('user-123');
      expect(authRepository.createSession).toHaveBeenCalled();
    });

    it('should fail with invalid refresh token signature', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken({ refreshToken: 'invalid-token' })).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should fail with non-existent user', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedToken = { sub: 'user-123', type: 'refresh' };

      (jwtService.verify as jest.Mock).mockReturnValue(decodedToken);
      (authRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshToken({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });

    it('should fail with no session found', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedToken = { sub: 'user-123', type: 'refresh' };

      (jwtService.verify as jest.Mock).mockReturnValue(decodedToken);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.findSessionByUserId as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshToken({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });

    it('should fail with mismatched refresh token (replay attack)', async () => {
      const refreshToken = 'stolen-refresh-token';
      const decodedToken = { sub: 'user-123', type: 'refresh' };

      (jwtService.verify as jest.Mock).mockReturnValue(decodedToken);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.findSessionByUserId as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshToken({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully and delete session', async () => {
      (authRepository.deleteSessionByUserId as jest.Mock).mockResolvedValue(1);

      const result = await service.logout('user-123');

      expect(result.success).toBe(true);
      expect(authRepository.deleteSessionByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should revoke access token if provided', async () => {
      (authRepository.deleteSessionByUserId as jest.Mock).mockResolvedValue(1);

      const result = await service.logout('user-123', 'access-token');

      expect(result.success).toBe(true);
      expect(redisService.set).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should return user for valid token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        jti: 'token-123',
        sub: 'user-123',
        type: 'access',
      });
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateToken('valid-token');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
    });

    it('should return null for revoked token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        jti: 'token-123',
        sub: 'user-123',
        type: 'access',
      });
      (redisService.get as jest.Mock).mockResolvedValue('1');

      const result = await service.validateToken('revoked-token');

      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for existing user', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.forgotPassword({ email: 'test@example.com' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('reset link');
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should return success even for non-existent user (security)', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(result.success).toBe(true);
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const userId = 'user-123';
      (redisService.get as jest.Mock).mockResolvedValue(userId);
      (redisService.del as jest.Mock).mockResolvedValue(1);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.updatePassword as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.resetPassword({
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      });

      expect(result.success).toBe(true);
      expect(redisService.get).toHaveBeenCalledWith('password_reset:valid-reset-token');
      expect(redisService.del).toHaveBeenCalled();
      expect(authRepository.updatePassword).toHaveBeenCalledWith(userId, 'newHashedPassword');
    });

    it('should fail with invalid or expired token', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', newPassword: 'NewPassword123!' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token and auto-login with fresh tokens', async () => {
      const userId = 'user-123';
      (redisService.get as jest.Mock).mockResolvedValue(userId);
      (redisService.del as jest.Mock).mockResolvedValue(1);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.verifyEmail as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.verifyEmail({ token: 'valid-verification-token' });

      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('verified');
      expect(redisService.get).toHaveBeenCalledWith('email_verification:valid-verification-token');
      expect(authRepository.verifyEmail).toHaveBeenCalledWith(userId);
      // The per-token attempt counter is cleared on success.
      expect(redisService.del).toHaveBeenCalledWith(
        'email_verification_attempts:valid-verification-token'
      );
      // Post-verification auto-login: fresh tokens are issued (a session is
      // created via generateTokens) so the user doesn't sign in again.
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.data).toHaveProperty('access_token', 'access-token');
      expect(result.data).toHaveProperty('refresh_token', 'access-token');
      expect(result.data).toHaveProperty('user');
      expect(authRepository.createSession).toHaveBeenCalled();
    });

    it('should fail with invalid verification token', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'invalid-token' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('should count failed attempts against the token', async () => {
      // First attempt on this token: the counter gets the token's 1h TTL.
      (redisService.incr as jest.Mock).mockResolvedValue(1);
      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'attempted-token' })).rejects.toThrow(
        BadRequestException
      );

      expect(redisService.expire).toHaveBeenCalledWith(
        'email_verification_attempts:attempted-token',
        3600
      );
    });

    it('should burn the token after too many attempts (429)', async () => {
      (redisService.incr as jest.Mock).mockResolvedValue(6);

      const error = await service.verifyEmail({ token: 'burned-token' }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);

      // The token is revoked so no further attempts can succeed.
      expect(redisService.del).toHaveBeenCalledWith('email_verification:burned-token');
      expect(redisService.get).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('should return success for existing user (email sent via notification-service)', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });

      const result = await service.resendVerification({ email: 'test@example.com' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('verification');
    });

    it('should return success even for non-existent user (security)', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.resendVerification({ email: 'nonexistent@example.com' });

      expect(result.success).toBe(true);
    });

    it('should rate-limit resends per user (429)', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });
      (redisService.incr as jest.Mock).mockResolvedValue(4);

      const error = await service
        .resendVerification({ email: 'test@example.com' })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('magic link (auth_passwordless_magic_link)', () => {
    beforeEach(() => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === authFlags.passwordlessMagicLink)
      );
      (mockedAxios.post as jest.Mock).mockResolvedValue({ status: 200, data: {} });
    });

    it('rejects the request when the flag is off', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(false);
      await expect(service.requestMagicLink({ email: 'test@example.com' })).rejects.toThrow(
        ForbiddenException
      );
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('sends a magic link email and stores a single-use token', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.requestMagicLink({ email: 'test@example.com' });

      expect(result.success).toBe(true);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^magic_link:/),
        mockUser.id,
        900
      );
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/notifications/email'),
        expect.objectContaining({ template: 'magic-link' })
      );
    });

    it('does not reveal whether the account exists', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.requestMagicLink({ email: 'ghost@example.com' });

      expect(result.success).toBe(true);
      expect(redisService.set).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('verifies a valid link and issues tokens (link burned)', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(mockUser.id);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.verifyMagicLink({ token: 'valid-token-123456789' });

      expect(redisService.del).toHaveBeenCalledWith(expect.stringMatching(/^magic_link:/));
      expect(result.data).toHaveProperty('access_token');
    });

    it('rejects an unknown/expired link', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyMagicLink({ token: 'dead-token-1234567890' })).rejects.toThrow(
        BadRequestException
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('admin MFA enforcement (auth_mfa_required_for_admins)', () => {
    const adminUser = { ...mockUser, role: 'admin' as const };

    it('blocks an admin without MFA enrolled when the flag is on (fail-closed)', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === authFlags.mfaRequiredForAdmins)
      );
      (authRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...adminUser,
        mfaEnabled: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'admin@example.com', password: 'Password123!' })
      ).rejects.toThrow(ForbiddenException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('returns a 428 challenge for an admin with MFA enrolled instead of tokens', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === authFlags.mfaRequiredForAdmins)
      );
      (authRepository.findByEmail as jest.Mock).mockResolvedValue({
        ...adminUser,
        mfaEnabled: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      const error = await service
        .login({ email: 'admin@example.com', password: 'Password123!' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(428);
      const body = (error as HttpException).getResponse() as {
        mfaRequired: boolean;
        challengeId: string;
      };
      expect(body.mfaRequired).toBe(true);
      expect(body.challengeId).toBeTruthy();
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^mfa_login_challenge:/),
        adminUser.id,
        600
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('lets a non-admin sign in normally when the flag is on', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === authFlags.mfaRequiredForAdmins)
      );
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.createSession as jest.Mock).mockResolvedValue(mockSession);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('verifyMfaLogin', () => {
    it('completes sign-in with a valid TOTP code and burns the challenge', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(mockUser.id);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      mfaService.verifyMfaCode.mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const result = await service.verifyMfaLogin({
        challengeId: 'challenge-123456789',
        code: '123456',
      });

      expect(redisService.del).toHaveBeenCalledWith(expect.stringMatching(/^mfa_login_challenge:/));
      expect(result.data).toHaveProperty('access_token');
    });

    it('rejects an expired/unknown challenge', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyMfaLogin({ challengeId: 'gone-1234567890', code: '123456' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an invalid TOTP code', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(mockUser.id);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      mfaService.verifyMfaCode.mockResolvedValue(false);

      await expect(
        service.verifyMfaLogin({ challengeId: 'challenge-123456789', code: '000000' })
      ).rejects.toThrow(UnauthorizedException);
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });
});
