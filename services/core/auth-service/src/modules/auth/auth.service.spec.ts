import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { RedisService } from '../../common/services/redis.service';
import { OtpService } from './otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('./auth.repository');
jest.mock('../../common/services/redis.service');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    password: 'hashedPassword123',
    role: 'user' as const,
    avatar: null,
    mfaEnabled: false,
    mfaSecret: null,
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
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                SALT_ROUNDS: 10,
                JWT_EXPIRES_IN: '30m',
                JWT_REFRESH_EXPIRES_IN: '7d',
                REFRESH_TOKEN_EXPIRY_DAYS: 7,
                MAX_FAILED_ATTEMPTS: 5,
                LOCKOUT_DURATION_SECONDS: 900,
                OTP_EXPIRY: 300,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('should verify email with valid token', async () => {
      const userId = 'user-123';
      (redisService.get as jest.Mock).mockResolvedValue(userId);
      (redisService.del as jest.Mock).mockResolvedValue(1);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.verifyEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.verifyEmail({ token: 'valid-verification-token' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('verified');
      expect(redisService.get).toHaveBeenCalledWith('email_verification:valid-verification-token');
      expect(authRepository.verifyEmail).toHaveBeenCalledWith(userId);
    });

    it('should fail with invalid verification token', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'invalid-token' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email for existing user', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.resendVerification({ email: 'test@example.com' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('verification');
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should return success even for non-existent user (security)', async () => {
      (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.resendVerification({ email: 'nonexistent@example.com' });

      expect(result.success).toBe(true);
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });
});
