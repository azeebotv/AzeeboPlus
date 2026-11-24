import {
  Inject,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, createPublicKey } from 'crypto';
import axios from 'axios';

import { AuthRepository } from '../auth.repository.js';
import { AuthService } from '../auth.service.js';
import { RedisService } from '@azeebo/shared-services';
import { AppleClientSecretService } from './apple-client-secret.service.js';
import { assertIssuedFor, assertOidcClaims } from './oidc-claims.js';

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
  aud: string;
  /** Present on ID-token responses only; tokeninfo omits it for access tokens. */
  iss?: string;
}

interface AppleUserInfo {
  email: string;
  sub: string;
  name?: string;
}

/**
 * What a native client presents to the legacy `POST /auth/social/login` route:
 * the credential the provider itself handed it.
 */
export interface SocialCredential {
  provider: 'google' | 'apple';
  accessToken?: string;
  idToken?: string;
}

/**
 * Wire shape of that legacy route. It predates the `/callback` contract, which
 * returns the wrapped `{ success, data: { user, access_token, refresh_token } }`
 * body, so the adapter keeps the camelCase fields older clients read.
 */
export interface SocialCredentialLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string; avatar: string | null };
}

/**
 * Server-side OAuth state record (Redis, 10 min TTL, single use).
 *
 * The post-login return target lives here rather than in a provider-visible
 * query parameter, so a tampered `redirect` can never reach the callback: the
 * provider echoes only the opaque `state`, and the value it maps to is ours.
 */
export interface SocialState {
  provider: 'google' | 'apple';
  redirect?: string;
}

const STATE_TTL_SECONDS = 600; // 10 minutes
const STATE_PREFIX = 'social_state:';

/** Apple's `iss` claim on every ID token it issues. */
const APPLE_ISSUER = 'https://appleid.apple.com';

/** Google's `iss` on ID tokens; it has been issued in both forms. */
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'] as const;

