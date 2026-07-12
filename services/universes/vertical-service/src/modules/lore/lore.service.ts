import {Inject,  Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface LoreEntry {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  coverImage: string;
  importance: string;
  universeId: string;
  universeName: string;
  viewCount: number;
  status: string;
  createdAt: string;
}

interface LoreResponse {
  success: boolean;
  data?:
    | LoreEntry
    | LoreEntry[]
    | { items: LoreEntry[]; total: number; page: number; limit: number; totalPages: number }
    | { categories: string[] }
    | { message: string };
  error?: { code: string; message: string };
}

export interface CreateLoreData {
  title: string;
  category: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  importance?: string;
  universeId: string;
}

interface UpdateLoreData {
  title?: string;
  category?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  importance?: string;
  status?: string;
}

@Injectable()
export class LoreService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  private formatEntry(entry: Record<string, unknown>): LoreEntry {
    return {
      id: entry.id as string,
      title: entry.title as string,
      slug: entry.slug as string,
      category: entry.category as string,
      content: entry.content as string,
      excerpt: (entry.excerpt as string) || (entry.content as string).substring(0, 150),
      coverImage: (entry.coverImage as string) || '',
      importance: entry.importance as string,
      universeId: entry.universeId as string,
      universeName: (entry.universe as { name: string })?.name || '',
      viewCount: entry.viewCount as number,
      status: entry.status as string,
      createdAt: (entry.createdAt as Date).toISOString(),
    };
  }

  async getEntries(
    page = 1,
    limit = 20,
    universeSlug?: string,
    category?: string,
    importance?: string,
    status = 'published'
  ): Promise<LoreResponse> {
    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (category) where.category = category;
    if (importance) where.importance = importance;

    if (universeSlug) {
      const universe = await this.prisma.universeMap.findUnique({
        where: { slug: universeSlug },
      });
      if (universe) {
        where.universeId = universe.id;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.loreEntry.findMany({
        where,
        include: { universe: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loreEntry.count({ where }),
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

  async getEntryBySlug(slug: string): Promise<LoreResponse> {
    const entry = await this.prisma.loreEntry.findUnique({
      where: { slug },
      include: { universe: true },
    });

    if (!entry) {
      throw new NotFoundException(`Lore entry not found: ${slug}`);
    }

    await this.prisma.loreEntry.update({
      where: { id: entry.id },
      data: { viewCount: entry.viewCount + 1 },
    });

    return { success: true, data: this.formatEntry(entry) };
  }

  async getCategories(universeSlug?: string): Promise<LoreResponse> {
    const where: Record<string, unknown> = { status: 'published' };

    if (universeSlug) {
      const universe = await this.prisma.universeMap.findUnique({
        where: { slug: universeSlug },
      });
      if (universe) {
        where.universeId = universe.id;
      }
    }

    const entries = await this.prisma.loreEntry.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
    });

    return { success: true, data: { categories: entries.map((e) => e.category) } };
  }

  async createEntry(data: CreateLoreData): Promise<LoreResponse> {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const entry = await this.prisma.loreEntry.create({
      data: {
        title: data.title,
        slug,
        category: data.category,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        importance: data.importance || 'normal',
        universeId: data.universeId,
        status: 'published',
      },
      include: { universe: true },
    });

    return { success: true, data: this.formatEntry(entry) };
  }

  async updateEntry(id: string, data: UpdateLoreData): Promise<LoreResponse> {
    const existing = await this.prisma.loreEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Lore entry not found: ${id}`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.title) {
      updateData.title = data.title;
      updateData.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (data.category !== undefined) updateData.category = data.category;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.importance !== undefined) updateData.importance = data.importance;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.prisma.loreEntry.update({
      where: { id },
      data: updateData,
      include: { universe: true },
    });

    return { success: true, data: this.formatEntry(updated) };
  }

  async deleteEntry(id: string): Promise<LoreResponse> {
    const entry = await this.prisma.loreEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Lore entry not found: ${id}`);
    }

    await this.prisma.loreEntry.delete({ where: { id } });
    return { success: true, data: { message: 'Entry deleted' } };
  }
}
