import { Test, TestingModule } from '@nestjs/testing';
import { MfaService } from './mfa.service';
import { AuthRepository } from '../auth.repository';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

jest.mock('speakeasy');
jest.mock('qrcode');

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
          provide: AuthRepository,
          useValue: authRepository,
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
      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        ascii: 'secret',
        otpauth_url: 'otpauth://totp/Test',
        base32: 'JBSWY3DPEHPK3PXP',
      });
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,...');

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
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.verifyMfaCode('user-123', code);

      expect(result).toBe(true);
    });

    it('should fail with invalid code', async () => {
      authRepository.findById.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      });
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

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

      const result = await service.enableMfa('user-123', 'JBSWY3DPEHPK3PXP', ['CODE1', 'CODE2']);

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
