import { Inject, Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

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
import { SelectRoleDto } from './dto/select-role.dto.js';
import { AuthResponse } from './interfaces/auth-response.interface.js';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface.js';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { User } from '@azeebo/shared-types';

interface AuthRequest extends Request {
  user: User;
  ip?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private getUserAgent(req: AuthRequest): string | undefined {
    const headers = req.headers as unknown as Record<
      string,
      string | string[] | undefined
    >;
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
async signup(@Request() req: AuthRequest, @Body() registerDto: RegisterDto): Promise<AuthResponse> {
  return this.authService.register(registerDto, req.ip, this.getUserAgent(req));
  }

  @Post('login')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 attempts per minute
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(@Request() req: AuthRequest, @Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto, req.ip, this.getUserAgent(req));
  }

  @Post('refresh')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000) // 10 requests per minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(refreshTokenDto);
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
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
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
async resendVerification(@Request() req: AuthRequest, @Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendVerificationDto, req.ip, this.getUserAgent(req));
  }

  @Post('select-role')
  @UseGuards(RateLimitGuard)
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
}
