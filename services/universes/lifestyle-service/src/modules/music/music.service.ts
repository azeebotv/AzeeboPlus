import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

interface GenreDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  trackCount: number;
  totalDuration: number;
  totalPlays: number;
  featured: MusicEntry[];
}

interface ArtistDetail {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  genre: string | null;
  trackCount: number;
  followerCount: number | null;
  socialLinks: { platform: string; url: string }[];
}

interface MusicResponse {
  success: boolean;
  data?:
    | MusicEntry
    | MusicEntry[]
    | { items: MusicEntry[]; total: number; page: number; limit: number; totalPages: number }
    | GenreDetail
    | ArtistDetail
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
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  /**
   * Slugify helper shared by entry slugs, genre slugs and artist ids.
   * Genre slugs / artist ids are DERIVED identifiers: there is no Genre or
   * Artist table — artists and genres are free-text columns on MusicEntry,
   * so the detail endpoints resolve a slug back to the stored value.
   */
  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Resolve a genre slug (or name, any case) to the exact stored genre value.
   * Returns null when no published entry carries a matching genre — callers
   * treat that as "no results" rather than an error.
   */
  private async resolveGenreValue(genreParam: string): Promise<string | null> {
    const rows = await this.prisma.musicEntry.findMany({
      where: { genre: { not: null } },
      select: { genre: true },
      distinct: ['genre'],
    });
    const values = rows.map((r) => r.genre as string).filter(Boolean);
    return (
      values.find((g) => g.toLowerCase() === genreParam.toLowerCase()) ??
      values.find((g) => this.slugify(g) === this.slugify(genreParam)) ??
      null
    );
  }

  /**
   * Resolve an artist id (slugified artistName) back to the stored name.
   * Returns null when no published entry carries that artist.
   */
  private async resolveArtistName(artistIdParam: string): Promise<string | null> {
    const rows = await this.prisma.musicEntry.findMany({
      where: { artistName: { not: null } },
      select: { artistName: true },
      distinct: ['artistName'],
    });
    const values = rows.map((r) => r.artistName as string).filter(Boolean);
    const target = this.slugify(artistIdParam);
    return (
      values.find((a) => a.toLowerCase() === artistIdParam.toLowerCase()) ??
      values.find((a) => this.slugify(a) === target) ??
      null
    );
  }

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
    artistId?: string,
    status = 'published'
  ): Promise<MusicResponse> {
    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (type) where.type = type;
    if (genre) {
      const genreValue = await this.resolveGenreValue(genre);
      if (!genreValue) {
        return { success: true, data: { items: [], total: 0, page, limit, totalPages: 0 } };
      }
      where.genre = genreValue;
    }
    if (artistId) {
      const artistName = await this.resolveArtistName(artistId);
      if (!artistName) {
        return { success: true, data: { items: [], total: 0, page, limit, totalPages: 0 } };
      }
      where.artistName = artistName;
    }

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

  async getGenreDetail(slug: string): Promise<MusicResponse> {
    const genreValue = await this.resolveGenreValue(slug);
    if (!genreValue) {
      throw new NotFoundException(`Genre not found: ${slug}`);
    }

    const where = { status: 'published', genre: genreValue };
    const [agg, featured] = await Promise.all([
      this.prisma.musicEntry.aggregate({
        where,
        _count: true,
        _sum: { duration: true, playCount: true },
      }),
      this.prisma.musicEntry.findMany({
        where,
        orderBy: { playCount: 'desc' },
        take: 3,
      }),
    ]);

    return {
      success: true,
      data: {
        id: this.slugify(genreValue),
        name: genreValue,
        slug: this.slugify(genreValue),
        description: null,
        icon: null,
        trackCount: agg._count,
        totalDuration: agg._sum.duration ?? 0,
        totalPlays: agg._sum.playCount ?? 0,
        featured: featured.map((e) => this.formatEntry(e)),
      },
    };
  }

  async getArtistDetail(id: string): Promise<MusicResponse> {
    const artistName = await this.resolveArtistName(id);
    if (!artistName) {
      throw new NotFoundException(`Artist not found: ${id}`);
    }

    const entries = await this.prisma.musicEntry.findMany({
      where: { status: 'published', artistName },
      orderBy: { playCount: 'desc' },
    });

    const genreCounts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.genre) {
        genreCounts.set(entry.genre, (genreCounts.get(entry.genre) ?? 0) + 1);
      }
    }
    const primaryGenre = [...genreCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      success: true,
      data: {
        id: this.slugify(artistName),
        name: artistName,
        // No artist table — reuse the most-played track's cover as the avatar.
        avatar: entries[0]?.coverImage ?? null,
        bio: null,
        genre: primaryGenre,
        trackCount: entries.length,
        followerCount: null,
        socialLinks: [],
      },
    };
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
    const slug = this.slugify(data.title);

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
      updateData.slug = this.slugify(data.title);
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
