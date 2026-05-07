import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { RedisService } from '../../common/services/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
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
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

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
            createSession: jest.fn().mockResolvedValue(mockSession),
            findSessionByUserId: jest.fn().mockResolvedValue(null),
            deleteSessionByUserId: jest.fn().mockResolvedValue(0),
            setOtp: jest.fn().mockResolvedValue(undefined),
            getOtp: jest.fn().mockResolvedValue(null),
            deleteOtp: jest.fn().mockResolvedValue({ id: 'otp-123', userId: 'user-123', code: '1234', expiresAt: new Date() }),
            findBySocialId: jest.fn().mockResolvedValue(null),
            findSocialAccount: jest.fn().mockResolvedValue(null),
            linkSocialAccount: jest.fn().mockResolvedValue({ id: 'social-123', userId: 'user-123', provider: 'google', socialId: '12345' }),
            unlinkSocialAccount: jest.fn().mockResolvedValue(0),
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
            decode: jest.fn().mockReturnValue({ jti: 'token-123', exp: Math.floor(Date.now() / 1000) + 3600 }),
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
    delete process.env.JWT_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;
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

      await expect(service.refreshToken({ refreshToken: 'invalid-token' })).rejects.toThrow(UnauthorizedException);
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
      (jwtService.verify as jest.Mock).mockReturnValue({ jti: 'token-123', sub: 'user-123' });
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateToken('valid-token');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-123');
    });

    it('should return null for revoked token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ jti: 'token-123', sub: 'user-123' });
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
});
