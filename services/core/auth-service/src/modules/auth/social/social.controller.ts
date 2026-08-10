import {
  Inject,
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

import { SocialAuthService } from './social.service.js';
import { RateLimitGuard, RateLimit } from '../../../common/guards/rate-limit.guard.js';
import { FeatureFlag, FeatureFlagGuard, authFlags } from '@azeebo/feature-flags';
import { SocialAuthCallbackDto, SocialAuthAuthorizeResponseDto } from '../dto/social-auth.dto.js';

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
    access_token: string;
    refresh_token: string;
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

  constructor(@Inject(SocialAuthService) private readonly socialAuthService: SocialAuthService) {}

  // ─── Authorize endpoints (initiate OAuth flow) ──────────────────────

  @Get('google/authorize')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.socialGoogle)
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
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.socialApple)
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

    // Exchange the authorization code for tokens with the OAuth provider
    // This verifies the code is valid and retrieves the id_token
    let tokenInfo: { email: string; sub: string; name?: string };

    if (provider === 'google') {
      const tokens = await this.socialAuthService.exchangeGoogleCode(dto.code);
      tokenInfo = await this.socialAuthService.verifyGoogleToken(tokens.id_token);
    } else if (provider === 'apple') {
      const tokens = await this.socialAuthService.exchangeAppleCode(dto.code);
      tokenInfo = await this.socialAuthService.verifyAppleToken(tokens.id_token);
    } else {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    const socialUser = {
      email: tokenInfo.email,
      displayName:
        dto.displayName ||
        tokenInfo.name ||
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      socialId: tokenInfo.sub,
      provider: provider as 'google' | 'apple',
      accessToken: '',
      refreshToken: '',
    };

    return this.socialAuthService.socialLogin(socialUser);
  }

  // ─── Direct login endpoints (legacy, kept for backward compat) ──────
  // NOTE: These endpoints accept idToken/identityToken directly.
  // In production, tokens should be verified against the provider's API.

  @Post('google')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900000) // 5 requests per 15 minutes
  @ApiOperation({ summary: 'Google social login (legacy - prefer /authorize + /callback)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async googleLogin(
    @Body()
    dto: {
      idToken: string;
      email: string;
      displayName?: string;
      accessToken?: string;
      refreshToken?: string;
    }
  ): Promise<SocialLoginResponse> {
    this.logger.warn('Legacy Google login endpoint used - migrate to /authorize + /callback flow');

    if (!dto.idToken) {
      throw new BadRequestException('idToken is required for Google login');
    }

    // Verify the Google token to extract email and validate authenticity
    const tokenInfo = await this.socialAuthService.verifyGoogleToken(dto.idToken);

    const socialUser = {
      email: tokenInfo.email,
      displayName: dto.displayName || tokenInfo.name || 'Google User',
      socialId: tokenInfo.sub,
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
    @Body()
    dto: {
      identityToken: string;
      email: string;
      displayName?: string;
      accessToken?: string;
      refreshToken?: string;
    }
  ): Promise<SocialLoginResponse> {
    this.logger.warn('Legacy Apple login endpoint used - migrate to /authorize + /callback flow');

    if (!dto.identityToken) {
      throw new BadRequestException('identityToken is required for Apple login');
    }

    // Verify the Apple token to extract email and validate authenticity
    const tokenInfo = await this.socialAuthService.verifyAppleToken(dto.identityToken);

    const socialUser = {
      email: tokenInfo.email,
      displayName: dto.displayName || tokenInfo.name || 'Apple User',
      socialId: tokenInfo.sub,
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
    return this.socialAuthService.unlinkSocialAccount(req.user.id, dto.provider);
  }
}
