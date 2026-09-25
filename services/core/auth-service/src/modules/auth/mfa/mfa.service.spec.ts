import { Test, TestingModule } from '@nestjs/testing';
import { MfaService } from './mfa.service.js';
import { AuthRepository } from '../auth.repository.js';
import { RedisService } from '@azeebo/shared-services';
import { AuditLogService } from '../../audit/audit.service.js';

jest.mock('otpauth', () => {
  const mockSecret = { base32: 'JBSWY3DPEHPK3PXP' };
  const mockValidate = jest.fn().mockReturnValue(0);
  return {
    __esModule: true,
    Secret: {
      fromBase32: jest.fn().mockReturnValue(mockSecret),
    },
    TOTP: jest.fn().mockImplementation(() => ({
      secret: mockSecret,
      toString: jest.fn().mockReturnValue('otpauth://totp/Test:user-123'),
      validate: mockValidate,
    })),
    _mockValidate: mockValidate,
  };
});

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,...'),
}));

describe('MfaService', () => {
  let service: MfaService;
  let authRepository: jest.Mocked<AuthRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    password: 'hashed-password',
    role: 'user',
    avatar: null,
    isVerified: false,
    mfaEnabled: false,
    mfaSecret: null,
    mfaBackupCodes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    authRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        {
          provide: AuditLogService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: AuthRepository,
          useValue: authRepository,
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMfaSecret', () => {
    it('should generate MFA secret successfully', async () => {
      const result = await service.generateMfaSecret('user-123');

      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('backupCodes');
    });
  });

  describe('verifyMfaCode', () => {
    const code = '123456';

    it('should verify MFA code successfully', async () => {
      authRepository.findById.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      });

      const result = await service.verifyMfaCode('user-123', code);

      expect(result).toBe(true);
    });

    it('should fail with invalid code', async () => {
      const OTPAuth = require('otpauth');
      OTPAuth._mockValidate.mockReturnValue(null);

      authRepository.findById.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      });

      const result = await service.verifyMfaCode('user-123', code);

      expect(result).toBe(false);
    });

    it('should fail when user not found', async () => {
      authRepository.findById.mockResolvedValue(null);

      const result = await service.verifyMfaCode('user-123', code);

      expect(result).toBe(false);
    });
  });

  describe('enableMfa', () => {
    it('should enable MFA successfully', async () => {
      authRepository.update.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      });

      const result = await service.enableMfa('user-123', 'JBSWY3DPEHPK3PXP');

      expect(result.success).toBe(true);
      expect(result.mfaEnabled).toBe(true);
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA successfully', async () => {
      authRepository.update.mockResolvedValue({
        ...mockUser,
        mfaEnabled: false,
        mfaSecret: null,
      });

      const result = await service.disableMfa('user-123');

      expect(result.success).toBe(true);
      expect(result.mfaEnabled).toBe(false);
    });
  });
});
