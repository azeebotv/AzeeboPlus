import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface NightlifeEntry {
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
  hours: string;
  dressCode: string;
  coverCharge: number;
  rating: number;
  status: string;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
}

interface NightlifeResponse {
  success: boolean;
  data?:
    | NightlifeEntry
    | NightlifeEntry[]
    | { items: NightlifeEntry[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

interface CreateNightlifeData {
  name: string;
  type: string;
  description: string;
  coverImage?: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  dressCode?: string;
  coverCharge?: number;
  rating?: number;
  createdById: string;
}

interface UpdateNightlifeData {
  name?: string;
  type?: string;
  description?: string;
  coverImage?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  dressCode?: string;
  coverCharge?: number;
  rating?: number;
  status?: string;
}

@Injectable()
export class NightlifeService {
  private readonly logger = new Logger(NightlifeService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  private formatEntry(entry: Record<string, unknown>): NightlifeEntry {
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
      hours: (entry.hours as string) || '',
      dressCode: (entry.dressCode as string) || '',
      coverCharge: (entry.coverCharge as number) || 0,
      rating: (entry.rating as number) || 0,
      status: entry.status as string,
      viewCount: entry.viewCount as number,
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
  ): Promise<NightlifeResponse> {
    try {
      const where: Record<string, unknown> = {};
      if (status !== 'all') where.status = status;
      if (type) where.type = type;
      if (city) where.city = city;

      const [items, total] = await Promise.all([
        this.prisma.nightlifeEntry.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { rating: 'desc' },
        }),
        this.prisma.nightlifeEntry.count({ where }),
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
    } catch (error) {
      this.logger.error(`Failed to get nightlife entries: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch nightlife entries' },
      };
    }
  }

  async getEntryBySlug(slug: string): Promise<NightlifeResponse> {
    try {
      const entry = await this.prisma.nightlifeEntry.findUnique({ where: { slug } });
      if (!entry) {
        throw new NotFoundException(`Nightlife entry not found: ${slug}`);
      }

      await this.prisma.nightlifeEntry.update({
        where: { id: entry.id },
        data: { viewCount: { increment: 1 } },
      });

      return { success: true, data: this.formatEntry(entry) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get nightlife entry ${slug}: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch nightlife entry' },
      };
    }
  }

  async getFeatured(limit = 10): Promise<NightlifeResponse> {
    try {
      const entries = await this.prisma.nightlifeEntry.findMany({
        where: { status: 'published' },
        orderBy: { rating: 'desc' },
        take: limit,
      });
      return { success: true, data: entries.map((e) => this.formatEntry(e)) };
    } catch (error) {
      this.logger.error(`Failed to get featured nightlife entries: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch featured entries' },
      };
    }
  }

  async createEntry(data: CreateNightlifeData): Promise<NightlifeResponse> {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const entry = await this.prisma.nightlifeEntry.create({
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
          hours: data.hours,
          dressCode: data.dressCode,
          coverCharge: data.coverCharge,
          rating: data.rating,
          status: 'draft',
          createdById: data.createdById,
        },
      });

      return { success: true, data: this.formatEntry(entry) };
    } catch (error) {
      this.logger.error(`Failed to create nightlife entry: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_ERROR', message: 'Failed to create nightlife entry' },
      };
    }
  }

  async updateEntry(id: string, data: UpdateNightlifeData): Promise<NightlifeResponse> {
    try {
      const existing = await this.prisma.nightlifeEntry.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Nightlife entry not found: ${id}`);
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
      if (data.hours !== undefined) updateData.hours = data.hours;
      if (data.dressCode !== undefined) updateData.dressCode = data.dressCode;
      if (data.coverCharge !== undefined) updateData.coverCharge = data.coverCharge;
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === 'published' && !existing.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      const updated = await this.prisma.nightlifeEntry.update({
        where: { id },
        data: updateData,
      });

      return { success: true, data: this.formatEntry(updated) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update nightlife entry ${id}: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_ERROR', message: 'Failed to update nightlife entry' },
      };
    }
  }

  async deleteEntry(id: string): Promise<NightlifeResponse> {
    try {
      const entry = await this.prisma.nightlifeEntry.findUnique({ where: { id } });
      if (!entry) {
        throw new NotFoundException(`Nightlife entry not found: ${id}`);
      }

      await this.prisma.nightlifeEntry.delete({ where: { id } });
      return { success: true, data: { message: 'Entry deleted successfully' } };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete nightlife entry ${id}: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_ERROR', message: 'Failed to delete nightlife entry' },
      };
    }
  }
}
