import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { RefreshTokenResponse } from './interfaces/refresh-token-response.interface';
import { UserEntity } from './interfaces/auth-entity.interface';
import { User } from '@azeebo/shared-types';
import { createSuccessResponse } from '@azeebo/shared-types';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';
  private readonly refreshTokenExpiryDays = 7;
  private readonly revokedTokensPrefix = 'revoked:';
  private readonly failedLoginPrefix = 'failed_login:';
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDurationSeconds = 15 * 60; // 15 minutes

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findByEmail(registerDto.email);
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
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
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
      const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
      if (!refreshTokenSecret) {
        throw new Error('REFRESH_TOKEN_SECRET environment variable is not configured');
      }

      const decoded = this.jwtService.verify(refreshToken, {
        secret: refreshTokenSecret,
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
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken?: string): Promise<{ success: boolean }> {
    await this.authRepository.deleteSessionByUserId(userId);
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
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return null;

      const decoded = this.jwtService.verify(token, { secret: jwtSecret }) as {
        jti: string;
        sub: string;
      };

      const isRevoked = await this.redisService.get(`${this.revokedTokensPrefix}${decoded.jti}`);
      if (isRevoked) {
        return null;
      }

      const user = await this.authRepository.findById(decoded.sub);
      if (!user) return null;
      return this.mapToUser(user);
    } catch {
      return null;
    }
  }

  getProfile(user: User): User {
    return user;
  }

  private async generateTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = this.jwtService.sign(
      {
        iss: 'azeebo-auth-service',
        aud: 'azeebo-api',
        jti: randomUUID(),
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: now,
      },
      {
        expiresIn: this.accessTokenExpiry,
        secret: jwtSecret,
      }
    );

    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshTokenSecret) {
      throw new Error('REFRESH_TOKEN_SECRET environment variable is not configured');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    const refreshToken = this.jwtService.sign(
      {
        iss: 'azeebo-auth-service',
        aud: 'azeebo-api',
        jti: randomUUID(),
        sub: user.id,
        type: 'refresh',
        iat: now,
      },
      {
        expiresIn: this.refreshTokenExpiry,
        secret: refreshTokenSecret,
      }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, this.saltRounds);

    await this.authRepository.createSession({
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt,
    });

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
}
