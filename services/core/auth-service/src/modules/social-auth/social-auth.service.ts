import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocialProvider, SocialLoginDto } from './dto/social-login.dto.js';

interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: SocialProvider;
}

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Verify social login and create/login user
   */
  async socialLogin(dto: SocialLoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; displayName: string | null; avatar: string | null };
  }> {
    try {
      // Verify the social token and get user info
      const userInfo = await this.verifySocialToken(dto);

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: userInfo.email },
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: userInfo.email,
            displayName: userInfo.name,
            avatar: userInfo.picture || null,
            isVerified: true, // Social accounts are pre-verified
            password: '', // No password for social users
          },
        });
        this.logger.log(`Created new user from social login: ${user.id}`);
      }

      // Link social account if not already linked
      await this.linkSocialAccount(user.id, userInfo);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      this.logger.error('Social login failed:', error);
      mapAndThrow(error, 'social login');
    }
  }

  /**
   * Verify social token based on provider
   */
  private async verifySocialToken(dto: SocialLoginDto): Promise<SocialUserInfo> {
    switch (dto.provider) {
      case SocialProvider.GOOGLE:
        return this.verifyGoogleToken(dto.accessToken);
      case SocialProvider.APPLE:
        return this.verifyAppleToken(dto.idToken || dto.accessToken);
      default:
        throw new UnauthorizedException('Unsupported social provider');
    }
  }

  /**
   * Verify Google OAuth token
   */
  private async verifyGoogleToken(accessToken: string): Promise<SocialUserInfo> {
    // In production, verify with Google's token info endpoint
    // https://oauth2.googleapis.com/tokeninfo?access_token=ACCESS_TOKEN
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const data = await response.json();

    return {
      id: data.sub,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      picture: data.picture,
      provider: SocialProvider.GOOGLE,
    };
  }

  /**
   * Verify Apple ID token
   */
  private async verifyAppleToken(idToken: string): Promise<SocialUserInfo> {
    // In production, verify Apple's JWT token
    // Decode the JWT and verify signature with Apple's public keys
    try {
      // For now, decode the JWT payload (in production, verify signature)
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        provider: SocialProvider.APPLE,
      };
    } catch {
      throw new UnauthorizedException('Invalid Apple token');
    }
  }

  /**
   * Link social account to user
   */
  private async linkSocialAccount(userId: string, userInfo: SocialUserInfo): Promise<void> {
    try {
      await this.prisma.socialAccount.upsert({
        where: {
          userId_provider: {
            userId,
            provider: userInfo.provider,
          },
        },
        update: {
          accessToken: '', // Not stored in production
        },
        create: {
          userId,
          provider: userInfo.provider,
          socialId: userInfo.id,
          accessToken: '', // Not stored in production
        },
      });
    } catch (error) {
      this.logger.error('Failed to link social account:', error);
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: {
    id: string;
    email: string;
    role?: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Get connected social accounts for a user
   */
  async getConnectedAccounts(
    userId: string
  ): Promise<Array<{ id: string; provider: string; createdAt: Date }>> {
    return this.prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        createdAt: true,
      },
    });
  }

  /**
   * Unlink social account
   */
  async unlinkAccount(userId: string, provider: SocialProvider): Promise<void> {
    await this.prisma.socialAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }
}
