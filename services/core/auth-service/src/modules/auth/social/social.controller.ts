import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  Res,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { SocialAuthService } from './social.service.js';
import { RateLimitGuard, RateLimit } from '../../../common/guards/rate-limit.guard.js';
import {
  FeatureFlag,
  FeatureFlagGuard,
  FeatureFlagService,
  authFlags,
} from '@azeebo/feature-flags';
import { Public } from '@azeebo/security';
import {
  SocialAuthAuthorizeDto,
  SocialAuthCallbackDto,
  SocialAuthAuthorizeResponseDto,
} from '../dto/social-auth.dto.js';
import { SocialLoginDto, SocialProvider } from '../dto/social-login.dto.js';

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
  /**
   * Post-login destination resolved from the state record. Unvalidated here by
   * design: the web callback applies `safeRedirectTarget` before navigating, so
   * the allowlist lives in exactly one place.
   */
  redirect?: string;
  error?: {
    code: string;
    message: string;
  };
}

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

/**
 * The single route table for `/auth/social`.
 *
 * There used to be two controllers bound to this prefix — this one, registered
 * by `AuthModule`, and a second `SocialAuthController` registered by a separate
 * `SocialAuthModule` with its own service. Nest resolves overlapping routes by
 * module registration order, so the second table's `google/authorize`,
 * `apple/authorize` and `unlink` never ran while its `login` and `accounts` did,
 * and the two halves verified providers differently: the legacy Apple branch
 * decoded the identity token's payload without checking Apple's signature.
 *
 * Every social route now lives here and delegates to the one verified
 * `SocialAuthService`. Nothing else in the service may declare
 * `@Controller('auth/social')`; `social.route-table.spec.ts` pins that.
 */
@ApiTags('Social Auth')
@Controller('auth/social')
export class SocialAuthController {
  private readonly logger = new Logger(SocialAuthController.name);

  constructor(
    @Inject(SocialAuthService) private readonly socialAuthService: SocialAuthService,
    @Inject(FeatureFlagService) private readonly featureFlags: FeatureFlagService
  ) {}

  // ─── Authorize endpoints (initiate OAuth flow) ──────────────────────

