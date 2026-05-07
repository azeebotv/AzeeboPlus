import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface SavedItem {
  id: string;
  userId: string;
  itemType: string;
  itemId: string;
  note: string | null;
  createdAt: string;
}

interface _ShareRecord {
  id: string;
  userId: string;
  itemType: string;
  itemId: string;
  platform: string;
  createdAt: string;
}

interface SavedItemsResponse {
  success: boolean;
  data?: {
    items: SavedItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: { code: string; message: string };
}

interface ShareResponse {
  success: boolean;
  data?: { message: string; shareId: string };
  error?: { code: string; message: string };
}

interface SaveItemData {
  userId: string;
  itemType: string;
  itemId: string;
  note?: string;
}

interface ShareData {
  userId: string;
  itemType: string;
  itemId: string;
  platform: string;
}

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async saveItem(data: SaveItemData): Promise<SavedItemsResponse> {
    const existing = await this.prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: data.userId,
          itemType: data.itemType,
          itemId: data.itemId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: { code: 'ALREADY_SAVED', message: 'Item already saved' },
      };
    }

    const item = await this.prisma.savedItem.create({
      data: {
        userId: data.userId,
        itemType: data.itemType,
        itemId: data.itemId,
        note: data.note,
      },
    });

    const formatted: SavedItem = {
      id: item.id,
      userId: item.userId,
      itemType: item.itemType,
      itemId: item.itemId,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    };

    return {
      success: true,
      data: { items: [formatted], total: 1, page: 1, limit: 1, totalPages: 1 },
    };
  }

  async unsaveItem(userId: string, itemType: string, itemId: string): Promise<SavedItemsResponse> {
    const item = await this.prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: { userId, itemType, itemId },
      },
    });

    if (!item) {
      throw new NotFoundException('Saved item not found');
    }

    await this.prisma.savedItem.delete({
      where: { id: item.id },
    });

    return {
      success: true,
      data: { items: [], total: 0, page: 1, limit: 1, totalPages: 0 },
    };
  }

  async getSavedItems(
    userId: string,
    page = 1,
    limit = 20,
    itemType?: string
  ): Promise<SavedItemsResponse> {
    const where: { userId: string; itemType?: string } = { userId };
    if (itemType) {
      where.itemType = itemType;
    }

    const [items, total] = await Promise.all([
      this.prisma.savedItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.savedItem.count({ where }),
    ]);

    const formatted: SavedItem[] = items.map((item) => ({
      id: item.id,
      userId: item.userId,
      itemType: item.itemType,
      itemId: item.itemId,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    }));

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

  async isSaved(userId: string, itemType: string, itemId: string): Promise<{ saved: boolean }> {
    const item = await this.prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: { userId, itemType, itemId },
      },
    });
    return { saved: !!item };
  }

  async shareItem(data: ShareData): Promise<ShareResponse> {
    const item = await this.prisma.shareRecord.create({
      data: {
        userId: data.userId,
        itemType: data.itemType,
        itemId: data.itemId,
        platform: data.platform,
      },
    });

    return {
      success: true,
      data: { message: 'Share recorded successfully', shareId: item.id },
    };
  }

  async getShareCount(
    itemType: string,
    itemId: string
  ): Promise<{ count: number; byPlatform: Record<string, number> }> {
    const shares = await this.prisma.shareRecord.findMany({
      where: { itemType, itemId },
    });

    const byPlatform: Record<string, number> = {};
    shares.forEach((share) => {
      byPlatform[share.platform] = (byPlatform[share.platform] || 0) + 1;
    });

    return { count: shares.length, byPlatform };
  }
}
