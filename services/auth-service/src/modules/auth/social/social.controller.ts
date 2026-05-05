import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { SocialAuthService } from './social.service';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard';

interface SocialLoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      displayName: string;
      avatar?: string | null;
      role: string;
    };
    token: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface UnlinkRequest {
  user: {
    id: string;
  };
}

@ApiTags('Social Auth')
@Controller('auth/social')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Post('google')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Google social login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async googleLogin(@Body() dto: { idToken: string }): Promise<SocialLoginResponse> {
    const socialUser = {
      email: 'user@gmail.com',
      displayName: 'Google User',
      socialId: dto.idToken,
      provider: 'google' as const,
    };

    return this.socialAuthService.socialLogin(socialUser);
  }

  @Post('apple')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Apple social login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async appleLogin(@Body() dto: { identityToken: string }): Promise<SocialLoginResponse> {
    const socialUser = {
      email: 'user@apple.com',
      displayName: 'Apple User',
      socialId: dto.identityToken,
      provider: 'apple' as const,
    };

    return this.socialAuthService.socialLogin(socialUser);
  }

  @Post('unlink')
  @UseGuards(AuthGuard('jwt'))
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Unlink social account' })
  @ApiResponse({ status: 200, description: 'Unlink successful' })
  async unlink(
    @Request() req: UnlinkRequest,
    @Body() dto: { provider: 'google' | 'apple' }
  ): Promise<{ success: boolean }> {
    return this.socialAuthService.unlinkSocialAccount(req.user.id, dto.provider);
  }
}
