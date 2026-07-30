import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface CelebrityEntry {
  id: string;
  name: string;
  slug: string;
  bio: string;
  coverImage: string;
  profession: string;
  nationality: string;
  birthDate: string;
  socialLinks: string;
  isFeatured: boolean;
  viewCount: number;
  status: string;
  publishedAt: string;
  createdAt: string;
}

interface CelebrityNews {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  celebrityId: string;
  status: string;
  publishedAt: string;
  createdAt: string;
}

interface CelebrityEntryWithNews extends CelebrityEntry {
  news: CelebrityNews[];
}

interface CelebrityResponse {
  success: boolean;
  data?:
    | CelebrityEntry
    | CelebrityEntry[]
    | CelebrityNews[]
    | CelebrityEntryWithNews
    | { items: CelebrityEntry[]; total: number; page: number; limit: number; totalPages: number }
    | { items: CelebrityNews[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

interface CreateCelebrityData {
  name: string;
  bio?: string;
  coverImage?: string;
  profession?: string;
  nationality?: string;
  birthDate?: string;
  socialLinks?: string;
  isFeatured?: boolean;
  createdById: string;
}

interface UpdateCelebrityData {
  name?: string;
  bio?: string;
  coverImage?: string;
  profession?: string;
  nationality?: string;
  birthDate?: string;
  socialLinks?: string;
  isFeatured?: boolean;
  status?: string;
}

interface CreateNewsData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  celebrityId: string;
}

@Injectable()
export class CelebrityService {
  private readonly logger = new Logger(CelebrityService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  private formatEntry(entry: Record<string, unknown>): CelebrityEntry {
    return {
      id: entry.id as string,
      name: entry.name as string,
      slug: entry.slug as string,
      bio: (entry.bio as string) || '',
      coverImage: (entry.coverImage as string) || '',
      profession: (entry.profession as string) || '',
      nationality: (entry.nationality as string) || '',
      birthDate: entry.birthDate ? (entry.birthDate as Date).toISOString() : '',
      socialLinks: (entry.socialLinks as string) || '',
      isFeatured: entry.isFeatured as boolean,
      viewCount: entry.viewCount as number,
      status: entry.status as string,
      publishedAt: entry.publishedAt ? (entry.publishedAt as Date).toISOString() : '',
      createdAt: (entry.createdAt as Date).toISOString(),
    };
  }

  private formatNews(news: Record<string, unknown>): CelebrityNews {
    return {
      id: news.id as string,
      title: news.title as string,
      slug: news.slug as string,
      content: news.content as string,
      excerpt: (news.excerpt as string) || '',
      coverImage: (news.coverImage as string) || '',
      celebrityId: news.celebrityId as string,
      status: news.status as string,
      publishedAt: news.publishedAt ? (news.publishedAt as Date).toISOString() : '',
      createdAt: (news.createdAt as Date).toISOString(),
    };
  }

  async getEntries(
    page = 1,
    limit = 20,
    profession?: string,
    featured?: boolean,
    status = 'published'
  ): Promise<CelebrityResponse> {
    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (profession) where.profession = profession;
    if (featured !== undefined) where.isFeatured = featured;

    const [items, total] = await Promise.all([
      this.prisma.celebrityEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { viewCount: 'desc' },
      }),
      this.prisma.celebrityEntry.count({ where }),
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

  async getEntryBySlug(slug: string): Promise<CelebrityResponse> {
    const entry = await this.prisma.celebrityEntry.findUnique({
      where: { slug },
      include: { news: { where: { status: 'published' }, take: 10 } },
    });

    if (!entry) {
      throw new NotFoundException(`Celebrity not found: ${slug}`);
    }

    await this.prisma.celebrityEntry.update({
      where: { id: entry.id },
      data: { viewCount: entry.viewCount + 1 },
    });

    return {
      success: true,
      data: {
        ...this.formatEntry(entry),
        news: entry.news.map((n) => this.formatNews(n)),
      },
    };
  }

  async getFeatured(limit = 10): Promise<CelebrityResponse> {
    const entries = await this.prisma.celebrityEntry.findMany({
      where: { status: 'published', isFeatured: true },
      take: limit,
      orderBy: { viewCount: 'desc' },
    });
    return { success: true, data: entries.map((e) => this.formatEntry(e)) };
  }

  async createEntry(data: CreateCelebrityData): Promise<CelebrityResponse> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const entry = await this.prisma.celebrityEntry.create({
      data: {
        name: data.name,
        slug,
        bio: data.bio,
        coverImage: data.coverImage,
        profession: data.profession,
        nationality: data.nationality,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        socialLinks: data.socialLinks,
        isFeatured: data.isFeatured || false,
        status: 'draft',
        createdById: data.createdById,
      },
    });

    return { success: true, data: this.formatEntry(entry) };
  }

  async updateEntry(id: string, data: UpdateCelebrityData): Promise<CelebrityResponse> {
    const existing = await this.prisma.celebrityEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Celebrity not found: ${id}`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.profession !== undefined) updateData.profession = data.profession;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.celebrityEntry.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: this.formatEntry(updated) };
  }

  async deleteEntry(id: string): Promise<CelebrityResponse> {
    const entry = await this.prisma.celebrityEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Celebrity not found: ${id}`);
    }

    await this.prisma.celebrityEntry.delete({ where: { id } });
    return { success: true, data: { message: 'Entry deleted successfully' } };
  }

  async getNews(celebrityId: string, page = 1, limit = 20): Promise<CelebrityResponse> {
    const [items, total] = await Promise.all([
      this.prisma.celebrityNews.findMany({
        where: { celebrityId, status: 'published' },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.celebrityNews.count({ where: { celebrityId, status: 'published' } }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((n) => this.formatNews(n)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createNews(data: CreateNewsData): Promise<{ success: boolean; data: CelebrityNews }> {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const news = await this.prisma.celebrityNews.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        celebrityId: data.celebrityId,
        status: 'draft',
      },
    });

    return { success: true, data: this.formatNews(news) };
  }
}
