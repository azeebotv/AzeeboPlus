import { Inject, Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class GenreService {
  private readonly logger = new Logger(GenreService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listGenres(options?: { activeOnly?: boolean }) {
    try {
      const where = options?.activeOnly !== false ? { isActive: true } : {};
      const genres = await (
        this.prisma as unknown as { genre?: { findMany: (args: unknown) => Promise<unknown[]> } }
      ).genre?.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { movies: true } } },
      });
      return { success: true, data: genres || [] };
    } catch (error) {
      this.logger.error(`Failed to list genres: ${(error as Error).message}`);
      return { success: true, data: [] };
    }
  }

  async getGenreById(id: string) {
    try {
      const genre = await (
        this.prisma as unknown as { genre?: { findUnique: (args: unknown) => Promise<unknown> } }
      ).genre?.findUnique({
        where: { id },
        include: { _count: { select: { movies: true } } },
      });
      if (!genre) {
        throw new NotFoundException('Genre not found');
      }
      return { success: true, data: genre };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get genre: ${(error as Error).message}`);
      throw error;
    }
  }

  async getGenreBySlug(slug: string) {
    try {
      const genre = await (
        this.prisma as unknown as { genre?: { findUnique: (args: unknown) => Promise<unknown> } }
      ).genre?.findUnique({
        where: { slug },
        include: { _count: { select: { movies: true } } },
      });
      if (!genre) {
        throw new NotFoundException('Genre not found');
      }
      return { success: true, data: genre };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get genre: ${(error as Error).message}`);
      throw error;
    }
  }

  async createGenre(data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
  }) {
    try {
      const slug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      // Check for duplicate name or slug
      const existing = await (
        this.prisma as unknown as { genre?: { findFirst: (args: unknown) => Promise<unknown> } }
      ).genre?.findFirst({
        where: { OR: [{ name: data.name }, { slug }] },
      });
      if (existing) {
        throw new ConflictException('Genre with this name or slug already exists');
      }

      const genre = await (
        this.prisma as unknown as { genre?: { create: (args: unknown) => Promise<unknown> } }
      ).genre?.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          icon: data.icon,
          sortOrder: data.sortOrder || 0,
          isActive: true,
        },
      });
      return { success: true, data: genre };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Failed to create genre: ${(error as Error).message}`);
      throw error;
    }
  }

  async updateGenre(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    try {
      const existing = await (
        this.prisma as unknown as { genre?: { findUnique: (args: unknown) => Promise<unknown> } }
      ).genre?.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Genre not found');
      }

      // Check for duplicate name or slug if updating
      if (data.name || data.slug) {
        const slug =
          data.slug ||
          data.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const duplicate = await (
          this.prisma as unknown as { genre?: { findFirst: (args: unknown) => Promise<unknown> } }
        ).genre?.findFirst({
          where: {
            OR: [{ name: data.name || '' }, { slug: slug || '' }],
            NOT: { id },
          },
        });
        if (duplicate) {
          throw new ConflictException('Genre with this name or slug already exists');
        }
      }

      const genre = await (
        this.prisma as unknown as { genre?: { update: (args: unknown) => Promise<unknown> } }
      ).genre?.update({
        where: { id },
        data,
      });
      return { success: true, data: genre };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Failed to update genre: ${(error as Error).message}`);
      throw error;
    }
  }

  async deleteGenre(id: string) {
    try {
      const existing = await (
        this.prisma as unknown as {
          genre?: {
            findUnique: (args: unknown) => Promise<{ id: string } & Record<string, unknown>>;
          };
        }
      ).genre?.findUnique({
        where: { id },
        include: { _count: { select: { movies: true } } },
      });
      if (!existing) {
        throw new NotFoundException('Genre not found');
      }

      const movieCount =
        (existing as unknown as { _count: { movies: number } })._count?.movies || 0;
      if (movieCount > 0) {
        throw new ConflictException(
          `Cannot delete genre with ${movieCount} associated movies. Reassign movies first.`
        );
      }

      await (
        this.prisma as unknown as { genre?: { delete: (args: unknown) => Promise<unknown> } }
      ).genre?.delete({ where: { id } });
      return { success: true, message: 'Genre deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Failed to delete genre: ${(error as Error).message}`);
      throw error;
    }
  }

  async getMoviesByGenre(genreId: string, options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [movies, total] = await Promise.all([
        this.prisma.movie.findMany({
          where: { genreId } as never,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.movie.count({ where: { genreId } as never }),
      ]);

      return {
        success: true,
        data: movies,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.error(`Failed to get movies by genre: ${(error as Error).message}`);
      throw error;
    }
  }
}
