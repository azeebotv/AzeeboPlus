import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  UserEntity,
  SessionEntity,
  OtpEntity,
  SocialAccountEntity,
  CreateSessionData,
} from './interfaces/auth-entity.interface';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      data,
    }) as Promise<UserEntity>;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data,
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

  async setOtp(userId: string, _code: string, expiresAt: Date): Promise<void> {
    await this.prisma.otp.upsert({
      where: { userId },
      update: { expiresAt },
      create: { userId, expiresAt },
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

  async findSocialAccount(
    userId: string,
    provider: string
  ): Promise<SocialAccountEntity | null> {
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
        displayName: '',
        email: '',
      },
    }) as Promise<SocialAccountEntity>;
  }
}