@Injectable()
export class SocialAuthService {
  private readonly saltRounds: number;
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(AppleClientSecretService)
    private readonly appleClientSecret: AppleClientSecretService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 12);
  }

  // ─── OAuth token verification ──────────────────────────────────────

  async verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
    return this.fetchGoogleTokenInfo({ id_token: idToken }, 'Google token');
  }

  /**
   * The Google credential a native client holds is an OAuth **access** token,
   * not an ID token; tokeninfo accepts either. Reading it through the same
   * endpoint keeps one verification path: a token Google will not vouch for is
   * rejected here, never decoded locally.
   */
  async verifyGoogleAccessToken(accessToken: string): Promise<GoogleTokenInfo> {
    return this.fetchGoogleTokenInfo({ access_token: accessToken }, 'Google access token');
  }

  private async fetchGoogleTokenInfo(
    params: { id_token?: string; access_token?: string },
    label: string
  ): Promise<GoogleTokenInfo> {
    // Our own client id, read before calling Google so an unconfigured
    // deployment fails closed with 503 instead of skipping the audience check.
    const expectedAudience = this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
    if (!expectedAudience) {
      this.logger.error('Social auth misconfigured: google client ID is not set');
      throw new ServiceUnavailableException('google sign-in is not configured on this deployment');
    }

    try {
      const response = await axios.get<GoogleTokenInfo>('https://oauth2.googleapis.com/tokeninfo', {
        params,
        timeout: 10000,
      });

      const tokenInfo = response.data;
      if (!tokenInfo.email || !tokenInfo.email_verified) {
        throw new UnauthorizedException('Google token invalid or email not verified');
      }

      // Tokeninfo vouches that Google issued the token, not that it was issued
      // to us. Without these checks, a token minted for another app's client id
      // signs its holder in as the email it carries. Access tokens carry no `iss`
      // in tokeninfo, so they are checked for audience only.
      const googleProvider = {
        name: 'Google',
        issuers: GOOGLE_ISSUERS,
        clientId: expectedAudience,
      };
      if (params.id_token) {
        assertOidcClaims(tokenInfo, googleProvider);
      } else {
        assertIssuedFor(tokenInfo, googleProvider);
      }

      return tokenInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`${label} verification failed: ${(error as Error).message}`);
      mapAndThrow(error, 'verifying Google token');
    }
  }

  async verifyAppleToken(identityToken: string): Promise<AppleUserInfo> {
    try {
      // Decode the JWT header to get the key ID
      const headerParts = identityToken.split('.');
      if (headerParts.length !== 3) {
        throw new UnauthorizedException('Invalid Apple token format');
      }

      let header: { kid?: string };
      try {
        header = JSON.parse(Buffer.from(headerParts[0], 'base64url').toString());
      } catch {
        // allowed-fabricated-4xx: the header is caller-supplied input. An
        // unreadable one is a malformed token, not a server fault — without
        // this the 500 path was reachable from the public legacy login route
        // with any string of the form `a.b.c`.
        throw new UnauthorizedException('Invalid Apple token format');
      }
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

      // Apple's own client id — read before verifying so an unconfigured
      // deployment fails closed with 503 instead of skipping the check.
      const expectedAudience = this.appleClientSecret.getClientId();

      const applePublicKey = this.convertAppleKeyToPem(key);
      const payload = this.jwtService.verify(identityToken, {
        publicKey: applePublicKey,
        algorithms: ['RS256'],
      });

      // A valid signature only proves Apple signed *some* token: the same JWKS
      // signs ID tokens for every Apple client in the world. Without the issuer
      // and audience checks, a token minted for another developer's Services ID
      // verifies here and signs its holder into whatever account its `email` names.
      assertOidcClaims(payload, {
        name: 'Apple',
        issuers: [APPLE_ISSUER],
        clientId: expectedAudience,
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

      // A token that fails jwt verification is the caller's fault: bad
      // signature, expired, wrong algorithm. `mapAndThrow` would turn each of
      // those into a 500, so every forged token would look like a server fault.
      const jwtFailure = (error as { name?: string } | null)?.name;
      if (
        jwtFailure === 'JsonWebTokenError' ||
        jwtFailure === 'TokenExpiredError' ||
        jwtFailure === 'NotBeforeError'
      ) {
        // allowed-fabricated-4xx: jwt.verify fails only in these three ways for
        // a presented token, all caused by the token itself.
        throw new UnauthorizedException('Apple token could not be verified');
      }

      this.logger.error(`Apple token verification failed: ${(error as Error).message}`);
      mapAndThrow(error, 'verifying Apple token');
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

  async generateState(provider: 'google' | 'apple', redirect?: string): Promise<string> {
    const state = randomUUID();
    const record: SocialState = { provider };
    if (redirect) {
      // Bounded: this is attacker-influenced input being held in Redis.
      record.redirect = redirect.slice(0, 2048);
    }
    await this.redisService.set(
      `${STATE_PREFIX}${state}`,
      JSON.stringify(record),
      STATE_TTL_SECONDS
    );
    return state;
  }

  /**
   * Consumes the state record (single use) and returns what it carried.
   *
   * Legacy records written before the redirect was folded in are a bare
   * provider string, so those are still accepted — an in-flight login from a
   * rolling deploy must not fail validation.
   */
  async validateState(state: string): Promise<SocialState> {
    const raw = await this.redisService.get(`${STATE_PREFIX}${state}`);

    if (!raw) {
      this.logger.warn('Social auth state validation failed: state not found or expired');
      throw new BadRequestException('Invalid or expired state parameter');
    }

    await this.redisService.del(`${STATE_PREFIX}${state}`);

    try {
      const parsed = JSON.parse(raw) as Partial<SocialState>;
      if (parsed?.provider === 'google' || parsed?.provider === 'apple') {
        return {
          provider: parsed.provider,
          redirect: typeof parsed.redirect === 'string' ? parsed.redirect : undefined,
        };
      }
    } catch {
      // Not JSON — fall through to the legacy bare-provider form.
    }

    if (raw === 'google' || raw === 'apple') {
      return { provider: raw };
    }

    this.logger.warn('Social auth state validation failed: unreadable record');
    throw new BadRequestException('Invalid or expired state parameter');
  }

  // ─── OAuth code exchange ──────────────────────────────────────────

  async exchangeGoogleCode(code: string): Promise<{ id_token: string; access_token: string }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    // Must be byte-identical to the value used at authorize time.
    const redirectUri = this.resolveRedirectUri('google');

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
      mapAndThrow(error, 'exchanging Google authorization code');
    }
  }

  async exchangeAppleCode(code: string): Promise<{ id_token: string; access_token: string }> {
    const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
    // Apple has no static client secret — it is an ES256 JWT this service signs
    // with the .p8 key on demand (cached in-process). A static string here was
    // rejected by Apple as invalid_client every time.
    const clientSecret = this.appleClientSecret.getClientSecret();
    // Must be byte-identical to the value used at authorize time.
    const redirectUri = this.resolveRedirectUri('apple');

    // `clientSecret` needs no check: getClientSecret() either returns a signed
    // JWT or throws 503.
    if (!clientId) {
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
      mapAndThrow(error, 'exchanging Apple authorization code');
    }
  }

  /**
   * Build the OAuth authorization URL for the given provider.
   * The state parameter is embedded in the URL and will be returned
   * to the client's callback endpoint.
   */
  /**
   * The provider-facing redirect URI. Must equal the value registered in the
   * provider's console or the code exchange is rejected — so it is required
   * configuration, never derived from BASE_URL. There is deliberately no
   * default: a wrong-but-plausible URI fails at the provider with an opaque
   * error, which is worse than failing here with a deploy-shaped message.
   */
  private resolveRedirectUri(provider: 'google' | 'apple'): string {
    const value =
      provider === 'google'
        ? this.configService.get<string>('GOOGLE_REDIRECT_URI')?.trim()
        : this.configService.get<string>('APPLE_REDIRECT_URI')?.trim();
    if (!value) {
      this.logger.error(`Social auth misconfigured: ${provider} redirect URI is not set`);
      throw new ServiceUnavailableException(
        `${provider} sign-in is not configured on this deployment`
      );
    }
    return value;
  }

  private resolveClientId(provider: 'google' | 'apple'): string {
    // Previously an empty client_id was minted into the URL, which the provider
    // answers with an unhelpful invalid_client page.
    const value =
      provider === 'google'
        ? this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim()
        : this.configService.get<string>('APPLE_CLIENT_ID')?.trim();
    if (!value) {
      this.logger.error(`Social auth misconfigured: ${provider} client ID is not set`);
      throw new ServiceUnavailableException(
        `${provider} sign-in is not configured on this deployment`
      );
    }
    return value;
  }

  buildAuthorizeUrl(provider: 'google' | 'apple', state: string): string {
    const callbackUrl = this.resolveRedirectUri(provider);
    const clientId = this.resolveClientId(provider);

    switch (provider) {
      case 'google': {
        const params = new URLSearchParams({
          client_id: clientId,
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
          client_id: clientId,
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

        const password = await bcrypt.hash(randomUUID(), this.saltRounds);
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
      mapAndThrow(error, 'social login');
    }
  }

  async unlinkSocialAccount(
    userId: string,
    provider: 'google' | 'apple'
  ): Promise<{ success: boolean }> {
    await this.authRepository.unlinkSocialAccount(userId, provider);
    return { success: true };
  }

  async getConnectedAccounts(
    userId: string
  ): Promise<Array<{ id: string; provider: string; createdAt: Date }>> {
    return this.authRepository.listSocialAccounts(userId);
  }

  /**
   * Legacy `POST /auth/social/login` adapter.
   *
   * The route used to be served by a second controller whose Apple branch
   * decoded the identity token's payload and trusted it, so a hand-built JWT
   * signed anyone in as any email (AUD-85). It now runs through the verifiers
   * above — Google at tokeninfo, Apple against Apple's JWKS including the
   * `iss`/`aud` claims — and through the same account-linking flow as the
   * browser callback, so there is one sign-in implementation.
   */
  async loginWithCredential(credential: SocialCredential): Promise<SocialCredentialLoginResponse> {
    let info: { email: string; sub: string; name?: string };

    if (credential.provider === 'google') {
      if (!credential.accessToken) {
        throw new UnauthorizedException('A Google access token is required');
      }
      info = await this.verifyGoogleAccessToken(credential.accessToken);
    } else if (credential.provider === 'apple') {
      const token = credential.idToken ?? credential.accessToken;
      if (!token) {
        throw new UnauthorizedException('An Apple identity token is required');
      }
      info = await this.verifyAppleToken(token);
    } else {
      throw new BadRequestException('Unsupported provider');
    }

    const result = await this.socialLogin({
      email: info.email,
      displayName: info.name ?? `${credential.provider === 'google' ? 'Google' : 'Apple'} User`,
      socialId: info.sub,
      provider: credential.provider,
      accessToken: credential.provider === 'google' ? (credential.accessToken ?? '') : '',
      refreshToken: '',
    });

    if (!result.data) {
      // Unreachable for a successful login, but the response type keeps `data`
      // optional; a missing body must not be read as a signed-in user.
      throw new UnauthorizedException('Social login did not return a session');
    }

    return {
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      user: {
        id: result.data.user.id,
        email: result.data.user.email,
        displayName: result.data.user.displayName,
        avatar: result.data.user.avatar ?? null,
      },
    };
  }
}
