import {
  Inject,
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';

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
import { AuthResponse } from './interfaces/auth-response.interface.js';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface.js';
import { UserEntity } from './interfaces/auth-entity.interface.js';
import { User } from '@azeebo/shared-types';
import { createSuccessResponse } from '@azeebo/shared-types';
import { OtpService } from './otp/otp.service.js';
import { RedisService, CacheService, cacheKey } from '@azeebo/shared-services';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds: number;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryDays: number;
  private readonly revokedTokensPrefix = 'revoked:';
  private readonly failedLoginPrefix = 'failed_login:';
  private readonly maxFailedAttempts: number;
  private readonly lockoutDurationSeconds: number;
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(AuditLogService) private readonly auditLogService: AuditLogService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(OtpService) private readonly otpService: OtpService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(CacheService) private readonly cacheService: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 10);
    this.accessTokenExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '30m');
    this.refreshTokenExpiryDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    this.maxFailedAttempts = this.configService.get<number>('MAX_FAILED_ATTEMPTS', 5);
    this.lockoutDurationSeconds = this.configService.get<number>(
      'LOCKOUT_DURATION_SECONDS',
      15 * 60
    );
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
      throw new UnauthorizedException('Account locked. Please try again later.');
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
      await this.redisService.expire(key, this.lockoutDurationSeconds);
    }
  }

  private async resetFailedLoginAttempts(email: string): Promise<void> {
    const key = `${this.failedLoginPrefix}${email}`;
    await this.redisService.del(key);
  }

  async unlockAccount(email: string): Promise<{ success: boolean }> {
    const key = `${this.failedLoginPrefix}${email}`;
    await this.redisService.del(key);
    return createSuccessResponse({ success: true });
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    const { refreshToken } = refreshTokenDto;

    try {
      const jwtRefreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

      const decoded = this.jwtService.verify(refreshToken, {
        secret: jwtRefreshSecret,
        audience: this.configService.get<string>('JWT_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_ISSUER'),
        algorithms: ['HS256'],
      });

      const user = await this.authRepository.findById((decoded as { sub: string }).sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const session = await this.authRepository.findSessionByUserId(user.id);
      if (!session) {
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
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken?: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean }> {
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
    await this.redisService.set(resetTokenKey, user.id, 3600);

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

    await this.redisService.del(resetTokenKey);
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
  ): Promise<{ success: boolean; message: string }> {
    const verificationTokenKey = `email_verification:${verifyEmailDto.token}`;
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

    this.trackAnalyticsEvent('user_email_verified', userId);

    return { success: true, message: 'Email verified successfully' };
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

    const verificationToken = randomUUID();
    const verificationKey = `email_verification:${verificationToken}`;
    await this.redisService.set(verificationKey, user.id, 86400);

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
          userName: user.displayName,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return { success: true, message: 'If the email exists, a verification link has been sent' };
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