  @Get('google/authorize')
  @Public()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.socialGoogle)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate Google OAuth flow (302 to the provider by default)' })
  @ApiResponse({ status: 302, description: 'Redirects the browser to Google' })
  @ApiResponse({ status: 200, description: 'JSON {state, authorizeUrl} when ?format=json' })
  @ApiResponse({ status: 503, description: 'Provider not configured on this deployment' })
  @ApiQuery({ name: 'redirect', required: false, description: 'Post-login destination' })
  @ApiQuery({ name: 'format', required: false, enum: ['json'], description: 'Return JSON' })
  async googleAuthorize(
    @Query() query: SocialAuthAuthorizeDto,
    @Res() res: Response
  ): Promise<void> {
    await this.startAuthorization('google', query, res);
  }

  @Get('apple/authorize')
  @Public()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.socialApple)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'Initiate Apple OAuth flow (302 to the provider by default)' })
  @ApiResponse({ status: 302, description: 'Redirects the browser to Apple' })
  @ApiResponse({ status: 200, description: 'JSON {state, authorizeUrl} when ?format=json' })
  @ApiResponse({ status: 503, description: 'Provider not configured on this deployment' })
  @ApiQuery({ name: 'redirect', required: false, description: 'Post-login destination' })
  @ApiQuery({ name: 'format', required: false, enum: ['json'], description: 'Return JSON' })
  async appleAuthorize(
    @Query() query: SocialAuthAuthorizeDto,
    @Res() res: Response
  ): Promise<void> {
    await this.startAuthorization('apple', query, res);
  }

  /**
   * Shared browser entry point.
   *
   * A login page's first action must be a plain navigation, so the default is a
   * 302 to the provider. The JSON shape is retained behind `?format=json` for
   * non-browser callers that resolve the URL themselves.
   *
   * `@Public()` matters here: these routes are the ones a signed-out visitor
   * hits first, and the global `ServiceAuthGuard` would otherwise answer with a
   * 401 before the provider redirect is ever built.
   */
  private async startAuthorization(
    provider: 'google' | 'apple',
    query: SocialAuthAuthorizeDto,
    res: Response
  ): Promise<void> {
    const state = await this.socialAuthService.generateState(provider, query.redirect);
    const authorizeUrl = this.socialAuthService.buildAuthorizeUrl(provider, state);

    this.logger.log(`${provider} OAuth authorize initiated: state=${state.substring(0, 8)}...`);

    if (query.format === 'json') {
      const body: SocialAuthAuthorizeResponseDto = { state, authorizeUrl };
      res.json(body);
      return;
    }

    // 302, not 303: the provider expects a GET with no body, and a 303 would
    // invite a follow-up method switch that OAuth authorization endpoints
    // reject.
    res.redirect(302, authorizeUrl);
  }

  // ─── Callback endpoint (validate state + exchange code) ─────────────

  @Post('callback')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'OAuth callback with state validation' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid state or missing parameters' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async socialCallback(@Body() dto: SocialAuthCallbackDto): Promise<SocialLoginResponse> {
    // Check for OAuth provider error. This is reachable now that `code` is
    // optional when `error` is present (see SocialAuthCallbackDto).
    if (dto.error) {
      this.logger.warn(`Social callback error from provider: ${dto.error}`);
      // Fixed message: the provider string is caller-supplied and has no place
      // in a response body. The raw value is logged above for diagnosis.
      throw new BadRequestException('The provider reported an error for this sign-in');
    }

    // Validation guarantees a code on every non-error callback; the type is
    // optional only because the error branch above arrives without one.
    if (!dto.code) {
      throw new BadRequestException('Authorization code is required');
    }

    // Validate the state parameter (CSRF protection). This also consumes the
    // record, so a replayed callback cannot reuse it.
    const stateRecord = await this.socialAuthService.validateState(dto.state);
    const provider = stateRecord.provider;

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

    const result = await this.socialAuthService.socialLogin(socialUser);

    // The return target rides back to the browser client from the state record
    // rather than from a provider-visible parameter it could tamper with.
    return { ...result, redirect: stateRecord.redirect };
  }

  // ─── Direct login endpoints (legacy, kept for backward compat) ──────
  // NOTE: These endpoints accept idToken directly. It is verified with the
  // provider before any account is touched. The legacy Apple direct-login route
  // was retired: Apple sign-in goes through /apple/authorize + /callback.

  /**
   * Combined legacy entry point (`{ provider, accessToken | idToken }`), kept
   * because the gateway still advertises it to older native clients.
   *
   * It used to be served by the duplicate controller, whose Apple branch never
   * verified the token's signature (AUD-85 in audit.md): any hand-built JWT
   * signed its holder in as the account its `email` claim named. The route now
   * delegates to `loginWithCredential`, which runs the same verifiers as the
   * browser callback.
   */
  @Post('login')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Social login with a provider credential (legacy)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid social credentials' })
  @ApiResponse({ status: 403, description: 'Provider disabled by kill-switch' })
  async socialLogin(@Body() dto: SocialLoginDto) {
    const provider: 'google' | 'apple' =
      dto.provider === SocialProvider.GOOGLE ? 'google' : 'apple';

    // The route carries both providers in its body, so a single `@FeatureFlag`
    // cannot gate it: check the flag for the provider actually named.
    await this.assertProviderEnabled(provider);

    this.logger.warn(
      `Legacy social login used (provider=${provider}) - migrate to /authorize + /callback flow`
    );

    return this.socialAuthService.loginWithCredential({
      provider,
      accessToken: dto.accessToken,
      idToken: dto.idToken,
    });
  }

  @Post('google')
  @Public()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.socialGoogle)
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

  // ─── Account linking ────────────────────────────────────────────────

  @Get('accounts')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected social accounts' })
  @ApiResponse({ status: 200, description: 'List of connected accounts' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getConnectedAccounts(@Request() req: AuthenticatedRequest) {
    return this.socialAuthService.getConnectedAccounts(req.user.id);
  }

  @Post('unlink')
  @UseGuards(AuthGuard('jwt'), RateLimitGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink social account' })
  @ApiResponse({ status: 200, description: 'Unlink successful' })
  async unlink(
    @Request() req: AuthenticatedRequest,
    @Body() dto: { provider: 'google' | 'apple' }
  ): Promise<{ success: boolean }> {
    return this.socialAuthService.unlinkSocialAccount(req.user.id, dto.provider);
  }

  /**
   * Provider-specific kill-switch for routes whose decorator can only name one
   * flag (the combined legacy login). Throws 403 like `FeatureFlagGuard`.
   */
  private async assertProviderEnabled(provider: 'google' | 'apple'): Promise<void> {
    const flag = provider === 'google' ? authFlags.socialGoogle : authFlags.socialApple;
    if (!(await this.featureFlags.isEnabled(flag))) {
      throw new ForbiddenException(`${provider} sign-in is disabled`);
    }
  }
}
