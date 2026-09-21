import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service';
import { CreatePathDto, UpdatePathDto, CreateQuizDto } from './dto/agbala-admin.dto';

/**
 * Admin CRUD for Agbala learning paths, quizzes, and the theory moderation
 * queue. Backs the admin console's agbala module, which proxies
 * /admin/agbala/* here as /vertical/agbala/*.
 *
 * The moderation queue reviews user-submitted Theory rows: theories carry
 * status 'published' by default in the community surface, so moderation here
 * flips rows between 'pending' (queued for review), 'published' (approved),
 * and 'rejected'. Approving a non-queued theory is a no-op-safe state change.
 */
@Injectable()
export class AgbalaAdminService {
  private readonly logger = new Logger(AgbalaAdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ── Paths ────────────────────────────────────────────────────────────────

  async createPath(storyworldId: string, dto: CreatePathDto) {
    const storyworld = await this.prisma.universeMap.findUnique({ where: { id: storyworldId } });
    if (!storyworld) {
      throw new NotFoundException(`Storyworld ${storyworldId} not found`);
    }
    const path = await this.prisma.storyworldPath.create({
      data: {
        storyworldId,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        totalSteps: dto.totalSteps ?? 5,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return { success: true, data: path };
  }

  async getPaths(query: {
    storyworldId: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    // Same existence check as createPath: an unknown storyworld is a 404,
    // not an empty list — callers can distinguish a dead id from a sparse
    // result set.
    const storyworld = await this.prisma.universeMap.findUnique({ where: { id: query.storyworldId } });
    if (!storyworld) {
      throw new NotFoundException(`Storyworld ${query.storyworldId} not found`);
    }
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 20), 100);
    const search = query.search?.trim();
    const where = {
      storyworldId: query.storyworldId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [paths, total] = await Promise.all([
      this.prisma.storyworldPath.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.storyworldPath.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: paths,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updatePath(pathId: string, dto: UpdatePathDto) {
    const existing = await this.prisma.storyworldPath.findUnique({ where: { id: pathId } });
    if (!existing) {
      throw new NotFoundException(`Path ${pathId} not found`);
    }
    const path = await this.prisma.storyworldPath.update({ where: { id: pathId }, data: dto });
    return { success: true, data: path };
  }

  async deletePath(pathId: string) {
    const existing = await this.prisma.storyworldPath.findUnique({ where: { id: pathId } });
    if (!existing) {
      throw new NotFoundException(`Path ${pathId} not found`);
    }
    await this.prisma.storyworldPath.delete({ where: { id: pathId } });
    return { success: true, data: { id: pathId, deleted: true } };
  }

  // ── Quizzes ──────────────────────────────────────────────────────────────

  async getQuizzes(query: { storyworldId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 20), 100);
    const where = query.storyworldId ? { storyworldId: query.storyworldId } : {};

    const [quizzes, total] = await Promise.all([
      this.prisma.agbalaQuiz.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.agbalaQuiz.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: quizzes.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          storyworldId: q.storyworldId,
          questionCount: Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createQuiz(dto: CreateQuizDto) {
    if (dto.storyworldId) {
      const storyworld = await this.prisma.universeMap.findUnique({
        where: { id: dto.storyworldId },
      });
      if (!storyworld) {
        throw new NotFoundException(`Storyworld ${dto.storyworldId} not found`);
      }
    }
    const quiz = await this.prisma.agbalaQuiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        storyworldId: dto.storyworldId,
        questions: dto.questions as unknown as Prisma.InputJsonArray,
      },
    });
    return { success: true, data: quiz };
  }

  async deleteQuiz(quizId: string) {
    const existing = await this.prisma.agbalaQuiz.findUnique({ where: { id: quizId } });
    if (!existing) {
      throw new NotFoundException(`Quiz ${quizId} not found`);
    }
    await this.prisma.agbalaQuiz.delete({ where: { id: quizId } });
    return { success: true, data: { id: quizId, deleted: true } };
  }

  // ── Moderation (theory review queue) ────────────────────────────────────

  async getReviewQueue(query: { page?: number; limit?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 20), 100);
    const where = { status: 'pending' };

    const [items, total] = await Promise.all([
      this.prisma.theory.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.theory.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((t) => ({
          id: t.id,
          type: 'theory',
          title: t.title,
          content: t.content,
          authorId: t.authorId,
          authorName: t.authorName,
          storyworldSlug: null,
          submittedAt: t.createdAt,
          status: t.status,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async approveContent(contentId: string) {
    const theory = await this.prisma.theory.findUnique({ where: { id: contentId } });
    if (!theory) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }
    const updated = await this.prisma.theory.update({
      where: { id: contentId },
      data: { status: 'published' },
    });
    return { success: true, data: { id: updated.id, status: updated.status } };
  }

  async rejectContent(contentId: string, reason: string) {
    const theory = await this.prisma.theory.findUnique({ where: { id: contentId } });
    if (!theory) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }
    const updated = await this.prisma.theory.update({
      where: { id: contentId },
      data: { status: 'rejected' },
    });
    this.logger.log(`Theory ${contentId} rejected: ${reason}`);
    return { success: true, data: { id: updated.id, status: updated.status } };
  }
}
