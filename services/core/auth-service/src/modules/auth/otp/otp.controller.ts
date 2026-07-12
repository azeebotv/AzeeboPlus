import { Inject, Controller, Post, Request, BadRequestException, UseGuards  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { OtpService } from './otp.service.js';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard.js';

interface OtpRequest {
  user: { sub: string; id: string };
  body: {
    userId?: string;
    phoneNumber?: string;
    code?: string;
  };
}

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(@Inject(OtpService) private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @ApiOperation({ summary: 'Send OTP to user phone' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendOtp(@Request() req: OtpRequest): Promise<{ message: string }> {
    const { phoneNumber } = req.body;
    const userId = req.user.id;

    if (!phoneNumber) {
      throw new BadRequestException('phoneNumber is required');
    }

    return this.otpService.sendOtpToUser(userId, phoneNumber);
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyOtp(@Request() req: OtpRequest): Promise<{ success: boolean }> {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      throw new BadRequestException('code is required');
    }

    await this.otpService.verifyOtp(userId, code);
    return { success: true };
  }
}
