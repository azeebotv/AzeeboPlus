import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface FilmmakerProject {
  id: string;
  filmmakerId: string;
  filmmakerName: string;
  title: string;
  description: string;
  thumbnail: string;
  status: string;
  fundingGoal: number;
  fundingRaised: number;
  targetDate: string;
  createdAt: string;
}

interface FilmmakerUpdate {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: string;
}

interface FilmmakerBacker {
  id: string;
  userId: string;
  amount: number;
  createdAt: string;
}

interface FilmmakerResponse {
  success: boolean;
  data?:
    | FilmmakerProject
    | FilmmakerProject[]
    | FilmmakerUpdate[]
    | { items: FilmmakerProject[]; total: number; page: number; limit: number; totalPages: number }
    | { items: FilmmakerUpdate[]; total: number; page: number; limit: number; totalPages: number }
    | { items: FilmmakerBacker[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string; backerCount?: number }
    | { hasAccess: boolean };
  error?: { code: string; message: string };
}

@Injectable()
export class FilmmakerService {
  constructor(private prisma: PrismaService) {}

  private formatProject(project: Record<string, unknown>): FilmmakerProject {
    return {
      id: project.id as string,
      filmmakerId: project.filmmakerId as string,
      filmmakerName: (project.filmmaker as { displayName: string })?.displayName || '',
      title: project.title as string,
      description: (project.description as string) || '',
      thumbnail: (project.thumbnail as string) || '',
      status: project.status as string,
      fundingGoal: project.fundingGoal ? Number(project.fundingGoal) : 0,
      fundingRaised: Number(project.fundingRaised),
      targetDate: (project.targetDate as Date)?.toISOString() || '',
      createdAt: (project.createdAt as Date).toISOString(),
    };
  }

  async getProjects(
    page = 1,
    limit = 20,
    status?: string,
    filmmakerId?: string
  ): Promise<FilmmakerResponse> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (filmmakerId) where.filmmakerId = filmmakerId;

    const [items, total] = await Promise.all([
      this.prisma.filmmakerProject.findMany({
        where,
        include: { filmmaker: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.filmmakerProject.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((p) => this.formatProject(p)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectById(id: string): Promise<FilmmakerResponse> {
    const project = await this.prisma.filmmakerProject.findUnique({
      where: { id },
      include: {
        filmmaker: true,
        updates: { orderBy: { createdAt: 'desc' } },
        _count: { select: { backers: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${id}`);
    }

    return {
      success: true,
      data: {
        ...this.formatProject(project),
        backerCount: project._count.backers,
      },
    };
  }

  async createProject(
    filmmakerId: string,
    data: {
      title: string;
      description?: string;
      thumbnail?: string;
      status?: string;
      fundingGoal?: number;
      targetDate?: string;
    }
  ): Promise<FilmmakerResponse> {
    const project = await this.prisma.filmmakerProject.create({
      data: {
        filmmakerId,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        status: data.status || 'development',
        fundingGoal: data.fundingGoal,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
      include: { filmmaker: true },
    });

    return { success: true, data: this.formatProject(project) };
  }

  async updateProject(
    id: string,
    filmmakerId: string,
    data: {
      title?: string;
      description?: string;
      thumbnail?: string;
      status?: string;
      fundingGoal?: number;
      targetDate?: string;
    }
  ): Promise<FilmmakerResponse> {
    const project = await this.prisma.filmmakerProject.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project not found: ${id}`);
    }

    if (project.filmmakerId !== filmmakerId) {
      throw new BadRequestException('Not authorized to update this project');
    }

    const updated = await this.prisma.filmmakerProject.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        status: data.status,
        fundingGoal: data.fundingGoal,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
      include: { filmmaker: true },
    });

    return { success: true, data: this.formatProject(updated) };
  }

  async addUpdate(
    projectId: string,
    filmmakerId: string,
    data: { title: string; content: string }
  ): Promise<{ success: boolean; data: FilmmakerUpdate }> {
    const project = await this.prisma.filmmakerProject.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }

    if (project.filmmakerId !== filmmakerId) {
      throw new BadRequestException('Not authorized to add updates to this project');
    }

    const update = await this.prisma.filmmakerUpdate.create({
      data: {
        projectId,
        title: data.title,
        content: data.content,
      },
    });

    return {
      success: true,
      data: {
        id: update.id,
        projectId: update.projectId,
        title: update.title,
        content: update.content,
        createdAt: update.createdAt.toISOString(),
      },
    };
  }

  async backProject(userId: string, projectId: string, amount: number): Promise<FilmmakerResponse> {
    const project = await this.prisma.filmmakerProject.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }

    const existingBacker = await this.prisma.filmmakerBacker.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (existingBacker) {
      const _updated = await this.prisma.filmmakerBacker.update({
        where: { id: existingBacker.id },
        data: { amount: { increment: amount } },
      });

      await this.prisma.filmmakerProject.update({
        where: { id: projectId },
        data: { fundingRaised: { increment: amount } },
      });

      return { success: true, data: { message: 'Backing updated', backerCount: 0 } };
    }

    await this.prisma.filmmakerBacker.create({
      data: {
        projectId,
        userId,
        amount,
        status: 'active',
      },
    });

    await this.prisma.filmmakerProject.update({
      where: { id: projectId },
      data: { fundingRaised: { increment: amount } },
    });

    const backerCount = await this.prisma.filmmakerBacker.count({
      where: { projectId },
    });

    return { success: true, data: { message: 'Backed successfully', backerCount } };
  }

  async getBackers(projectId: string, page = 1, limit = 50): Promise<FilmmakerResponse> {
    const [items, total] = await Promise.all([
      this.prisma.filmmakerBacker.findMany({
        where: { projectId, status: 'active' },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.filmmakerBacker.count({ where: { projectId, status: 'active' } }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((b) => ({
          id: b.id,
          userId: b.userId,
          amount: Number(b.amount),
          createdAt: b.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
