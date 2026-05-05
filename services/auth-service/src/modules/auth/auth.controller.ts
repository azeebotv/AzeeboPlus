import { Controller, Get, Post, UseGuards, Request, Delete, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface';
import { RateLimitGuard, RateLimit } from '../../common/guards/rate-limit.guard';

interface RequestUser {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: string;
}

interface AuthRequest extends Request {
  user: RequestUser;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async signup(@Request() req: AuthRequest): Promise<AuthResponse> {
    return this.authService.register(req.body as RegisterDto);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(@Request() req: AuthRequest): Promise<AuthResponse> {
    return this.authService.login(req.body as LoginDto);
  }

  @Post('refresh-token')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async refreshToken(@Request() req: AuthRequest): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(req.body as RefreshTokenDto);
  }

  @Delete('logout')
  @UseGuards(AuthGuard('jwt'))
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async logout(@Request() req: AuthRequest): Promise<{ success: boolean }> {
    return this.authService.logout(req.user.id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  getProfile(@Request() req: AuthRequest): {
    id: string;
    email: string;
    displayName: string;
    avatar: string | null;
    role: string;
  } {
    return this.authService.getProfile(req.user);
  }
}
