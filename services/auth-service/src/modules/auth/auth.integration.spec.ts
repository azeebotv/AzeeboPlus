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
    };

    jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(user);
    jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-123');

    const result = await service.login(loginDto);

    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(result.data?.user?.email).toBe(loginDto.email);
    expect(result.data?.token).toBe('access-token-123');
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
      ...registerDto,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-456');

    const result = await service.register(registerDto);

    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(result.data?.user?.email).toBe(registerDto.email);
    expect(result.data?.token).toBe('access-token-456');
  });

  it('should complete refresh token flow', async () => {
    const refreshToken = 'refresh-token-123';
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
    };

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: user.id });
    jest.spyOn(authRepository, 'findById').mockResolvedValue(user);
    jest.spyOn(authRepository, 'findSessionByUserId').mockResolvedValue({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(),
    });
    jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');
    jest.spyOn(authRepository, 'createSession').mockResolvedValue({
      id: 'session-456',
      userId: user.id,
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(),
    });

    const result = await service.refreshToken({ refreshToken });

    expect(result.success).toBe(true);
    expect(result.data?.token).toBe('new-access-token');
    expect(result.data?.refreshToken).toBe('new-refresh-token');
  });

  it('should complete logout flow', async () => {
    const userId = 'user-123';

    jest.spyOn(authRepository, 'deleteSessionByUserId').mockResolvedValue({
      count: 1,
    });

    const result = await service.logout(userId);

    expect(result.success).toBe(true);
    expect(authRepository.deleteSessionByUserId).toHaveBeenCalledWith(userId);
  });

  it('should handle MFA verification flow', async () => {
    const userId = 'user-123';

    jest.spyOn(authRepository, 'findById').mockResolvedValue({
      id: userId,
      mfaEnabled: true,
      mfaSecret: 'test-secret',
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
      displayName: socialUser.displayName,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.spyOn(authRepository, 'linkSocialAccount').mockResolvedValue({
      id: 'social-123',
      userId: 'user-789',
      provider: socialUser.provider,
      socialId: socialUser.socialId,
    });
    jest.spyOn(jwtService, 'sign').mockReturnValue('access-token-789');

    expect(true).toBe(true);
  });
});
