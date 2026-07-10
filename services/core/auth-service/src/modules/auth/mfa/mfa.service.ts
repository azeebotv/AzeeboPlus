import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as OTPAuth from 'otpauth';
import { toDataURL } from 'qrcode';

import { AuthRepository } from '../auth.repository';
import { RedisService } from '../../../common/services/redis.service';

const MFA_PENDING_PREFIX = 'mfa_pending:';
const MFA_PENDING_TTL = 600; // 10 minutes

@Injectable()
export class MfaService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService
  ) {}

  async generateMfaSecret(
    userId: string
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const totp = new OTPAuth.TOTP({
      issuer: 'Azeebo+',
      label: userId,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();
    const qrCode = await toDataURL(otpauthUrl, { width: 200 });

    const backupCodes = Array.from({ length: 5 }, () => this.generateBackupCode());

    await this.redisService.set(`${MFA_PENDING_PREFIX}${userId}`, secret, MFA_PENDING_TTL);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  async getPendingMfaSecret(userId: string): Promise<string | null> {
    return this.redisService.get(`${MFA_PENDING_PREFIX}${userId}`);
  }

  async clearPendingMfaSecret(userId: string): Promise<void> {
    await this.redisService.del(`${MFA_PENDING_PREFIX}${userId}`);
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const user = await this.authRepository.findById(userId);
    if (!user || !user.mfaSecret) {
      return false;
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Azeebo+',
      label: userId,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta !== null) {
      return true;
    }

    if (user.mfaBackupCodes) {
      const backupCodes: string[] = JSON.parse(user.mfaBackupCodes);
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      if (codeIndex !== -1) {
        backupCodes.splice(codeIndex, 1);
        await this.authRepository.update(userId, {
          mfaBackupCodes: JSON.stringify(backupCodes),
        });
        return true;
      }
    }

    return false;
  }

  async enableMfa(
    userId: string,
    secret: string
  ): Promise<{ success: boolean; mfaEnabled: boolean }> {
    await this.authRepository.update(userId, {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: null,
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
    return randomBytes(4).toString('hex').toUpperCase();
  }
}
