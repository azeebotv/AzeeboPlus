import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { mapAndThrow, pseudonymizeIdentifier } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

import { AuthRepository } from '../auth.repository.js';

@Injectable()
export class OtpService {
  private readonly otpExpiry: number;
  private readonly saltRounds: number;
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.otpExpiry = this.configService.get<number>('OTP_EXPIRY', 300);
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 12);
  }

  async generateOtp(userId: string): Promise<{ code: string; expiresAt: Date }> {
    const otp = randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, this.saltRounds);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.otpExpiry);

    await this.authRepository.setOtp(userId, hashedOtp, expiresAt);

    return { code: otp, expiresAt };
  }

  async verifyOtp(userId: string, code: string): Promise<boolean> {
    const storedOtp = await this.authRepository.getOtp(userId);
    if (!storedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    const storedCode = (storedOtp as { code: string }).code;
    const isCodeValid = await bcrypt.compare(code, storedCode);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    const expiresAt = (storedOtp as { expiresAt: Date }).expiresAt;
    if (new Date() > new Date(expiresAt)) {
      await this.authRepository.deleteOtp(userId);
      throw new BadRequestException('OTP has expired');
    }

    await this.authRepository.deleteOtp(userId);
    return true;
  }

  async sendOtpToUser(userId: string, phoneNumber: string): Promise<{ message: string }> {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required for OTP delivery');
    }

    const { code, expiresAt } = await this.generateOtp(userId);

    try {
      const notificationServiceUrl = this.configService.get<string>(
        'NOTIFICATION_SERVICE_URL',
        'http://notification-service:3006'
      );
      await axios.post(`${notificationServiceUrl}/v1/notifications/sms`, {
        to: phoneNumber,
        template: 'otp',
        data: {
          code,
          expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
        },
      });
      this.logger.log(`OTP sent to ${pseudonymizeIdentifier(phoneNumber)}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP via notification-service: ${(error as Error).message}`);
      mapAndThrow(error, 'sending OTP');
    }

    return { message: 'OTP sent successfully' };
  }
}
