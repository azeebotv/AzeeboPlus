import { Controller, Post, Request, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { OtpService } from './otp.service';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

interface OtpRequest {
  body: {
    userId?: string;
    phoneNumber?: string;
    code?: string;
  };
}

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Send OTP to user phone' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendOtp(@Request() req: OtpRequest): Promise<{ message: string }> {
    const { userId, phoneNumber } = req.body;

    if (!userId || !phoneNumber) {
      throw new BadRequestException('userId and phoneNumber are required');
    }

    return this.otpService.sendOtpToUser(userId, phoneNumber);
  }

  @Post('verify')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyOtp(@Request() req: OtpRequest): Promise<{ success: boolean }> {
    const { userId, code } = req.body;

    if (!userId || !code) {
      throw new BadRequestException('userId and code are required');
    }

    await this.otpService.verifyOtp(userId, code);
    return { success: true };
  }
}
