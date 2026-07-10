import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface Crossover {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  status: string;
  titles: { id: string; name: string; slug: string; type: string }[];
  createdAt: string;
}

interface Recap {
  id: string;
  titleId: string;
  titleName: string;
  season: number;
  episode: number;
  name: string;
  content: string;
  coverImage: string;
  isSpoiler: boolean;
  viewCount: number;
  status: string;
  publishedAt: string;
  createdAt: string;
}

interface CrossoverResponse {
  success: boolean;
  data?:
    | Crossover
    | Crossover[]
    | Recap[]
    | { items: Crossover[]; total: number; page: number; limit: number; totalPages: number }
    | { items: Recap[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

export interface CreateCrossoverData {
  title: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  titleIds: string[];
}

export interface CreateRecapData {
  titleId: string;
  season?: number;
  episode?: number;
  name?: string;
  content: string;
  coverImage?: string;
  isSpoiler?: boolean;
}

@Injectable()
export class CrossoversService {
  private readonly logger = new Logger(CrossoversService.name);

  constructor(private prisma: PrismaService) {}

  private formatCrossover(crossover: Record<string, unknown>): Crossover {
    return {
      id: crossover.id as string,
      title: crossover.title as string,
      slug: crossover.slug as string,
      description: (crossover.description as string) || '',
      coverImage: (crossover.coverImage as string) || '',
      startDate: (crossover.startDate as Date)?.toISOString() || '',
      endDate: (crossover.endDate as Date)?.toISOString() || '',
      status: crossover.status as string,
      titles:
        (crossover.titles as { id: string; name: string; slug: string; type: string }[]) || [],
      createdAt: (crossover.createdAt as Date).toISOString(),
    };
  }

  private formatRecap(recap: Record<string, unknown>): Recap {
    return {
      id: recap.id as string,
      titleId: recap.titleId as string,
      titleName: (recap.title as { name: string })?.name || '',
      season: (recap.season as number) || 0,
      episode: (recap.episode as number) || 0,
      name: (recap.name as string) || '',
      content: recap.content as string,
      coverImage: (recap.coverImage as string) || '',
      isSpoiler: recap.isSpoiler as boolean,
      viewCount: recap.viewCount as number,
      status: recap.status as string,
      publishedAt: (recap.publishedAt as Date)?.toISOString() || '',
      createdAt: (recap.createdAt as Date).toISOString(),
    };
  }

  async getCrossovers(page = 1, limit = 20, status?: string): Promise<CrossoverResponse> {
    try {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        this.prisma.crossover.findMany({
          where,
          include: {
            titles: {
              include: { title: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.crossover.count({ where }),
      ]);

      const formatted = items.map((c) => {
        const formattedCrossover = {
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          coverImage: c.coverImage,
          startDate: c.startDate?.toISOString() || '',
          endDate: c.endDate?.toISOString() || '',
          status: c.status,
          titles: c.titles.map((ct) => ({
            id: ct.title.id,
            name: ct.title.name,
            slug: ct.title.slug,
            type: ct.title.type,
          })),
          createdAt: c.createdAt.toISOString(),
        };
        return this.formatCrossover(formattedCrossover);
      });

      return {
        success: true,
        data: {
          items: formatted,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get crossovers: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'CROSSOVERS_FETCH_ERROR', message: (error as Error).message },
      };
    }
  }

  async getCrossoverBySlug(slug: string): Promise<CrossoverResponse> {
    try {
      const crossover = await this.prisma.crossover.findUnique({
        where: { slug },
        include: {
          titles: {
            include: { title: true },
          },
        },
      });

      if (!crossover) {
        throw new NotFoundException(`Crossover not found: ${slug}`);
      }

      const formattedCrossover = {
        id: crossover.id,
        title: crossover.title,
        slug: crossover.slug,
        description: crossover.description,
        coverImage: crossover.coverImage,
        startDate: crossover.startDate?.toISOString() || '',
        endDate: crossover.endDate?.toISOString() || '',
        status: crossover.status,
        titles: crossover.titles.map((ct) => ({
          id: ct.title.id,
          name: ct.title.name,
          slug: ct.title.slug,
          type: ct.title.type,
        })),
        createdAt: crossover.createdAt.toISOString(),
      };

      return { success: true, data: this.formatCrossover(formattedCrossover) };
    } catch (error) {
      this.logger.error(
        `Failed to get crossover by slug: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return {
        success: false,
        error: { code: 'CROSSOVER_FETCH_ERROR', message: (error as Error).message },
      };
    }
  }

  async createCrossover(data: CreateCrossoverData): Promise<CrossoverResponse> {
    try {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const crossover = await this.prisma.crossover.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          coverImage: data.coverImage,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          status: 'announced',
          titles: {
            create: data.titleIds.map((titleId) => ({
              titleId,
            })),
          },
        },
        include: {
          titles: {
            include: { title: true },
          },
        },
      });

      const formattedCrossover = {
        id: crossover.id,
        title: crossover.title,
        slug: crossover.slug,
        description: crossover.description,
        coverImage: crossover.coverImage,
        startDate: crossover.startDate?.toISOString() || '',
        endDate: crossover.endDate?.toISOString() || '',
        status: crossover.status,
        titles: crossover.titles.map((ct) => ({
          id: ct.title.id,
          name: ct.title.name,
          slug: ct.title.slug,
          type: ct.title.type,
        })),
        createdAt: crossover.createdAt.toISOString(),
      };

      return { success: true, data: this.formatCrossover(formattedCrossover) };
    } catch (error) {
      this.logger.error(
        `Failed to create crossover: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'CROSSOVER_CREATE_ERROR', message: (error as Error).message },
      };
    }
  }

  async getRecaps(page = 1, limit = 20, titleId?: string): Promise<CrossoverResponse> {
    try {
      const where: Record<string, unknown> = { status: 'published' };
      if (titleId) where.titleId = titleId;

      const [items, total] = await Promise.all([
        this.prisma.recap.findMany({
          where,
          include: { title: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { publishedAt: 'desc' },
        }),
        this.prisma.recap.count({ where }),
      ]);

      return {
        success: true,
        data: {
          items: items.map((r) => this.formatRecap(r)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get recaps: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'RECAPS_FETCH_ERROR', message: (error as Error).message },
      };
    }
  }

  async getRecapById(
    id: string
  ): Promise<{ success: boolean; data?: Recap; error?: { code: string; message: string } }> {
    try {
      const recap = await this.prisma.recap.findUnique({
        where: { id },
        include: { title: true },
      });

      if (!recap) {
        throw new NotFoundException(`Recap not found: ${id}`);
      }

      await this.prisma.recap.update({
        where: { id: recap.id },
        data: { viewCount: recap.viewCount + 1 },
      });

      return { success: true, data: this.formatRecap(recap) };
    } catch (error) {
      this.logger.error(
        `Failed to get recap by id: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return {
        success: false,
        error: { code: 'RECAP_FETCH_ERROR', message: (error as Error).message },
      };
    }
  }

  async createRecap(
    data: CreateRecapData
  ): Promise<{ success: boolean; data?: Recap; error?: { code: string; message: string } }> {
    try {
      const recap = await this.prisma.recap.create({
        data: {
          titleId: data.titleId,
          season: data.season,
          episode: data.episode,
          name: data.name,
          content: data.content,
          coverImage: data.coverImage,
          isSpoiler: data.isSpoiler || false,
          status: 'published',
          publishedAt: new Date(),
        },
        include: { title: true },
      });

      return { success: true, data: this.formatRecap(recap) };
    } catch (error) {
      this.logger.error(
        `Failed to create recap: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'RECAP_CREATE_ERROR', message: (error as Error).message },
      };
    }
  }
}
