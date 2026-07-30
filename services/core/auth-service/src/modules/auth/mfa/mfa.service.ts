import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import { toDataURL } from 'qrcode';

import { AuthRepository } from '../auth.repository.js';
import { AuditLogService } from '../../audit/audit.service.js';
import { RedisService } from '@azeebo/shared-services';

const MFA_PENDING_PREFIX = 'mfa_pending:';
const MFA_PENDING_BACKUP_PREFIX = 'mfa_pending_backup:';
const MFA_PENDING_TTL = 600; // 10 minutes

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly saltRounds = 10;

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService,
    @Inject(RedisService) private readonly redisService: RedisService
  ) {}

  async generateMfaSecret(
    userId: string
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[]; hashedBackupCodes: string[] }> {
    try {
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
      const hashedBackupCodes = await Promise.all(
        backupCodes.map((code) => bcrypt.hash(code, this.saltRounds))
      );

      await this.redisService.set(`${MFA_PENDING_PREFIX}${userId}`, secret, MFA_PENDING_TTL);
      await this.redisService.set(
        `${MFA_PENDING_BACKUP_PREFIX}${userId}`,
        JSON.stringify(hashedBackupCodes),
        MFA_PENDING_TTL
      );

      return {
        secret,
        qrCode,
        backupCodes,
        hashedBackupCodes,
      };
    } catch (error) {
      this.logger.error(`Failed to generate MFA secret for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async getPendingMfaSecret(userId: string): Promise<string | null> {
    try {
      return await this.redisService.get(`${MFA_PENDING_PREFIX}${userId}`);
    } catch (error) {
      this.logger.error(`Failed to get pending MFA secret for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async clearPendingMfaSecret(userId: string): Promise<void> {
    try {
      await this.redisService.del(`${MFA_PENDING_PREFIX}${userId}`);
      await this.redisService.del(`${MFA_PENDING_BACKUP_PREFIX}${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear pending MFA secret for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async getPendingBackupCodes(userId: string): Promise<string[] | null> {
    try {
      const raw = await this.redisService.get(`${MFA_PENDING_BACKUP_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      this.logger.error(`Failed to get pending backup codes for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    try {
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
        for (let i = 0; i < backupCodes.length; i++) {
          const isMatch = await bcrypt.compare(code.toUpperCase(), backupCodes[i]);
          if (isMatch) {
            backupCodes.splice(i, 1);
            await this.authRepository.update(userId, {
              mfaBackupCodes: JSON.stringify(backupCodes),
            });
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to verify MFA code for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async enableMfa(
    userId: string,
    secret: string,
    hashedBackupCodes?: string[]
  ): Promise<{ success: boolean; mfaEnabled: boolean }> {
    try {
      await this.authRepository.update(userId, {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: hashedBackupCodes ? JSON.stringify(hashedBackupCodes) : null,
      });

      this.auditLogService.log({
        actor: userId,
        action: 'mfa.enable',
        resourceType: 'user',
        resourceId: userId,
        result: 'success',
      });

      return {
        success: true,
        mfaEnabled: true,
      };
    } catch (error) {
      this.logger.error(`Failed to enable MFA for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  async disableMfa(userId: string): Promise<{ success: boolean; mfaEnabled: boolean }> {
    try {
      await this.authRepository.update(userId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      });

      this.auditLogService.log({
        actor: userId,
        action: 'mfa.disable',
        resourceType: 'user',
        resourceId: userId,
        result: 'success',
      });

      return {
        success: true,
        mfaEnabled: false,
      };
    } catch (error) {
      this.logger.error(`Failed to disable MFA for user ${userId}`, (error as Error).stack);
      throw error;
    }
  }

  private generateBackupCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }
}
