import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { AuthRepository } from '../auth.repository';

interface SocialUser {
  email: string;
  displayName: string;
  avatar?: string | null;
  socialId: string;
  provider: 'google' | 'apple';
  accessToken: string;
  refreshToken: string;
}

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

@Injectable()
export class SocialAuthService {
  private readonly saltRounds: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 10);
  }

  async socialLogin(socialUser: SocialUser): Promise<SocialLoginResponse> {
    let user = await this.authRepository.findByEmail(socialUser.email);

    if (!user) {
      const existingSocialUser = await this.authRepository.findBySocialId(
        socialUser.socialId,
        socialUser.provider
      );
      if (existingSocialUser) {
        throw new UnauthorizedException('Social account already linked to another user');
      }

      const password = bcrypt.hashSync(randomUUID(), 10);
      user = await this.authRepository.create({
        email: socialUser.email,
        password,
        displayName: socialUser.displayName,
        avatar: socialUser.avatar ?? null,
        role: 'user',
      });

      const hashedRefreshToken = await bcrypt.hash(socialUser.refreshToken, this.saltRounds);
      await this.authRepository.linkSocialAccount(user.id, {
        ...socialUser,
        refreshToken: hashedRefreshToken,
      });
    } else {
      const existingSocial = await this.authRepository.findSocialAccount(
        user.id,
        socialUser.provider
      );
      if (!existingSocial) {
        const hashedRefreshToken = await bcrypt.hash(socialUser.refreshToken, this.saltRounds);
        await this.authRepository.linkSocialAccount(user.id, {
          ...socialUser,
          refreshToken: hashedRefreshToken,
        });
      }
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      },
    };
  }

  async unlinkSocialAccount(
    userId: string,
    provider: 'google' | 'apple'
  ): Promise<{ success: boolean }> {
    await this.authRepository.unlinkSocialAccount(userId, provider);
    return { success: true };
  }
}
