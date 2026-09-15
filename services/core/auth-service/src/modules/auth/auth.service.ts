import {
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import { mapAndThrow } from '@azeebo/security';

import { AuthRepository } from './auth.repository.js';
import { AuditLogService } from '../audit/audit.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/password-reset.dto.js';
import { SelectRoleDto } from './dto/select-role.dto.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import {
  RequestMagicLinkDto,
  VerifyMagicLinkDto,
  VerifyMfaLoginDto,
} from './dto/magic-link.dto.js';
import { AuthResponse } from './interfaces/auth-response.interface.js';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface.js';
import { UserEntity } from './interfaces/auth-entity.interface.js';
import { User } from '@azeebo/shared-types';
import { createSuccessResponse } from '@azeebo/shared-types';
import { OtpService } from './otp/otp.service.js';
import { MfaService } from './mfa/mfa.service.js';
import { RedisService, CacheService, cacheKey } from '@azeebo/shared-services';
import { FeatureFlagService, authFlags } from '@azeebo/feature-flags';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds: number;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryDays: number;

  // Password reset tokens expire after 15 minutes and are single-use with
  // a per-token attempt budget to prevent brute-force guessing.
  private static readonly RESET_TOKEN_TTL_SECONDS = 900;
  private static readonly MAX_RESET_ATTEMPTS_PER_TOKEN = 5;
  // Email verification links expire after 1 hour and each token tolerates
  // only a few verification attempts before it is burned — see verifyEmail().
  private static readonly VERIFICATION_TOKEN_TTL_SECONDS = 3600;
  private static readonly MAX_VERIFY_ATTEMPTS_PER_TOKEN = 5;
  // Per-user cap on verification emails per hour (inbox-bombing protection).
  private static readonly MAX_VERIFICATION_RESENDS_PER_HOUR = 3;
  // Magic links are single-use and short-lived (15 minutes).
  private static readonly MAGIC_LINK_TTL_SECONDS = 900;
  // MFA login challenges expire after 10 minutes (same lifetime as the MFA
  // setup pending secret).
  private static readonly MFA_LOGIN_CHALLENGE_TTL_SECONDS = 600;
  private readonly magicLinkPrefix = 'magic_link:';
  private readonly mfaLoginChallengePrefix = 'mfa_login_challenge:';
  private readonly revokedTokensPrefix = 'revoked:';
  private readonly failedLoginPrefix = 'failed_login:';
  private readonly lockoutLevelPrefix = 'lockout_level:';
  private readonly maxFailedAttempts: number;
  // Exponential backoff tiers (seconds): 5m, 15m, 1h, 4h, 24h
  private static readonly LOCKOUT_BACKOFF_SECONDS = [300, 900, 3600, 14400, 86400];
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(OtpService) private readonly otpService: OtpService,
    @Inject(MfaService) private readonly mfaService: MfaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(CacheService) private readonly cacheService: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 10);
    this.accessTokenExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '30m');
    this.refreshTokenExpiryDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    this.maxFailedAttempts = this.configService.get<number>('MAX_FAILED_ATTEMPTS', 5);
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        {
          eventName,
          userId,
          metadata,
          timestamp: new Date().toISOString(),
        },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const existingUser = await this.findUserByEmailCached(registerDto.email);
    if (existingUser) {
      this.auditLogService.log({
        actor: null,
        action: 'registration_failed',
        resourceType: 'user',
        resourceId: registerDto.email,
        result: 'failure',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, this.saltRounds);

    const user = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    this.auditLogService.log({
      actor: user.id,
      action: 'registration',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // auth_email_verification_required: signup branches into a verification
    // step — no tokens are issued, so the user cannot log in until the email
    // is verified (login is also gated below).
    if (await this.featureFlagService.isEnabled(authFlags.emailVerificationRequired)) {
      await this.sendVerificationEmail(user);

      this.auditLogService.log({
        actor: user.id,
        action: 'registration.verification_required',
        resourceType: 'user',
        resourceId: user.id,
        result: 'success',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      this.trackAnalyticsEvent('user_registered', user.id, {
        email: user.email,
        role: user.role,
        emailVerificationRequired: true,
      });

      return createSuccessResponse({
        user: this.mapToUser(user),
        requiresEmailVerification: true,
        message: 'Registration successful. Please verify your email to sign in.',
      });
    }

    const tokens = await this.generateTokens(user);

    this.trackAnalyticsEvent('user_registered', user.id, {
      email: user.email,
      role: user.role,
    });

    return createSuccessResponse({
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.findUserByEmailCached(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const failedAttempts = await this.getFailedLoginAttempts(loginDto.email);
    if (failedAttempts >= this.maxFailedAttempts) {
      const remainingTtl = await this.getLockoutRemainingTtl(loginDto.email);
      const minutes = Math.ceil(remainingTtl / 60);
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
      );
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      await this.incrementFailedLoginAttempts(loginDto.email);
      this.auditLogService.log({
        actor: user.id,
        action: 'login.failure',
        resourceType: 'user',
        resourceId: user.id,
        result: 'failure',
        error: 'invalid_password',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      this.trackAnalyticsEvent('user_login_failed', user.id, {
        reason: 'invalid_password',
        email: loginDto.email,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.resetFailedLoginAttempts(loginDto.email);

    // auth_email_verification_required: unverified users cannot sign in — they
    // must verify via the emailed link first (registration issues no tokens).
    if (await this.featureFlagService.isEnabled(authFlags.emailVerificationRequired)) {
      if (!user.isVerified) {
        this.auditLogService.log({
          actor: user.id,
          action: 'login.blocked',
          resourceType: 'user',
          resourceId: user.id,
          result: 'failure',
          error: 'email_not_verified',
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
        this.trackAnalyticsEvent('user_login_blocked', user.id, {
          reason: 'email_not_verified',
        });
        throw new ForbiddenException(
          'Email not verified. Please verify your email before signing in.'
        );
      }
    }

    // auth_mfa_required_for_admins: admins must complete a TOTP challenge at
    // sign-in — tokens are withheld until POST /auth/mfa/verify-login succeeds.
    // Fail-closed: an admin without MFA enrolled cannot sign in (enforce via
    // the existing /auth/mfa/setup flow first).
    if (await this.featureFlagService.isEnabled(authFlags.mfaRequiredForAdmins)) {
      if (user.role === 'admin') {
        if (!user.mfaEnabled) {
          this.auditLogService.log({
            actor: user.id,
            action: 'login.blocked',
            resourceType: 'user',
            resourceId: user.id,
            result: 'failure',
            error: 'admin_mfa_not_enrolled',
            ipAddress,
            userAgent,
            timestamp: new Date(),
          });
          this.trackAnalyticsEvent('user_login_blocked', user.id, {
            reason: 'admin_mfa_not_enrolled',
          });
          throw new ForbiddenException(
            'Admins must enable MFA before signing in. Complete MFA setup in your security settings.'
          );
        }

        const challengeId = randomUUID();
        await this.redisService.set(
          `${this.mfaLoginChallengePrefix}${challengeId}`,
          user.id,
          AuthService.MFA_LOGIN_CHALLENGE_TTL_SECONDS
        );

        this.auditLogService.log({
          actor: user.id,
          action: 'login.mfa_challenge',
          resourceType: 'user',
          resourceId: user.id,
          result: 'success',
          error: JSON.stringify({ challengeId }),
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });

        throw new HttpException(
          {
            mfaRequired: true,
            method: 'totp',
            challengeId,
            message: 'MFA verification required to complete sign-in.',
          },
          HttpStatus.PRECONDITION_REQUIRED
        );
      }
    }

    this.auditLogService.log({
      actor: user.id,
      action: 'login.success',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Invalidate cached user data on login
    await this.invalidateUserCache(loginDto.email, user.id);

    const tokens = await this.generateTokens(user);

    this.trackAnalyticsEvent('user_logged_in', user.id, {
      method: 'password',
    });

    return createSuccessResponse({
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  private async getFailedLoginAttempts(email: string): Promise<number> {
    const key = `${this.failedLoginPrefix}${email}`;
    const value = await this.redisService.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  private async incrementFailedLoginAttempts(email: string): Promise<void> {
    const key = `${this.failedLoginPrefix}${email}`;
    const count = await this.redisService.incr(key);
    if (count === 1) {
      // First failure in this window — use the lockout duration based on
      // the current backoff level (exponential backoff).
      const duration = await this.computeLockoutDuration(email);
      await this.redisService.expire(key, duration);
    }
    // When the threshold is crossed, advance the lockout level so the next
    // window uses a longer duration.
    if (count === this.maxFailedAttempts) {
      await this.advanceLockoutLevel(email);
    }
  }

  /**
   * Advance the lockout level for the given email. Each level applies a
   * longer lockout duration (exponential backoff). The level persists across
   * lockout windows until the account is unlocked or the max level is reached.
   */
  private async advanceLockoutLevel(email: string): Promise<void> {
    const levelKey = `${this.lockoutLevelPrefix}${email}`;
    const currentLevel = await this.redisService.get(levelKey);
    const level = currentLevel ? parseInt(currentLevel, 10) : 0;
    const nextLevel = Math.min(level + 1, AuthService.LOCKOUT_BACKOFF_SECONDS.length - 1);
    // TTL = sum of all backoff tiers up to and including this level, so the
    // level counter lives long enough to survive the lockout window.
    const totalTtl = AuthService.LOCKOUT_BACKOFF_SECONDS.slice(0, nextLevel + 1).reduce(
      (a, b) => a + b,
      0
    );
    await this.redisService.set(levelKey, String(nextLevel), totalTtl);
  }

  private async getLockoutLevel(email: string): Promise<number> {
    const levelKey = `${this.lockoutLevelPrefix}${email}`;
    const value = await this.redisService.get(levelKey);
    return value ? parseInt(value, 10) : 0;
  }

  private async getLockoutRemainingTtl(email: string): Promise<number> {
    const key = `${this.failedLoginPrefix}${email}`;
    // Redis TTL returns -2 (key missing) or -1 (no expiry); treat as 0.
    const ttl = await this.redisService.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Compute the lockout duration for the current level. Uses exponential
   * backoff tiers: 5m → 15m → 1h → 4h → 24h.
   */
  private async computeLockoutDuration(email: string): Promise<number> {
    const level = await this.getLockoutLevel(email);
    const tiers = AuthService.LOCKOUT_BACKOFF_SECONDS;
    return tiers[Math.min(level, tiers.length - 1)];
  }

  private async resetFailedLoginAttempts(email: string): Promise<void> {
    const key = `${this.failedLoginPrefix}${email}`;
    await this.redisService.del(key);
  }

  async unlockAccount(email: string): Promise<{ success: boolean }> {
    await this.redisService.del(`${this.failedLoginPrefix}${email}`);
    await this.redisService.del(`${this.lockoutLevelPrefix}${email}`);
    return createSuccessResponse({ success: true });
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    // The DTO field is optional (cookie flows may send an empty body); an
    // undefined token simply fails verification below with the uniform 401.
    const { refreshToken = '' } = refreshTokenDto;

    // Token verification is pure client-input handling: malformed, expired,
    // or wrong-signature tokens all get the SAME 401 — leaking
    // expired-vs-unknown would enable session enumeration (HIGH-04), and JWT
    // errors are not in the error mapper's vocabulary. Verification failure is
    // the only cause in this block; the cause cannot vary → allowed marker.
    let decoded: { sub: string };
    try {
      const jwtRefreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
      decoded = this.jwtService.verify(refreshToken, {
        secret: jwtRefreshSecret,
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
        algorithms: ['HS256'],
      }) as { sub: string };
    } catch {
      // allowed-fabricated-4xx: uniform 401 for ALL token-verification
      // failures — the cause cannot vary, and the constant status is an
      // anti-enumeration invariant (HIGH-04), not an error-mapping decision.
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const user = await this.authRepository.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const session = await this.authRepository.findSessionByUserId(user.id);
      if (!session) {
        // Constant-time response: perform a dummy bcrypt compare to prevent
        // session enumeration via timing analysis (HIGH-04).
        const dummyHash = '$2b$10$dummyhashdummyhashdummyhashdummyhashdummyhashdum';
        await bcrypt.compare(refreshToken, dummyHash);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, session.refreshToken);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Invalidate old session and create new one (refresh token rotation)
      await this.authRepository.deleteSessionByUserId(user.id);
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      };
    } catch (error: unknown) {
      // Session lookup, rotation, and token generation failures map honestly:
      // a session-store outage is a 503, not a client-facing "invalid token".
      // The uniform-401 throws above rethrow unchanged through the mapper.
      mapAndThrow(error, 'refreshing session');
    }
  }

  async logout(
    userId: string,
    accessToken?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean }> {
    await this.authRepository.deleteSessionByUserId(userId);

    this.auditLogService.log({
      actor: userId,
      action: 'logout',
      resourceType: 'user',
      resourceId: userId,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Invalidate all auth caches on logout
    await this.cacheService.delete(cacheKey('auth', `permissions:${userId}`));
    await this.cacheService.delete(cacheKey('auth', `session:${userId}`));

    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken) as { jti: string; exp: number };
      if (decoded?.jti) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`${this.revokedTokensPrefix}${decoded.jti}`, '1', ttl);
        }
      }
    }

    this.trackAnalyticsEvent('user_logged_out', userId);

    return createSuccessResponse({ success: true });
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const jwtAccessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
      if (!jwtAccessSecret) return null;

      const decoded = this.jwtService.verify(token, {
        secret: jwtAccessSecret,
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
        algorithms: ['HS256'],
      }) as {
        jti: string;
        sub: string;
        type: string;
      };

      if (decoded.type !== 'access') {
        return null;
      }

      const isRevoked = await this.redisService.get(`${this.revokedTokensPrefix}${decoded.jti}`);
      if (isRevoked) {
        return null;
      }

      const user = await this.authRepository.findById(decoded.sub);
      if (!user) return null;
      return this.mapToUser(user);
    } catch (error) {
      this.logger.debug(
        `Token validation failed: ${error instanceof Error ? error.message : 'unknown'}`
      );
      return null;
    }
  }

  getProfile(user: User) {
    return createSuccessResponse(this.mapToUser(user as UserEntity));
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByEmailCached(forgotPasswordDto.email);
    if (!user) {
      this.auditLogService.log({
        actor: null,
        action: 'password_reset_requested',
        resourceType: 'user',
        resourceId: forgotPasswordDto.email,
        result: 'failure',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    this.auditLogService.log({
      actor: user.id,
      action: 'password_reset_requested',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    const resetToken = randomUUID();
    const resetTokenKey = `password_reset:${resetToken}`;
    await this.redisService.set(resetTokenKey, user.id, AuthService.RESET_TOKEN_TTL_SECONDS);

    try {
      const notificationServiceUrl = this.configService.get<string>(
        'NOTIFICATION_SERVICE_URL',
        'http://notification-service:3006'
      );
      await axios.post(`${notificationServiceUrl}/v1/notifications/email`, {
        to: user.email,
        template: 'password-reset',
        data: {
          resetToken,
          resetUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4000')}/auth/reset-password?token=${resetToken}`,
          userName: user.displayName,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    const resetTokenKey = `password_reset:${resetPasswordDto.token}`;
    const attemptsKey = `password_reset_attempts:${resetPasswordDto.token}`;

    // Per-token attempt budget: each token may be tried only a few times
    // (defense-in-depth beyond the endpoint-level IP rate limit). The counter
    // lives as long as the token and is deleted on success.
    const attempts = await this.redisService.incr(attemptsKey);
    if (attempts === 1) {
      await this.redisService.expire(attemptsKey, AuthService.RESET_TOKEN_TTL_SECONDS);
    }
    if (attempts > AuthService.MAX_RESET_ATTEMPTS_PER_TOKEN) {
      // Burn the token to prevent further guessing.
      await this.redisService.del(resetTokenKey);
      await this.redisService.del(attemptsKey);
      throw new BadRequestException('Invalid or expired reset token');
    }

    const userId = await this.redisService.get(resetTokenKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, this.saltRounds);
    await this.authRepository.updatePassword(userId, hashedPassword);

    // Single-use: delete the token and attempt counter after successful reset.
    await this.redisService.del(resetTokenKey);
    await this.redisService.del(attemptsKey);
    await this.authRepository.deleteSessionByUserId(userId);

    this.auditLogService.log({
      actor: userId,
      action: 'password.reset',
      resourceType: 'user',
      resourceId: userId,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Invalidate all auth caches on password change
    await this.cacheService.delete(cacheKey('auth', `permissions:${userId}`));
    await this.cacheService.delete(cacheKey('auth', `session:${userId}`));

    return { success: true, message: 'Password reset successfully' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    success: boolean;
    data?: {
      message: string;
      user?: User;
      access_token?: string;
      refresh_token?: string;
      expiresAt?: string;
    };
  }> {
    const verificationTokenKey = `email_verification:${verifyEmailDto.token}`;
    const attemptsKey = `email_verification_attempts:${verifyEmailDto.token}`;

    // Per-token attempt budget: each token may be tried only a few times
    // (defense-in-depth beyond the endpoint-level IP rate limit). The counter
    // lives as long as the token and is deleted on success.
    const attempts = await this.redisService.incr(attemptsKey);
    if (attempts === 1) {
      await this.redisService.expire(attemptsKey, AuthService.VERIFICATION_TOKEN_TTL_SECONDS);
    }
    if (attempts > AuthService.MAX_VERIFY_ATTEMPTS_PER_TOKEN) {
      // Burn the token: no further attempts, regardless of correctness.
      await this.redisService.del(verificationTokenKey);
      this.auditLogService.log({
        actor: null,
        action: 'email_verification_failed',
        resourceType: 'user',
        resourceId: verifyEmailDto.token,
        result: 'failure',
        error: 'too_many_attempts',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      throw new HttpException(
        'Too many verification attempts. Please request a new link.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const userId = await this.redisService.get(verificationTokenKey);

    if (!userId) {
      this.auditLogService.log({
        actor: null,
        action: 'email_verification_failed',
        resourceType: 'user',
        resourceId: verifyEmailDto.token,
        result: 'failure',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      this.auditLogService.log({
        actor: userId,
        action: 'email_verification_failed',
        resourceType: 'user',
        resourceId: userId,
        result: 'failure',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      throw new BadRequestException('User not found');
    }

    this.auditLogService.log({
      actor: userId,
      action: 'email_verified',
      resourceType: 'user',
      resourceId: userId,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    await this.authRepository.verifyEmail(userId);
    await this.redisService.del(verificationTokenKey);
    await this.redisService.del(attemptsKey);

    // Post-verification auto-login: the user just proved ownership of the
    // email, so issue tokens directly — no second sign-in needed. This works
    // whether or not auth_email_verification_required is on (verifying is
    // always a legitimate proof of identity).
    const tokens = await this.generateTokens(user);

    this.trackAnalyticsEvent('user_email_verified', userId);
    this.trackAnalyticsEvent('user_logged_in', userId, { method: 'email_verification' });

    return createSuccessResponse({
      message: 'Email verified successfully',
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  }

  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByEmailCached(resendVerificationDto.email);
    if (!user) {
      this.auditLogService.log({
        actor: null,
        action: 'verification_email_resend_failed',
        resourceType: 'user',
        resourceId: resendVerificationDto.email,
        result: 'failure',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      return { success: true, message: 'If the email exists, a verification link has been sent' };
    }

    if (user.isVerified) {
      this.auditLogService.log({
        actor: user.id,
        action: 'verification_email_resend_failed',
        resourceType: 'user',
        resourceId: user.id,
        result: 'failure',
        error: 'email_already_verified',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      return { success: true, message: 'Email is already verified' };
    }

    // Per-user resend throttle: bound token issuance per hour so an attacker
    // cannot spam a victim's inbox with verification emails (each resend
    // mints a fresh token). The endpoint-level guard is per-IP; this is per
    // user and survives IP rotation.
    const resendKey = `email_verification_resend:${user.id}`;
    const resendCount = await this.redisService.incr(resendKey);
    if (resendCount === 1) {
      await this.redisService.expire(resendKey, 3600);
    }
    if (resendCount > AuthService.MAX_VERIFICATION_RESENDS_PER_HOUR) {
      this.auditLogService.log({
        actor: user.id,
        action: 'verification_email_resend_failed',
        resourceType: 'user',
        resourceId: user.id,
        result: 'failure',
        error: 'resend_rate_limited',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      throw new HttpException(
        'Too many verification emails requested. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    this.auditLogService.log({
      actor: user.id,
      action: 'verification_email_resended',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    await this.sendVerificationEmail(user);

    return { success: true, message: 'If the email exists, a verification link has been sent' };
  }

  /**
   * Stores a fresh verification token in Redis and asks notification-service
   * to email the verification link. Failures are logged but never thrown so
   * signup/resend never fail hard on email delivery.
   */
  private async sendVerificationEmail(user: UserEntity): Promise<void> {
    const verificationToken = randomUUID();
    const verificationKey = `email_verification:${verificationToken}`;
    await this.redisService.set(
      verificationKey,
      user.id,
      AuthService.VERIFICATION_TOKEN_TTL_SECONDS
    );

    try {
      const notificationServiceUrl = this.configService.get<string>(
        'NOTIFICATION_SERVICE_URL',
        'http://notification-service:3006'
      );
      await axios.post(`${notificationServiceUrl}/v1/notifications/email`, {
        to: user.email,
        template: 'email-verification',
        data: {
          verificationToken,
          verificationUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4000')}/auth/verify-email?token=${verificationToken}`,
          displayName: user.displayName,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async selectRole(
    userId: string,
    selectRoleDto: SelectRoleDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const allowedRoles = ['user', 'creator'];
    if (!allowedRoles.includes(selectRoleDto.role)) {
      throw new BadRequestException(
        'Invalid role selection — only user and creator roles are allowed'
      );
    }

    await this.authRepository.updateRole(userId, selectRoleDto.role);

    this.auditLogService.log({
      actor: userId,
      action: 'role.change',
      resourceType: 'user',
      resourceId: userId,
      result: 'success',
      error: JSON.stringify({ role: selectRoleDto.role }),
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    this.trackAnalyticsEvent('user_role_selected', userId, {
      role: selectRoleDto.role,
    });

    return { success: true, message: 'Role selected successfully' };
  }

  async requestOtp(requestOtpDto: RequestOtpDto): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByEmailCached(requestOtpDto.email);
    if (!user) {
      return { success: true, message: 'If the email exists, an OTP has been sent' };
    }

    await this.otpService.generateOtp(user.id);
    return { success: true, message: 'If the email exists, an OTP has been sent' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponse> {
    const user = await this.findUserByEmailCached(verifyOtpDto.email);
    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    await this.otpService.verifyOtp(user.id, verifyOtpDto.code);

    const tokens = await this.generateTokens(user);

    return createSuccessResponse({
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  async requestMagicLink(
    requestMagicLinkDto: RequestMagicLinkDto
  ): Promise<{ success: boolean; message: string }> {
    // Fail-closed: the endpoint only exists while the flag is on.
    if (!(await this.featureFlagService.isEnabled(authFlags.passwordlessMagicLink))) {
      throw new ForbiddenException('Passwordless login is not available');
    }

    const user = await this.findUserByEmailCached(requestMagicLinkDto.email);
    if (!user) {
      // Never reveal whether the account exists.
      return {
        success: true,
        message: 'If the email exists, a sign-in link has been sent',
      };
    }

    const token = randomUUID();
    await this.redisService.set(
      `${this.magicLinkPrefix}${token}`,
      user.id,
      AuthService.MAGIC_LINK_TTL_SECONDS
    );

    try {
      const notificationServiceUrl = this.configService.get<string>(
        'NOTIFICATION_SERVICE_URL',
        'http://notification-service:3006'
      );
      await axios.post(`${notificationServiceUrl}/v1/notifications/email`, {
        to: user.email,
        template: 'magic-link',
        data: {
          magicLinkUrl: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4000')}/auth/magic-link?token=${token}`,
          displayName: user.displayName,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send magic link email: ${error instanceof Error ? error.message : String(error)}`
      );
      await this.redisService.del(`${this.magicLinkPrefix}${token}`);
      mapAndThrow(error, 'sending magic-link email');
    }

    this.auditLogService.log({
      actor: user.id,
      action: 'magic_link.requested',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'If the email exists, a sign-in link has been sent',
    };
  }

  async verifyMagicLink(verifyMagicLinkDto: VerifyMagicLinkDto): Promise<AuthResponse> {
    if (!(await this.featureFlagService.isEnabled(authFlags.passwordlessMagicLink))) {
      throw new ForbiddenException('Passwordless login is not available');
    }

    const key = `${this.magicLinkPrefix}${verifyMagicLinkDto.token}`;
    const userId = await this.redisService.get(key);
    if (!userId) {
      throw new BadRequestException('Invalid or expired sign-in link');
    }

    // Single-use: burn the link before issuing tokens.
    await this.redisService.del(key);

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired sign-in link');
    }

    // MFA challenge still applies to admins on passwordless sign-in.
    if (await this.featureFlagService.isEnabled(authFlags.mfaRequiredForAdmins)) {
      if (user.role === 'admin' && user.mfaEnabled) {
        const challengeId = randomUUID();
        await this.redisService.set(
          `${this.mfaLoginChallengePrefix}${challengeId}`,
          user.id,
          AuthService.MFA_LOGIN_CHALLENGE_TTL_SECONDS
        );
        throw new HttpException(
          {
            mfaRequired: true,
            method: 'totp',
            challengeId,
            message: 'MFA verification required to complete sign-in.',
          },
          HttpStatus.PRECONDITION_REQUIRED
        );
      }
    }

    const tokens = await this.generateTokens(user);

    this.auditLogService.log({
      actor: user.id,
      action: 'login.success',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      error: JSON.stringify({ method: 'magic_link' }),
      timestamp: new Date(),
    });
    this.trackAnalyticsEvent('user_logged_in', user.id, {
      method: 'magic_link',
    });

    return createSuccessResponse({
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  async verifyMfaLogin(verifyMfaLoginDto: VerifyMfaLoginDto): Promise<AuthResponse> {
    const key = `${this.mfaLoginChallengePrefix}${verifyMfaLoginDto.challengeId}`;
    const userId = await this.redisService.get(key);
    if (!userId) {
      throw new UnauthorizedException('MFA challenge expired. Please sign in again.');
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      await this.redisService.del(key);
      throw new UnauthorizedException('MFA challenge expired. Please sign in again.');
    }

    const valid = await this.mfaService.verifyMfaCode(user.id, verifyMfaLoginDto.code);
    if (!valid) {
      this.auditLogService.log({
        actor: user.id,
        action: 'login.mfa_failed',
        resourceType: 'user',
        resourceId: user.id,
        result: 'failure',
        error: 'invalid_totp_code',
        timestamp: new Date(),
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Burn the challenge — the login completes now.
    await this.redisService.del(key);

    const tokens = await this.generateTokens(user);

    this.auditLogService.log({
      actor: user.id,
      action: 'login.success',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      error: JSON.stringify({ method: 'password_mfa' }),
      timestamp: new Date(),
    });
    this.trackAnalyticsEvent('user_logged_in', user.id, {
      method: 'password_mfa',
    });

    return createSuccessResponse({
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  async generateTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }> {
    const jwtAccessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const jwtRefreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const now = Math.floor(Date.now() / 1000);
    const accessToken = this.jwtService.sign(
      {
        iss: this.configService.get<string>('JWT_ISSUER', 'azeebo-auth'),
        aud: this.configService.get<string>('JWT_AUDIENCE', 'azeebo-api'),
        jti: randomUUID(),
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
        iat: now,
      } as Record<string, unknown>,
      {
        expiresIn: this.accessTokenExpiry as StringValue,
        secret: jwtAccessSecret,
      }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    const refreshToken = this.jwtService.sign(
      {
        iss: this.configService.get<string>('JWT_ISSUER', 'azeebo-auth'),
        aud: this.configService.get<string>('JWT_AUDIENCE', 'azeebo-api'),
        jti: randomUUID(),
        sub: user.id,
        type: 'refresh',
        iat: now,
      } as Record<string, unknown>,
      {
        expiresIn: `${this.refreshTokenExpiryDays}d` as StringValue,
        secret: jwtRefreshSecret,
      }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, this.saltRounds);

    const MAX_SESSIONS = 5;
    const activeSessions = await this.authRepository.countSessionsByUserId(user.id);
    if (activeSessions >= MAX_SESSIONS) {
      const sessionsToRevoke = activeSessions - MAX_SESSIONS + 1;
      await this.authRepository.deleteOldestSessions(user.id, sessionsToRevoke);
    }

    await this.authRepository.createSession({
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt,
    });

    // Cache session for faster lookups
    const sessionCacheK = cacheKey('auth', `session:${user.id}`);
    await this.cacheService.set(
      sessionCacheK,
      {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        expiresAt: expiresAt.toISOString(),
      },
      1800
    );

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private mapToUser(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      avatar: entity.avatar ?? undefined,
      role: entity.role as User['role'],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private async findUserByEmailCached(email: string): Promise<UserEntity | null> {
    const cacheK = cacheKey('auth', `user:${email}`);
    const cached = await this.cacheService.get<UserEntity>(cacheK);
    if (cached) return cached;
    const user = await this.authRepository.findByEmail(email);
    if (user) {
      await this.cacheService.set(cacheK, user, 300);
    }
    return user;
  }

  private async invalidateUserCache(email: string, userId: string): Promise<void> {
    await this.cacheService.delete(cacheKey('auth', `user:${email}`));
    await this.cacheService.delete(cacheKey('auth', `permissions:${userId}`));
  }
}
