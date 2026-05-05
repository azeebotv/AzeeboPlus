import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { toDataURL } from 'qrcode';

import { AuthRepository } from '../auth.repository';

@Injectable()
export class MfaService {
  constructor(private readonly authRepository: AuthRepository) {}

  async generateMfaSecret(
    userId: string
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
      name: `Azeebo+:${userId}`,
      issuer: 'Azeebo+',
    });
    const qrCode = await toDataURL(secret.otpauth_url as string, {
      width: 200,
    });

    const backupCodes = Array.from({ length: 5 }, () => this.generateBackupCode());

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const user = await this.authRepository.findById(userId);
    if (!user || !(user as Record<string, unknown>).mfaSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: (user as Record<string, unknown>).mfaSecret as string,
      encoding: 'base32',
      token: code,
    });
  }

  async enableMfa(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<{ success: boolean; mfaEnabled: boolean }> {
    await this.authRepository.update(userId, {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: JSON.stringify(backupCodes),
    });

    return {
      success: true,
      mfaEnabled: true,
    };
  }

  async disableMfa(userId: string): Promise<{ success: boolean; mfaEnabled: boolean }> {
    await this.authRepository.update(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
    });

    return {
      success: true,
      mfaEnabled: false,
    };
  }

  private generateBackupCode(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}
