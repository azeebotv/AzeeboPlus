import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface MusicEntry {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  coverImage: string;
  artistName: string;
  albumName: string;
  duration: number;
  genre: string;
  trackUrl: string;
  isPremium: boolean;
  playCount: number;
  status: string;
  publishedAt: string;
  createdAt: string;
}

interface MusicResponse {
  success: boolean;
  data?:
    | MusicEntry
    | MusicEntry[]
    | { items: MusicEntry[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

interface CreateMusicData {
  title: string;
  type: string;
  description?: string;
  coverImage?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  genre?: string;
  trackUrl?: string;
  isPremium?: boolean;
  createdById: string;
}

interface UpdateMusicData {
  title?: string;
  type?: string;
  description?: string;
  coverImage?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  genre?: string;
  trackUrl?: string;
  isPremium?: boolean;
  status?: string;
}

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  private formatEntry(entry: Record<string, unknown>): MusicEntry {
    return {
      id: entry.id as string,
      title: entry.title as string,
      slug: entry.slug as string,
      type: entry.type as string,
      description: (entry.description as string) || '',
      coverImage: (entry.coverImage as string) || '',
      artistName: (entry.artistName as string) || '',
      albumName: (entry.albumName as string) || '',
      duration: (entry.duration as number) || 0,
      genre: (entry.genre as string) || '',
      trackUrl: (entry.trackUrl as string) || '',
      isPremium: entry.isPremium as boolean,
      playCount: entry.playCount as number,
      status: entry.status as string,
      publishedAt: entry.publishedAt ? (entry.publishedAt as Date).toISOString() : '',
      createdAt: (entry.createdAt as Date).toISOString(),
    };
  }

  async getEntries(
    page = 1,
    limit = 20,
    type?: string,
    genre?: string,
    status = 'published'
  ): Promise<MusicResponse> {
    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (type) where.type = type;
    if (genre) where.genre = genre;

    const [items, total] = await Promise.all([
      this.prisma.musicEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.musicEntry.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((e) => this.formatEntry(e)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntryBySlug(slug: string): Promise<MusicResponse> {
    const entry = await this.prisma.musicEntry.findUnique({ where: { slug } });
    if (!entry) {
      throw new NotFoundException(`Music entry not found: ${slug}`);
    }

    await this.prisma.musicEntry.update({
      where: { id: entry.id },
      data: { playCount: entry.playCount + 1 },
    });

    return { success: true, data: this.formatEntry(entry) };
  }

  async getTrending(limit = 10): Promise<MusicResponse> {
    const entries = await this.prisma.musicEntry.findMany({
      where: { status: 'published' },
      orderBy: { playCount: 'desc' },
      take: limit,
    });
    return { success: true, data: entries.map((e) => this.formatEntry(e)) };
  }

  async getGenres(): Promise<{ genres: string[] }> {
    const entries = await this.prisma.musicEntry.findMany({
      where: { status: 'published', genre: { not: null } },
      select: { genre: true },
      distinct: ['genre'],
    });
    return { genres: entries.map((e) => e.genre as string).filter(Boolean) };
  }

  async createEntry(data: CreateMusicData): Promise<MusicResponse> {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const entry = await this.prisma.musicEntry.create({
      data: {
        title: data.title,
        slug,
        type: data.type,
        description: data.description,
        coverImage: data.coverImage,
        artistName: data.artistName,
        albumName: data.albumName,
        duration: data.duration,
        genre: data.genre,
        trackUrl: data.trackUrl,
        isPremium: data.isPremium || false,
        status: 'draft',
        createdById: data.createdById,
      },
    });

    return { success: true, data: this.formatEntry(entry) };
  }

  async updateEntry(id: string, data: UpdateMusicData): Promise<MusicResponse> {
    const existing = await this.prisma.musicEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Music entry not found: ${id}`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.title) {
      updateData.title = data.title;
      updateData.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.artistName !== undefined) updateData.artistName = data.artistName;
    if (data.albumName !== undefined) updateData.albumName = data.albumName;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.genre !== undefined) updateData.genre = data.genre;
    if (data.trackUrl !== undefined) updateData.trackUrl = data.trackUrl;
    if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.musicEntry.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: this.formatEntry(updated) };
  }

  async deleteEntry(id: string): Promise<MusicResponse> {
    const entry = await this.prisma.musicEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Music entry not found: ${id}`);
    }

    await this.prisma.musicEntry.delete({ where: { id } });
    return { success: true, data: { message: 'Entry deleted successfully' } };
  }
}
