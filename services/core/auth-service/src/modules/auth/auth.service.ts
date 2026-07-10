import {
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

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/password-reset.dto';
import { SelectRoleDto } from './dto/select-role.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface';
import { UserEntity } from './interfaces/auth-entity.interface';
import { User } from '@azeebo/shared-types';
import { createSuccessResponse } from '@azeebo/shared-types';
import { OtpService } from './otp/otp.service';
import { RedisService } from '../../common/services/redis.service';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import type { StringValue } from 'ms';

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

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService
  ) {
    this.saltRounds = this.configService.get<number>('SALT_ROUNDS', 10);
    this.accessTokenExpiry = this.configService.get<string>('JWT_EXPIRES_IN', '30m');
    this.refreshTokenExpiryDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
    this.maxFailedAttempts = this.configService.get<number>('MAX_FAILED_ATTEMPTS', 5);
    this.lockoutDurationSeconds = this.configService.get<number>(
      'LOCKOUT_DURATION_SECONDS',
      15 * 60
    );
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.findUserByEmailCached(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, this.saltRounds);

    const user = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);

    return createSuccessResponse({
      user: this.mapToUser(user),
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
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
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.resetFailedLoginAttempts(loginDto.email);

    // Invalidate cached user data on login
    await this.invalidateUserCache(loginDto.email, user.id);

    const tokens = await this.generateTokens(user);

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
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is not configured');
      }

      const decoded = this.jwtService.verify(refreshToken, {
        secret: jwtRefreshSecret,
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER,
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

  async logout(userId: string, accessToken?: string): Promise<{ success: boolean }> {
    await this.authRepository.deleteSessionByUserId(userId);

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
    return createSuccessResponse({ success: true });
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
      if (!jwtAccessSecret) return null;

      const decoded = this.jwtService.verify(token, {
        secret: jwtAccessSecret,
        audience: process.env.JWT_AUDIENCE,
        issuer: process.env.JWT_ISSUER,
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
      this.logger.debug(`Token validation failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }

  getProfile(user: User) {
    return createSuccessResponse(this.mapToUser(user as UserEntity));
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByEmailCached(forgotPasswordDto.email);
    if (!user) {
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

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
      this.logger.error(`Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto
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

    // Invalidate all auth caches on password change
    await this.cacheService.delete(cacheKey('auth', `permissions:${userId}`));
    await this.cacheService.delete(cacheKey('auth', `session:${userId}`));

    return { success: true, message: 'Password reset successfully' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto
  ): Promise<{ success: boolean; message: string }> {
    const verificationTokenKey = `email_verification:${verifyEmailDto.token}`;
    const userId = await this.redisService.get(verificationTokenKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.authRepository.verifyEmail(userId);
    await this.redisService.del(verificationTokenKey);

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerification(
    resendVerificationDto: ResendVerificationDto
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByEmailCached(resendVerificationDto.email);
    if (!user) {
      return { success: true, message: 'If the email exists, a verification link has been sent' };
    }

    if (user.isVerified) {
      return { success: true, message: 'Email is already verified' };
    }

    const verificationToken = randomUUID();
    const verificationTokenKey = `email_verification:${verificationToken}`;
    await this.redisService.set(verificationTokenKey, user.id, 86400);

    return { success: true, message: 'If the email exists, a verification link has been sent' };
  }

  async selectRole(
    userId: string,
    selectRoleDto: SelectRoleDto
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const allowedRoles = ['user', 'creator', 'moderator'];
    if (!allowedRoles.includes(selectRoleDto.role)) {
      throw new BadRequestException('Invalid role selection');
    }

    await this.authRepository.updateRole(userId, selectRoleDto.role);

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

  private async generateTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }> {
    const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtAccessSecret || !jwtRefreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = this.jwtService.sign(
      {
        iss: process.env.JWT_ISSUER || 'azeebo-auth',
        aud: process.env.JWT_AUDIENCE || 'azeebo-api',
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
        iss: process.env.JWT_ISSUER || 'azeebo-auth',
        aud: process.env.JWT_AUDIENCE || 'azeebo-api',
        jti: randomUUID(),
        sub: user.id,
        type: 'refresh',
        iat: now,
      } as Record<string, unknown>,
      {
        expiresIn: this.refreshTokenExpiryDays as unknown as StringValue,
        secret: jwtRefreshSecret,
      }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, this.saltRounds);

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
