import {Inject,  Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePollDto, PollOptionDto } from './dto/create-poll.dto';

@Injectable()
export class PollService {
  private readonly logger = new Logger(PollService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getPolls(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    try {
      const [polls, total] = await Promise.all([
        this.prisma.poll.findMany({
          where,
          include: {
            options: { orderBy: { voteCount: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.poll.count({ where }),
      ]);

      return {
        success: true,
        data: {
          polls,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch polls: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch polls' } };
    }
  }

  async getPoll(id: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: {
        options: { orderBy: { voteCount: 'desc' } },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    return { success: true, data: { poll } };
  }

  async createPoll(userId: string, data: CreatePollDto) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    try {
      const poll = await this.prisma.poll.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          coverImage: data.coverImage,
          status: data.status || 'draft',
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          createdById: userId,
          options: {
            create: data.options.map((option: PollOptionDto) => ({
              text: option.text,
              imageUrl: option.imageUrl,
            })),
          },
        },
        include: { options: true },
      });

      return { success: true, data: { poll } };
    } catch (error) {
      this.logger.error(`Failed to create poll: ${error}`);
      return { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create poll' } };
    }
  }

  async votePoll(pollId: string, userId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { where: { id: optionId } } },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.status !== 'active') {
      throw new BadRequestException('Poll is not active');
    }

    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new BadRequestException('Poll has expired');
    }

    const existingVote = await this.prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted in this poll');
    }

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) {
      throw new NotFoundException('Option not found');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.pollVote.create({
          data: { pollId, optionId, userId },
        });

        await tx.pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        });

        await tx.poll.update({
          where: { id: pollId },
          data: { totalVotes: { increment: 1 } },
        });
      });

      return { success: true, data: { message: 'Vote recorded' } };
    } catch (error) {
      this.logger.error(`Failed to record vote: ${error}`);
      return { success: false, error: { code: 'VOTE_ERROR', message: 'Failed to record vote' } };
    }
  }
}
