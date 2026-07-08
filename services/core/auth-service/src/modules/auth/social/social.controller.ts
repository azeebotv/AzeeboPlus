import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { SocialAuthService } from './social.service';
import { RateLimitGuard, RateLimit } from '../../../common/guards/rate-limit.guard';
import { SocialAuthCallbackDto, SocialAuthAuthorizeResponseDto } from '../dto/social-auth.dto';

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
  private readonly logger = new Logger(SocialAuthController.name);

  constructor(private readonly socialAuthService: SocialAuthService) {}

  // ─── Authorize endpoints (initiate OAuth flow) ──────────────────────

  @Get('google/authorize')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate Google OAuth flow with state parameter' })
  @ApiResponse({ status: 200, description: 'Returns state and authorization URL' })
  @ApiQuery({ name: 'redirectUri', required: false, description: 'Redirect URI' })
  async googleAuthorize(
    @Query('redirectUri') redirectUri?: string
  ): Promise<SocialAuthAuthorizeResponseDto> {
    const state = await this.socialAuthService.generateState('google');
    const authorizeUrl = this.socialAuthService.buildAuthorizeUrl('google', state, redirectUri);

    this.logger.log(`Google OAuth authorize initiated: state=${state.substring(0, 8)}...`);

    return { state, authorizeUrl };
  }

  @Get('apple/authorize')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate Apple OAuth flow with state parameter' })
  @ApiResponse({ status: 200, description: 'Returns state and authorization URL' })
  @ApiQuery({ name: 'redirectUri', required: false, description: 'Redirect URI' })
  async appleAuthorize(
    @Query('redirectUri') redirectUri?: string
  ): Promise<SocialAuthAuthorizeResponseDto> {
    const state = await this.socialAuthService.generateState('apple');
    const authorizeUrl = this.socialAuthService.buildAuthorizeUrl('apple', state, redirectUri);

    this.logger.log(`Apple OAuth authorize initiated: state=${state.substring(0, 8)}...`);

    return { state, authorizeUrl };
  }

  // ─── Callback endpoint (validate state + exchange code) ─────────────

  @Post('callback')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'OAuth callback with state validation' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid state or missing parameters' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async socialCallback(@Body() dto: SocialAuthCallbackDto): Promise<SocialLoginResponse> {
    // Check for OAuth provider error
    if (dto.error) {
      this.logger.warn(`Social callback error from provider: ${dto.error}`);
      throw new BadRequestException(`OAuth provider error: ${dto.error}`);
    }

    // Validate the state parameter (CSRF protection)
    const provider = await this.socialAuthService.validateState(dto.state);

    this.logger.log(
      `Social callback: state validated, provider=${provider}, code=${dto.code.substring(0, 8)}...`
    );

    // In production, the code would be exchanged for tokens via the provider's API
    // and the id_token would be verified to extract the email. For now, the caller
    // must supply email via the callback DTO. Reject social logins without a verified email.
    if (!dto.email) {
      throw new BadRequestException('Email is required from social provider');
    }

    const socialUser = {
      email: dto.email,
      displayName: dto.displayName || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      socialId: dto.code,
      provider: provider as 'google' | 'apple',
      accessToken: '',
      refreshToken: '',
    };

    return this.socialAuthService.socialLogin(socialUser);
  }

  // ─── Direct login endpoints (legacy, kept for backward compat) ──────

  @Post('google')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900000) // 5 requests per 15 minutes
  @ApiOperation({ summary: 'Google social login (legacy - prefer /authorize + /callback)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async googleLogin(
    @Body() dto: { idToken: string; email: string; displayName?: string; accessToken?: string; refreshToken?: string }
  ): Promise<SocialLoginResponse> {
    this.logger.warn('Legacy Google login endpoint used - migrate to /authorize + /callback flow');

    if (!dto.email) {
      throw new BadRequestException('Email is required for social login');
    }

    const socialUser = {
      email: dto.email,
      displayName: dto.displayName || 'Google User',
      socialId: dto.idToken,
      provider: 'google' as const,
      accessToken: dto.accessToken ?? '',
      refreshToken: dto.refreshToken ?? '',
    };

    return this.socialAuthService.socialLogin(socialUser);
  }

  @Post('apple')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900000) // 5 requests per 15 minutes
  @ApiOperation({ summary: 'Apple social login (legacy - prefer /authorize + /callback)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async appleLogin(
    @Body() dto: { identityToken: string; email: string; displayName?: string; accessToken?: string; refreshToken?: string }
  ): Promise<SocialLoginResponse> {
    this.logger.warn('Legacy Apple login endpoint used - migrate to /authorize + /callback flow');

    if (!dto.email) {
      throw new BadRequestException('Email is required for social login');
    }

    const socialUser = {
      email: dto.email,
      displayName: dto.displayName || 'Apple User',
      socialId: dto.identityToken,
      provider: 'apple' as const,
      accessToken: dto.accessToken ?? '',
      refreshToken: dto.refreshToken ?? '',
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
    return this.socialAuthService.unlinkSocialAccount(req.user.sub, dto.provider);
  }
}
