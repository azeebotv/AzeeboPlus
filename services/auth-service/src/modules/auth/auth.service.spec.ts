import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: AuthRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(authRepository, 'create').mockResolvedValue({
        id: 'user-123',
        ...registerDto,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.token).toBeDefined();
    });

    it('should throw conflict exception if email exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue({
        id: 'user-123',
        ...registerDto,
        role: 'user',
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user-123',
        email: loginDto.email,
        password: '$2b$10$examplehashedpassword',
        role: 'user',
      };

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(user);
      jest.spyOn(service as Record<string, unknown>, 'generateTokens').mockReturnValue({
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresAt: '1h',
      });

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.token).toBe('jwt-token');
    });

    it('should throw unauthorized exception if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw unauthorized exception if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 'user-123',
        email: loginDto.email,
        password: '$2b$10$examplehashedpassword',
        role: 'user',
      };

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
