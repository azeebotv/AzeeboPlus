import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface CityGuideEntry {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  coverImage: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  priceLevel: number;
  hours: string;
  phone: string;
  website: string;
  amenities: string[];
  status: string;
  viewCount: number;
  createdById: string;
  publishedAt: string;
  createdAt: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface CityGuideResponse {
  success: boolean;
  data?:
    | CityGuideEntry
    | CityGuideEntry[]
    | Tag[]
    | { items: CityGuideEntry[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

interface CreateCityGuideData {
  name: string;
  type: string;
  description: string;
  coverImage?: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  priceLevel?: number;
  hours?: string;
  phone?: string;
  website?: string;
  amenities?: string[];
  createdById: string;
}

interface UpdateCityGuideData {
  name?: string;
  type?: string;
  description?: string;
  coverImage?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  priceLevel?: number;
  hours?: string;
  phone?: string;
  website?: string;
  amenities?: string[];
  status?: string;
}

interface WhereClause {
  status?: string;
  type?: string;
  city?: string;
}

@Injectable()
export class CityGuideService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  private formatEntry(entry: Record<string, unknown>, _tags?: Tag[]): CityGuideEntry {
    return {
      id: entry.id as string,
      name: entry.name as string,
      slug: entry.slug as string,
      type: entry.type as string,
      description: entry.description as string,
      coverImage: (entry.coverImage as string) || '',
      address: (entry.address as string) || '',
      city: entry.city as string,
      country: entry.country as string,
      latitude: (entry.latitude as number) || 0,
      longitude: (entry.longitude as number) || 0,
      rating: (entry.rating as number) || 0,
      priceLevel: (entry.priceLevel as number) || 0,
      hours: (entry.hours as string) || '',
      phone: (entry.phone as string) || '',
      website: (entry.website as string) || '',
      amenities: (entry.amenities as string[]) || [],
      status: entry.status as string,
      viewCount: entry.viewCount as number,
      createdById: entry.createdById as string,
      publishedAt: entry.publishedAt ? (entry.publishedAt as Date).toISOString() : '',
      createdAt: (entry.createdAt as Date).toISOString(),
    };
  }

  async getEntries(
    page = 1,
    limit = 20,
    type?: string,
    city?: string,
    status = 'published'
  ): Promise<CityGuideResponse> {
    const where: WhereClause = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (type) where.type = type;
    if (city) where.city = city;

    const [items, total] = await Promise.all([
      this.prisma.cityGuideEntry.findMany({
        where,
        include: { tags: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cityGuideEntry.count({ where }),
    ]);

    const formatted = items.map((item) => this.formatEntry(item, item.tags));

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
  }

  async getEntryBySlug(slug: string): Promise<CityGuideResponse> {
    const entry = await this.prisma.cityGuideEntry.findUnique({
      where: { slug },
      include: { tags: true },
    });

    if (!entry) {
      throw new NotFoundException(`City guide entry not found: ${slug}`);
    }

    await this.prisma.cityGuideEntry.update({
      where: { id: entry.id },
      data: { viewCount: entry.viewCount + 1 },
    });

    return {
      success: true,
      data: this.formatEntry(entry, entry.tags),
    };
  }

  async getFeaturedEntries(limit = 10): Promise<CityGuideResponse> {
    const entries = await this.prisma.cityGuideEntry.findMany({
      where: { status: 'published' },
      include: { tags: true },
      take: limit,
      orderBy: { viewCount: 'desc' },
    });

    return {
      success: true,
      data: entries.map((e) => this.formatEntry(e, e.tags)),
    };
  }

  async createEntry(data: CreateCityGuideData): Promise<CityGuideResponse> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const entry = await this.prisma.cityGuideEntry.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        description: data.description,
        coverImage: data.coverImage,
        address: data.address,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        rating: data.rating,
        priceLevel: data.priceLevel,
        hours: data.hours,
        phone: data.phone,
        website: data.website,
        amenities: data.amenities || [],
        status: 'draft',
        createdById: data.createdById,
      },
      include: { tags: true },
    });

    return {
      success: true,
      data: this.formatEntry(entry, entry.tags),
    };
  }

  async updateEntry(id: string, data: UpdateCityGuideData): Promise<CityGuideResponse> {
    const existing = await this.prisma.cityGuideEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`City guide entry not found: ${id}`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.priceLevel !== undefined) updateData.priceLevel = data.priceLevel;
    if (data.hours !== undefined) updateData.hours = data.hours;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.cityGuideEntry.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });

    return {
      success: true,
      data: this.formatEntry(updated, updated.tags),
    };
  }

  async deleteEntry(id: string): Promise<CityGuideResponse> {
    const entry = await this.prisma.cityGuideEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`City guide entry not found: ${id}`);
    }

    await this.prisma.cityGuideEntry.delete({ where: { id } });

    return {
      success: true,
      data: { message: 'Entry deleted successfully' },
    };
  }

  async getTags(): Promise<CityGuideResponse> {
    const tags = await this.prisma.cityGuideTag.findMany({
      orderBy: { name: 'asc' },
    });

    const formatted: Tag[] = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));

    return { success: true, data: formatted };
  }

  async searchEntries(query: string, page = 1, limit = 20): Promise<CityGuideResponse> {
    const [items, total] = await Promise.all([
      this.prisma.cityGuideEntry.findMany({
        where: {
          status: 'published',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { tags: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cityGuideEntry.count({
        where: {
          status: 'published',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items: items.map((e) => this.formatEntry(e, e.tags)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
