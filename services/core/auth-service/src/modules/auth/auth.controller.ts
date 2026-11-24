import { Inject, Controller, Get, Post, UseGuards, Request, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { COOKIE_OPTIONS } from './auth-cookie.controller.js';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/password-reset.dto.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import {
  RequestMagicLinkDto,
  VerifyMagicLinkDto,
  VerifyMfaLoginDto,
} from './dto/magic-link.dto.js';
import { SelectRoleDto } from './dto/select-role.dto.js';
import { AuthResponse } from './interfaces/auth-response.interface.js';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface.js';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, authFlags } from '@azeebo/feature-flags';
import { User } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: User;
  ip?: string;
  cookies?: Record<string, string>;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private getUserAgent(req: AuthRequest): string | undefined {
    const headers = req.headers as unknown as Record<string, string | string[] | undefined>;
    const value = headers['user-agent'];
    return Array.isArray(value) ? value[0] : value;
  }

  @Post('signup')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000) // 3 requests per hour
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async signup(
    @Request() req: AuthRequest,
    @Body() registerDto: RegisterDto
  ): Promise<AuthResponse> {
    return this.authService.register(registerDto, req.ip, this.getUserAgent(req));
  }

  @Post('login')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 attempts per minute
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 403,
    description: 'Email not verified (when auth_email_verification_required is on)',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(@Request() req: AuthRequest, @Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto, req.ip, this.getUserAgent(req));
  }

  @Post('refresh')
  @Public()
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.refreshRotation)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: AuthRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<RefreshTokenResponse> {
    // SPA cookie flows (admin/creator panels) send the refresh_token httpOnly
    // cookie with an empty body. Fall back to the cookie when the body omits
    // the token so the browser-only flow can rotate tokens.
    const bodyToken = refreshTokenDto?.refreshToken;
    const cookieToken = req.cookies?.['refresh_token'];
    const dto: RefreshTokenDto = bodyToken ? refreshTokenDto : { refreshToken: cookieToken ?? '' };
    const result = await this.authService.refreshToken(dto);
    // When the rotation was driven by the httpOnly cookie (no body token),
    // write the rotated pair back as cookies — otherwise the browser keeps
    // retrying with its now-stale access_token and the refresh loop never
    // converges. Body-token callers (web app stores the token itself) are
    // unaffected and keep the JSON-only contract.
    if (!bodyToken && cookieToken && result?.data?.access_token) {
      res.cookie('access_token', result.data.access_token, COOKIE_OPTIONS);
      res.cookie('refresh_token', result.data.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    return result;
  }

  @Post('logout')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async logout(@Request() req: AuthRequest): Promise<{ success: boolean }> {
    return this.authService.logout(req.user.id, undefined, req.ip, this.getUserAgent(req));
  }

  @Get('me')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async getProfile(@Request() req: AuthRequest) {
    return this.authService.getProfile(req.user);
  }

  @Post('forgot-password')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async forgotPassword(@Request() req: AuthRequest, @Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto, req.ip, this.getUserAgent(req));
  }

  @Post('reset-password')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid token or password' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async resetPassword(@Request() req: AuthRequest, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto, req.ip, this.getUserAgent(req));
  }

  @Post('verify-email')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000)
  @ApiOperation({ summary: 'Verify email address (auto-logs in with fresh tokens)' })
  @ApiResponse({ status: 200, description: 'Email verified; access + refresh tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyEmail(@Request() req: AuthRequest, @Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto, req.ip, this.getUserAgent(req));
  }

  @Post('resend-verification')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async resendVerification(
    @Request() req: AuthRequest,
    @Body() resendVerificationDto: ResendVerificationDto
  ) {
    return this.authService.resendVerification(
      resendVerificationDto,
      req.ip,
      this.getUserAgent(req)
    );
  }

  @Post('select-role')
  @UseGuards(FeatureFlagGuard, RateLimitGuard)
  @FeatureFlag(authFlags.roleSelect)
  @RateLimit(3, 3600000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select user role after registration' })
  @ApiResponse({ status: 200, description: 'Role selected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async selectRole(@Request() req: AuthRequest, @Body() selectRoleDto: SelectRoleDto) {
    return this.authService.selectRole(req.user.id, selectRoleDto, req.ip, this.getUserAgent(req));
  }

  @Post('request-otp')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000)
  @ApiOperation({ summary: 'Request an OTP code for email verification' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Post('verify-otp')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900000)
  @ApiOperation({ summary: 'Verify an OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthResponse> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('magic-link/request')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(3, 3600000) // 3 requests per hour
  @ApiOperation({ summary: 'Request a passwordless sign-in link (auth_passwordless_magic_link)' })
  @ApiResponse({ status: 200, description: 'Sign-in link sent (if the email exists)' })
  @ApiResponse({ status: 403, description: 'Passwordless login disabled' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async requestMagicLink(@Body() requestMagicLinkDto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(requestMagicLinkDto);
  }

  @Post('magic-link/verify')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900000) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Exchange a sign-in link for tokens (auth_passwordless_magic_link)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired sign-in link' })
  @ApiResponse({ status: 403, description: 'Passwordless login disabled' })
  @ApiResponse({ status: 428, description: 'MFA challenge required (admins)' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyMagicLink(@Body() verifyMagicLinkDto: VerifyMagicLinkDto): Promise<AuthResponse> {
    return this.authService.verifyMagicLink(verifyMagicLinkDto);
  }

  @Post('mfa/verify-login')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 900000) // 5 attempts per 15 minutes
  @ApiOperation({ summary: 'Complete sign-in with a TOTP code (auth_mfa_required_for_admins)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid code or expired challenge' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyMfaLogin(@Body() verifyMfaLoginDto: VerifyMfaLoginDto): Promise<AuthResponse> {
    return this.authService.verifyMfaLogin(verifyMfaLoginDto);
  }
}
