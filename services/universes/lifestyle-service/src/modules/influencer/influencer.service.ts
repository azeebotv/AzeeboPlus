import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface InfluencerEntry {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverImage: string;
  category: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isVerified: boolean;
  socialLinks: string;
  collaborationCount: number;
  status: string;
  createdAt: string;
}

interface Collaboration {
  id: string;
  influencerId: string;
  brandName: string;
  campaignName: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface InfluencerResponse {
  success: boolean;
  data?:
    | InfluencerEntry
    | InfluencerEntry[]
    | Collaboration[]
    | { items: InfluencerEntry[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

interface InfluencerEntryWithCollaborations extends InfluencerEntry {
  collaborations: Collaboration[];
}

interface CreateInfluencerData {
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;
  category?: string;
  socialLinks?: string;
}

interface UpdateInfluencerData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverImage?: string;
  category?: string;
  isVerified?: boolean;
  socialLinks?: string;
  status?: string;
}

interface CreateCollaborationData {
  influencerId: string;
  brandName: string;
  campaignName: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class InfluencerService {
  constructor(private prisma: PrismaService) {}

  private formatEntry(entry: Record<string, unknown>): InfluencerEntry {
    return {
      id: entry.id as string,
      userId: entry.userId as string,
      slug: entry.slug as string,
      displayName: entry.displayName as string,
      bio: (entry.bio as string) || '',
      avatarUrl: (entry.avatarUrl as string) || '',
      coverImage: (entry.coverImage as string) || '',
      category: (entry.category as string) || '',
      followerCount: entry.followerCount as number,
      followingCount: entry.followingCount as number,
      postCount: entry.postCount as number,
      isVerified: entry.isVerified as boolean,
      socialLinks: (entry.socialLinks as string) || '',
      collaborationCount: entry.collaborationCount as number,
      status: entry.status as string,
      createdAt: (entry.createdAt as Date).toISOString(),
    };
  }

  private formatCollaboration(collab: Record<string, unknown>): Collaboration {
    return {
      id: collab.id as string,
      influencerId: collab.influencerId as string,
      brandName: collab.brandName as string,
      campaignName: collab.campaignName as string,
      description: (collab.description as string) || '',
      coverImage: (collab.coverImage as string) || '',
      startDate: collab.startDate ? (collab.startDate as Date).toISOString() : '',
      endDate: collab.endDate ? (collab.endDate as Date).toISOString() : '',
      status: collab.status as string,
      createdAt: (collab.createdAt as Date).toISOString(),
    };
  }

  async getEntries(
    page = 1,
    limit = 20,
    category?: string,
    verified?: boolean,
    status = 'published'
  ): Promise<InfluencerResponse> {
    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;
    if (category) where.category = category;
    if (verified !== undefined) where.isVerified = verified;

    const [items, total] = await Promise.all([
      this.prisma.influencerEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { followerCount: 'desc' },
      }),
      this.prisma.influencerEntry.count({ where }),
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

  async getEntryBySlug(slug: string): Promise<{ success: boolean; data: InfluencerEntryWithCollaborations }> {
    const entry = await this.prisma.influencerEntry.findUnique({
      where: { slug },
      include: { collaborations: { where: { status: 'active' }, take: 10 } },
    });

    if (!entry) {
      throw new NotFoundException(`Influencer not found: ${slug}`);
    }

    return {
      success: true,
      data: {
        ...this.formatEntry(entry),
        collaborations: entry.collaborations.map((c) => this.formatCollaboration(c)),
      },
    };
  }

  async getFeatured(limit = 10): Promise<InfluencerResponse> {
    const entries = await this.prisma.influencerEntry.findMany({
      where: { status: 'published', isVerified: true },
      orderBy: { followerCount: 'desc' },
      take: limit,
    });
    return { success: true, data: entries.map((e) => this.formatEntry(e)) };
  }

  async createEntry(data: CreateInfluencerData): Promise<InfluencerResponse> {
    const slug = data.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const entry = await this.prisma.influencerEntry.create({
      data: {
        userId: data.userId,
        slug,
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        coverImage: data.coverImage,
        category: data.category,
        socialLinks: data.socialLinks,
        status: 'draft',
      },
    });

    return { success: true, data: this.formatEntry(entry) };
  }

  async updateEntry(id: string, data: UpdateInfluencerData): Promise<InfluencerResponse> {
    const existing = await this.prisma.influencerEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Influencer not found: ${id}`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.displayName) {
      updateData.displayName = data.displayName;
      updateData.slug = data.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.prisma.influencerEntry.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: this.formatEntry(updated) };
  }

  async deleteEntry(id: string): Promise<InfluencerResponse> {
    const entry = await this.prisma.influencerEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException(`Influencer not found: ${id}`);
    }

    await this.prisma.influencerEntry.delete({ where: { id } });
    return { success: true, data: { message: 'Entry deleted successfully' } };
  }

  async createCollaboration(
    data: CreateCollaborationData
  ): Promise<{ success: boolean; data: Collaboration }> {
    const collab = await this.prisma.influencerCollaboration.create({
      data: {
        influencerId: data.influencerId,
        brandName: data.brandName,
        campaignName: data.campaignName,
        description: data.description,
        coverImage: data.coverImage,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'active',
      },
    });

    await this.prisma.influencerEntry.update({
      where: { id: data.influencerId },
      data: { collaborationCount: { increment: 1 } },
    });

    return { success: true, data: this.formatCollaboration(collab) };
  }

  async getCollaborations(
    influencerId: string
  ): Promise<{ success: boolean; data: Collaboration[] }> {
    const collabs = await this.prisma.influencerCollaboration.findMany({
      where: { influencerId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: collabs.map((c) => this.formatCollaboration(c)),
    };
  }
}
