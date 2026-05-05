import { Injectable, BadRequestException } from '@nestjs/common';

import { AuthRepository } from '../auth.repository';

@Injectable()
export class OtpService {
  private readonly otpExpiry = 300; // 5 minutes

  constructor(private readonly authRepository: AuthRepository) {}

  async generateOtp(userId: string): Promise<{ otp: string; expiresAt: Date }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.otpExpiry);

    await this.authRepository.setOtp(userId, otp, expiresAt);

    return { otp, expiresAt };
  }

  async verifyOtp(userId: string, code: string): Promise<boolean> {
    const storedOtp = await this.authRepository.getOtp(userId);
    if (!storedOtp) {
      throw new BadRequestException('OTP expired or invalid');
    }

    if ((storedOtp as { code: string }).code !== code) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date() > new Date((storedOtp as { expiresAt: Date }).expiresAt)) {
      await this.authRepository.deleteOtp(userId);
      throw new BadRequestException('OTP has expired');
    }

    await this.authRepository.deleteOtp(userId);
    return true;
  }

  async sendOtpToUser(userId: string, phoneNumber: string): Promise<{ message: string }> {
    const { otp } = await this.generateOtp(userId);

    // In production, integrate with SMS provider (Twilio, Nexmo, etc.)
    // For now, just return success message
    // eslint-disable-next-line no-console
    console.log(`[OTP] Sending OTP ${otp} to ${phoneNumber}`);

    return { message: 'OTP sent successfully' };
  }
}
