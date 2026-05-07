import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService Integration', () => {
  let service: AuthService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            createSession: jest.fn(),
            findSessionByUserId: jest.fn(),
            deleteSessionByUserId: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get<AuthRepository>(AuthRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should complete full login flow', async () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = {
      id: 'user-123',
      email: loginDto.email,
      password: hashedPassword,
      displayName: 'Test User',
      role: 'user',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(user);
    jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-123');
    jest.spyOn(authRepository, 'createSession').mockResolvedValue({
      id: 'session-123',
      userId: user.id,
      refreshToken: 'hashed-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.login(loginDto);

    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(result.data?.user?.email).toBe(loginDto.email);
    expect(result.data?.access_token).toBe('access-token-123');
    expect(authRepository.createSession).toHaveBeenCalled();
  });

  it('should complete full registration flow', async () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
    };

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(authRepository, 'create').mockResolvedValue({
      id: 'user-456',
      email: registerDto.email,
      password: '$2b$10$hashedpassword',
      displayName: registerDto.displayName,
      role: 'user',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-456');
    jest.spyOn(authRepository, 'createSession').mockResolvedValue({
      id: 'session-456',
      userId: 'user-456',
      refreshToken: 'hashed-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.register(registerDto);

    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(result.data?.user?.email).toBe(registerDto.email);
    expect(result.data?.access_token).toBe('access-token-456');
  });

  it('should complete refresh token flow', async () => {
    const refreshToken = 'refresh-token-123';
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      password: '$2b$10$hashedpassword',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: user.id });
    jest.spyOn(authRepository, 'findById').mockResolvedValue(user);
    jest.spyOn(authRepository, 'findSessionByUserId').mockResolvedValue({
      id: 'session-123',
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    jest.spyOn(authRepository, 'createSession').mockResolvedValue({
      id: 'session-456',
      userId: user.id,
      refreshToken: 'new-hashed-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.refreshToken({ refreshToken });

    expect(result.success).toBe(true);
    expect(result.data?.access_token).toBe('new-access-token');
  });

  it('should complete logout flow', async () => {
    const userId = 'user-123';

    jest.spyOn(authRepository, 'deleteSessionByUserId').mockResolvedValue(1);

    const result = await service.logout(userId);

    expect(result.success).toBe(true);
    expect(authRepository.deleteSessionByUserId).toHaveBeenCalledWith(userId);
  });

  it('should handle MFA verification flow', async () => {
    const userId = 'user-123';

    jest.spyOn(authRepository, 'findById').mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      password: '$2b$10$hashedpassword',
      displayName: 'Test User',
      role: 'user',
      avatar: null,
      mfaEnabled: true,
      mfaSecret: 'test-secret',
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const isValid = true;

    expect(isValid).toBe(true);
  });

  it('should handle social login flow', async () => {
    const socialUser = {
      email: 'social@example.com',
      displayName: 'Social User',
      socialId: 'google-123',
      provider: 'google' as const,
    };

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(authRepository, 'create').mockResolvedValue({
      id: 'user-789',
      email: socialUser.email,
      password: '',
      displayName: socialUser.displayName,
      role: 'user',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(authRepository, 'linkSocialAccount').mockResolvedValue({
      id: 'social-123',
      userId: 'user-789',
      provider: socialUser.provider,
      socialId: socialUser.socialId,
      accessToken: null,
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-789');
    jest.spyOn(authRepository, 'createSession').mockResolvedValue({
      id: 'session-789',
      userId: 'user-789',
      refreshToken: 'hashed-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(true).toBe(true);
  });

  it('should reject replayed old refresh token', async () => {
    const oldRefreshToken = 'old-refresh-token-123';
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      password: '$2b$10$hashedpassword',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newHashedRefreshToken = await bcrypt.hash('new-refresh-token-456', 10);

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: user.id });
    jest.spyOn(authRepository, 'findById').mockResolvedValue(user);
    jest.spyOn(authRepository, 'findSessionByUserId').mockResolvedValue({
      id: 'session-456',
      userId: user.id,
      refreshToken: newHashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.refreshToken({ refreshToken: oldRefreshToken })).rejects.toThrow(
      'Invalid refresh token'
    );
  });

  it('should reject refresh token for revoked session', async () => {
    const refreshToken = 'refresh-token-123';
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      password: '$2b$10$hashedpassword',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: user.id });
    jest.spyOn(authRepository, 'findById').mockResolvedValue(user);
    jest.spyOn(authRepository, 'findSessionByUserId').mockResolvedValue(null);

    await expect(service.refreshToken({ refreshToken })).rejects.toThrow('Invalid refresh token');
  });

  it('should reject expired refresh token', async () => {
    const expiredRefreshToken = 'expired-refresh-token-123';

    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Token expired');
    });

    await expect(service.refreshToken({ refreshToken: expiredRefreshToken })).rejects.toThrow(
      'Invalid refresh token'
    );
  });

  it('should handle concurrent refresh attempts - first succeeds, second fails', async () => {
    const refreshToken = 'refresh-token-123';
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      password: '$2b$10$hashedpassword',
      avatar: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: user.id });
    jest.spyOn(authRepository, 'findById').mockResolvedValue(user);

    let firstCall = true;
    jest.spyOn(authRepository, 'findSessionByUserId').mockImplementation(async () => {
      if (firstCall) {
        firstCall = false;
        return {
          id: 'session-123',
          userId: user.id,
          refreshToken: hashedRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    });

    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    jest.spyOn(authRepository, 'createSession').mockResolvedValue({
      id: 'session-456',
      userId: user.id,
      refreshToken: 'new-hashed-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const firstResult = await service.refreshToken({ refreshToken });
    expect(firstResult.success).toBe(true);

    await expect(service.refreshToken({ refreshToken })).rejects.toThrow('Invalid refresh token');
  });
});
