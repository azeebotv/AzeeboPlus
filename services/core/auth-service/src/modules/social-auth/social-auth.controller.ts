import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service.js';
import { SocialLoginDto, SocialProvider } from './dto/social-login.dto.js';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';

@ApiTags('Social Auth')
@Controller('auth/social')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Post('login')
  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit(10, 60000)
  @ApiOperation({ summary: 'Login with social provider (Google/Apple)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid social credentials' })
  async socialLogin(@Body() dto: SocialLoginDto) {
    return this.socialAuthService.socialLogin(dto);
  }

  @Get('google/authorize')
  @Public()
  @ApiOperation({ summary: 'Get Google OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Authorization URL' })
  async googleAuthorize(@Query('redirect_uri') redirectUri: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const scope = 'openid email profile';
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `access_type=offline`;

    return { url: authUrl };
  }

  @Get('apple/authorize')
  @Public()
  @ApiOperation({ summary: 'Get Apple OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Authorization URL' })
  async appleAuthorize(@Query('redirect_uri') redirectUri: string) {
    const clientId = process.env.APPLE_CLIENT_ID;
    const scope = 'name email';
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

    const authUrl =
      `https://appleid.apple.com/auth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code id_token&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `response_mode=form_post`;

    return { url: authUrl };
  }

  @Get('accounts')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected social accounts' })
  @ApiResponse({ status: 200, description: 'List of connected accounts' })
  async getConnectedAccounts(@Request() req: { user: { id: string } }) {
    return this.socialAuthService.getConnectedAccounts(req.user.id);
  }

  @Post('unlink')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, 60000)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink social account' })
  @ApiResponse({ status: 200, description: 'Account unlinked' })
  async unlinkAccount(
    @Request() req: { user: { id: string } },
    @Body('provider') provider: SocialProvider
  ) {
    await this.socialAuthService.unlinkAccount(req.user.id, provider);
    return { success: true };
  }
}
