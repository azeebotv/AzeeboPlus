import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
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

interface PendingState {
  provider: 'google' | 'apple';
  createdAt: number;
}

/**
 * State store for OAuth CSRF protection.
 * In-memory Map with 10-minute TTL. In production, replace with Redis-backed store
 * for multi-instance deployments.
 */
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const stateStore = new Map<string, PendingState>();

// Periodic cleanup of expired states
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of stateStore.entries()) {
    if (now - value.createdAt > STATE_TTL_MS) {
      stateStore.delete(key);
    }
  }
}, 60_000);

@Injectable()
export class SocialAuthService {
  private readonly saltRounds: number;
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 10);
  }

  // ─── State management for CSRF protection ──────────────────────────

  /**
   * Generate a random state parameter, store it with provider info and TTL,
   * and return it to the client.
   */
  generateState(provider: 'google' | 'apple'): string {
    const state = randomUUID();
    stateStore.set(state, { provider, createdAt: Date.now() });
    return state;
  }

  /**
   * Validate that the state parameter matches a pending state and hasn't expired.
   * Returns the provider if valid, throws if invalid.
   * Consumes (deletes) the state to prevent replay.
   */
  validateState(state: string): 'google' | 'apple' {
    const pending = stateStore.get(state);

    if (!pending) {
      this.logger.warn(`Social auth state validation failed: state not found or expired`);
      throw new BadRequestException('Invalid or expired state parameter');
    }

    // Check TTL
    if (Date.now() - pending.createdAt > STATE_TTL_MS) {
      stateStore.delete(state);
      this.logger.warn(`Social auth state validation failed: state expired`);
      throw new BadRequestException('Invalid or expired state parameter');
    }

    // Consume the state to prevent replay attacks
    stateStore.delete(state);

    return pending.provider;
  }

  /**
   * Build the OAuth authorization URL for the given provider.
   * The state parameter is embedded in the URL and will be returned
   * to the client's callback endpoint.
   */
  buildAuthorizeUrl(provider: 'google' | 'apple', state: string, redirectUri?: string): string {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    const appleClientId = this.configService.get<string>('APPLE_CLIENT_ID', '');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const callbackBase = `${this.configService.get<string>('BASE_URL', 'http://localhost:3000')}/auth/social/callback`;
    const callbackUrl = `${callbackBase}?provider=${provider}`;

    switch (provider) {
      case 'google': {
        const params = new URLSearchParams({
          client_id: googleClientId,
          redirect_uri: callbackUrl,
          response_type: 'code',
          scope: 'openid email profile',
          state,
          access_type: 'offline',
          prompt: 'consent',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      }
      case 'apple': {
        const params = new URLSearchParams({
          client_id: appleClientId,
          redirect_uri: callbackUrl,
          response_type: 'code id_token',
          scope: 'name email',
          state,
          response_mode: 'form_post',
        });
        return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
      }
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  // ─── Social login flow ─────────────────────────────────────────────

  async socialLogin(socialUser: SocialUser): Promise<SocialLoginResponse> {
    this.logger.log(
      `Social login attempt: provider=${socialUser.provider}, email=${socialUser.email}`
    );

    try {
      let user = await this.authRepository.findByEmail(socialUser.email);

      if (!user) {
        const existingSocialUser = await this.authRepository.findBySocialId(
          socialUser.socialId,
          socialUser.provider
        );
        if (existingSocialUser) {
          this.logger.warn(`Social login failed: social account linked to different user`);
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

        this.logger.log(`Social login success: new user created id=${user.id}`);
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

        this.logger.log(`Social login success: existing user id=${user.id}`);
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
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Social login error: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Social login failed');
    }
  }

  async unlinkSocialAccount(
    userId: string,
    provider: 'google' | 'apple'
  ): Promise<{ success: boolean }> {
    await this.authRepository.unlinkSocialAccount(userId, provider);
    return { success: true };
  }
}
