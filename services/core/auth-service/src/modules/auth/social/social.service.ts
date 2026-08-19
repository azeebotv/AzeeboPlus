import {
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, createPublicKey } from 'crypto';
import axios from 'axios';

import { AuthRepository } from '../auth.repository.js';
import { AuthService } from '../auth.service.js';
import { RedisService } from '@azeebo/shared-services';

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
    access_token: string;
    refresh_token: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface GoogleTokenInfo {
  email: string;
  email_verified: string;
  name: string;
  picture: string;
  sub: string;
}

interface AppleUserInfo {
  email: string;
  sub: string;
  name?: string;
}

const STATE_TTL_SECONDS = 600; // 10 minutes
const STATE_PREFIX = 'social_state:';

@Injectable()
export class SocialAuthService {
  private readonly saltRounds: number;
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RedisService) private readonly redisService: RedisService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 10);
  }

  // ─── OAuth token verification ──────────────────────────────────────

  async verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
    try {
      const response = await axios.get<GoogleTokenInfo>('https://oauth2.googleapis.com/tokeninfo', {
        params: { id_token: idToken },
        timeout: 10000,
      });

      const tokenInfo = response.data;
      if (!tokenInfo.email || !tokenInfo.email_verified) {
        throw new UnauthorizedException('Google token invalid or email not verified');
      }

      return tokenInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Google token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  async verifyAppleToken(identityToken: string): Promise<AppleUserInfo> {
    try {
      // Decode the JWT header to get the key ID
      const headerParts = identityToken.split('.');
      if (headerParts.length !== 3) {
        throw new UnauthorizedException('Invalid Apple token format');
      }

      const header = JSON.parse(Buffer.from(headerParts[0], 'base64url').toString());
      const kid = header.kid;

      // Fetch Apple's public keys
      const keysResponse = await axios.get('https://appleid.apple.com/auth/keys', {
        timeout: 10000,
      });
      const keys = keysResponse.data.keys;

      // Find the matching key
      const key = keys.find((k: { kid: string }) => k.kid === kid);
      if (!key) {
        throw new UnauthorizedException('Apple signing key not found');
      }

      // Verify the token signature using the public key
      // For simplicity, we'll use jwt.verify with the Apple public key
      const applePublicKey = this.convertAppleKeyToPem(key);
      const payload = this.jwtService.verify(identityToken, {
        publicKey: applePublicKey,
        algorithms: ['RS256'],
      });

      if (!payload.email) {
        throw new UnauthorizedException('Apple token does not contain email');
      }

      return {
        email: payload.email,
        sub: payload.sub,
        name: payload.name,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Apple token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Failed to verify Apple token');
    }
  }

  private convertAppleKeyToPem(key: { kty: string; n: string; e: string }): string {
    // Convert Apple's JWK to PEM format for JWT verification
    const publicKey = createPublicKey({
      key: {
        kty: key.kty,
        n: key.n,
        e: key.e,
        alg: 'RS256',
        use: 'sig',
      },
      format: 'jwk',
    });
    return publicKey.export({ type: 'spki', format: 'pem' }) as string;
  }

  // ─── State management for CSRF protection ──────────────────────────

  async generateState(provider: 'google' | 'apple'): Promise<string> {
    const state = randomUUID();
    await this.redisService.set(`${STATE_PREFIX}${state}`, provider, STATE_TTL_SECONDS);
    return state;
  }

  async validateState(state: string): Promise<'google' | 'apple'> {
    const provider = (await this.redisService.get(`${STATE_PREFIX}${state}`)) as
      | 'google'
      | 'apple'
      | null;

    if (!provider) {
      this.logger.warn('Social auth state validation failed: state not found or expired');
      throw new BadRequestException('Invalid or expired state parameter');
    }

    await this.redisService.del(`${STATE_PREFIX}${state}`);
    return provider;
  }

  // ─── OAuth code exchange ──────────────────────────────────────────

  async exchangeGoogleCode(code: string): Promise<{ id_token: string; access_token: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>(
      'GOOGLE_REDIRECT_URI',
      `${this.configService.get<string>('BASE_URL', 'http://localhost:3000')}/auth/social/callback?provider=google`
    );

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth credentials not configured');
    }

    try {
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        }
      );

      return {
        id_token: response.data.id_token,
        access_token: response.data.access_token,
      };
    } catch (error) {
      this.logger.error(`Google code exchange failed: ${error}`);
      throw new UnauthorizedException('Failed to exchange Google authorization code');
    }
  }

  async exchangeAppleCode(code: string): Promise<{ id_token: string; access_token: string }> {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('APPLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>(
      'APPLE_REDIRECT_URI',
      `${this.configService.get<string>('BASE_URL', 'http://localhost:3000')}/auth/social/callback?provider=apple`
    );

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Apple OAuth credentials not configured');
    }

    try {
      const response = await axios.post(
        'https://appleid.apple.com/auth/token',
        new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        }
      );

      return {
        id_token: response.data.id_token,
        access_token: response.data.access_token,
      };
    } catch (error) {
      this.logger.error(`Apple code exchange failed: ${error}`);
      throw new UnauthorizedException('Failed to exchange Apple authorization code');
    }
  }

  /**
   * Build the OAuth authorization URL for the given provider.
   * The state parameter is embedded in the URL and will be returned
   * to the client's callback endpoint.
   */
  buildAuthorizeUrl(provider: 'google' | 'apple', state: string, redirectUri?: string): string {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    const appleClientId = this.configService.get<string>('APPLE_CLIENT_ID', '');

    const callbackBase = `${this.configService.get<string>('BASE_URL', 'http://localhost:3000')}/auth/social/callback`;
    const callbackUrl = `${callbackBase}?provider=${provider}`;

    // Validate redirectUri against an allowlist to prevent open redirect attacks
    if (redirectUri) {
      const allowedRedirectHosts = this.configService
        .get<string>('SOCIAL_AUTH_ALLOWED_REDIRECT_HOSTS', '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);

      if (allowedRedirectHosts.length > 0) {
        try {
          const redirectHost = new URL(redirectUri).host;
          if (!allowedRedirectHosts.includes(redirectHost)) {
            this.logger.warn(
              `Rejected social auth redirect to non-allowed host: ${redirectHost}`
            );
            throw new BadRequestException('Redirect URI is not on the allowed list');
          }
        } catch (e) {
          if (e instanceof BadRequestException) throw e;
          throw new BadRequestException('Invalid redirect URI');
        }
      }
    }

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

        const password = await bcrypt.hash(randomUUID(), 10);
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

      const tokens = await this.authService.generateTokens(user);

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
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
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
