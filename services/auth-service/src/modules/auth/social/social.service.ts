import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService
  ) {}

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
      user = (await this.authRepository.create({
        email: socialUser.email,
        password,
        displayName: socialUser.displayName,
        avatar: socialUser.avatar,
        role: 'user',
      })) as Record<string, unknown>;

      await this.authRepository.linkSocialAccount(user.id as string, socialUser);
    } else {
      const existingSocial = await this.authRepository.findSocialAccount(
        user.id as string,
        socialUser.provider
      );
      if (!existingSocial) {
        await this.authRepository.linkSocialAccount(user.id as string, socialUser);
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
          id: user.id as string,
          email: user.email as string,
          displayName: user.displayName as string,
          avatar: user.avatar as string | null,
          role: user.role as string,
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
