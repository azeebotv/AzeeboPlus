import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface SavedItem {
  id: string;
  userId: string;
  itemType: string;
  itemId: string;
  note: string | null;
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
  private readonly logger = new Logger(SocialService.name);

  constructor(private prisma: PrismaService) {}

  async saveItem(data: SaveItemData): Promise<SavedItemsResponse> {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to save item: ${error}`);
      return {
        success: false,
        error: { code: 'SAVE_FAILED', message: 'Failed to save item' },
      };
    }
  }

  async unsaveItem(userId: string, itemType: string, itemId: string): Promise<SavedItemsResponse> {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to unsave item: ${error}`);
      return {
        success: false,
        error: { code: 'UNSAVE_FAILED', message: 'Failed to unsave item' },
      };
    }
  }

  async getSavedItems(
    userId: string,
    page = 1,
    limit = 20,
    itemType?: string
  ): Promise<SavedItemsResponse> {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get saved items: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get saved items' },
      };
    }
  }

  async isSaved(userId: string, itemType: string, itemId: string): Promise<{ saved: boolean }> {
    try {
      const item = await this.prisma.savedItem.findUnique({
        where: {
          userId_itemType_itemId: { userId, itemType, itemId },
        },
      });
      return { saved: !!item };
    } catch (error) {
      this.logger.error(`Failed to check saved status: ${error}`);
      throw error;
    }
  }

  async shareItem(data: ShareData): Promise<ShareResponse> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to share item: ${error}`);
      return {
        success: false,
        error: { code: 'SHARE_FAILED', message: 'Failed to share item' },
      };
    }
  }

  async getShareCount(
    itemType: string,
    itemId: string
  ): Promise<{ count: number; byPlatform: Record<string, number> }> {
    try {
      const shares = await this.prisma.shareRecord.findMany({
        where: { itemType, itemId },
      });

      const byPlatform: Record<string, number> = {};
      shares.forEach((share) => {
        byPlatform[share.platform] = (byPlatform[share.platform] || 0) + 1;
      });

      return { count: shares.length, byPlatform };
    } catch (error) {
      this.logger.error(`Failed to get share count: ${error}`);
      throw error;
    }
  }
}
