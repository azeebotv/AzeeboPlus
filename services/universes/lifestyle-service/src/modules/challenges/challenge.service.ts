import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateChallengeInput {
  title: string;
  description?: string;
  coverImage?: string;
  type?: string;
  status?: string;
  rules?: string;
  prize?: string;
  startDate?: string;
  endDate?: string;
}

export interface ChallengeSubmissionInput {
  content: string;
  mediaUrl?: string;
}

@Injectable()
export class ChallengeService {
  constructor(private prisma: PrismaService) {}

  async getChallenges(page = 1, limit = 20, type?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        include: { createdBy: { select: { displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return {
      success: true,
      data: {
        challenges,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    };
  }

  async getChallenge(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        createdBy: { select: { displayName: true, avatarUrl: true } },
        submissions: {
          include: { user: { select: { displayName: true, avatarUrl: true } } },
          orderBy: { votes: 'desc' },
          take: 50,
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return { success: true, data: { challenge } };
  }

  async createChallenge(userId: string, data: CreateChallengeInput) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const challenge = await this.prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description || '',
        coverImage: data.coverImage || '',
        type: data.type || 'photo',
        status: data.status || 'draft',
        rules: data.rules || '',
        prize: data.prize || '',
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate
          ? new Date(data.endDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        slug,
        createdById: userId,
      },
    });

    return { success: true, data: { challenge } };
  }

  async submitToChallenge(challengeId: string, userId: string, data: ChallengeSubmissionInput) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== 'active') {
      throw new BadRequestException('Challenge is not active');
    }

    const existing = await this.prisma.challengeSubmission.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (existing) {
      throw new BadRequestException('You have already submitted to this challenge');
    }

    const submission = await this.prisma.challengeSubmission.create({
      data: {
        challengeId,
        userId,
        content: data.content,
        mediaUrl: data.mediaUrl,
      },
    });

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { participantCount: { increment: 1 } },
    });

    return { success: true, data: { submission } };
  }

  async voteSubmission(submissionId: string, userId: string) {
    const submission = await this.prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.prisma.challengeSubmission.update({
      where: { id: submissionId },
      data: { votes: { increment: 1 } },
    });

    return { success: true, data: { message: 'Vote recorded' } };
  }
}
