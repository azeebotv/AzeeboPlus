import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  UserEntity,
  SessionEntity,
  OtpEntity,
  SocialAccountEntity,
  CreateSessionData,
} from './interfaces/auth-entity.interface.js';

@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { email },
    }) as Promise<UserEntity | null>;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<UserEntity | null>;
  }

  async create(data: CreateUserDto): Promise<UserEntity> {
    return this.prisma.user.create({
      data: data as Parameters<typeof this.prisma.user.create>[0]['data'],
    }) as Promise<UserEntity>;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.user.update>[0]['data'],
    }) as Promise<UserEntity>;
  }

  async createSession(data: CreateSessionData): Promise<SessionEntity> {
    return this.prisma.session.create({
      data,
    }) as Promise<SessionEntity>;
  }

  async findSessionByUserId(userId: string): Promise<SessionEntity | null> {
    return this.prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SessionEntity | null>;
  }

  async deleteSessionByUserId(userId: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async setOtp(userId: string, code: string, expiresAt: Date): Promise<void> {
    await this.prisma.otp.upsert({
      where: { userId },
      update: { code, expiresAt },
      create: { userId, code, expiresAt },
    });
  }

  async getOtp(userId: string): Promise<OtpEntity | null> {
    return this.prisma.otp.findUnique({
      where: { userId },
    }) as Promise<OtpEntity | null>;
  }

  async deleteOtp(userId: string): Promise<OtpEntity> {
    return this.prisma.otp.delete({
      where: { userId },
    }) as Promise<OtpEntity>;
  }

  async findBySocialId(
    socialId: string,
    provider: string
  ): Promise<(SocialAccountEntity & { user: UserEntity }) | null> {
    return this.prisma.socialAccount.findUnique({
      where: { socialId_provider: { socialId, provider } },
      include: { user: true },
    }) as Promise<(SocialAccountEntity & { user: UserEntity }) | null>;
  }

  async findSocialAccount(userId: string, provider: string): Promise<SocialAccountEntity | null> {
    return this.prisma.socialAccount.findUnique({
      where: { userId_provider: { userId, provider } },
    }) as Promise<SocialAccountEntity | null>;
  }

  async linkSocialAccount(
    userId: string,
    socialUser: {
      provider: string;
      socialId: string;
      accessToken: string;
      refreshToken: string;
    }
  ): Promise<SocialAccountEntity> {
    return this.prisma.socialAccount.create({
      data: {
        userId,
        provider: socialUser.provider,
        socialId: socialUser.socialId,
        accessToken: socialUser.accessToken,
        refreshToken: socialUser.refreshToken,
      },
    }) as Promise<SocialAccountEntity>;
  }

  async unlinkSocialAccount(userId: string, provider: string): Promise<number> {
    const result = await this.prisma.socialAccount.deleteMany({
      where: { userId, provider },
    });
    return result.count;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }) as Promise<UserEntity>;
  }

  async verifyEmail(userId: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    }) as Promise<UserEntity>;
  }

  async updateRole(userId: string, role: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as Parameters<typeof this.prisma.user.update>[0]['data']['role'] },
    }) as Promise<UserEntity>;
  }
}
