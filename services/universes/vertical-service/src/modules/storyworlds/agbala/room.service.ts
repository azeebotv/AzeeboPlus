import { Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from './cache.service';
import { SanitizationService, SpoilerLevel } from './sanitization.service';
import { buildOffsetPagination } from './pagination.helper';

interface RoomPost {
  id: string;
  roomId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  spoilerLevel: SpoilerLevel;
  likeCount: number;
  replyCount: number;
  status: string;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  memberCount: number;
  postCount: number;
  status: string;
  createdAt: string;
}

export interface RoomResponse {
  success: boolean;
  data?:
    | Room
    | Room[]
    | RoomPost
    | RoomPost[]
    | { items: Room[]; total: number; page: number; limit: number; totalPages: number }
    | { items: RoomPost[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

export interface CreateRoomData {
  name: string;
  description?: string;
  imageUrl?: string;
  universeId: string;
}

export interface CreateRoomPostData {
  roomId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  spoilerLevel?: string;
}

interface UpdateRoomData {
  name?: string;
  description?: string;
  imageUrl?: string;
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  private readonly rateLimitConfig = {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  };

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private cache: CacheService,
    @Inject(SanitizationService) private sanitization: SanitizationService
  ) {}

  private formatRoom(room: Record<string, unknown>): Room {
    return {
      id: room.id as string,
      name: room.name as string,
      slug: room.slug as string,
      description: (room.description as string) || '',
      imageUrl: (room.imageUrl as string) || '',
      memberCount: (room.memberCount as number) || 0,
      postCount: (room.postCount as number) || 0,
      status: room.status as string,
      createdAt: (room.createdAt as Date).toISOString(),
    };
  }

  private formatRoomPost(post: Record<string, unknown>): RoomPost {
    return {
      id: post.id as string,
      roomId: post.roomId as string,
      content: post.content as string,
      authorId: post.authorId as string,
      authorName: (post.authorName as string) || '',
      authorAvatar: (post.authorAvatar as string) || '',
      spoilerLevel: (post.spoilerLevel as SpoilerLevel) || SpoilerLevel.NONE,
      likeCount: (post.likeCount as number) || 0,
      replyCount: (post.replyCount as number) || 0,
      status: post.status as string,
      createdAt: (post.createdAt as Date).toISOString(),
    };
  }

  async getRooms(page = 1, limit = 20): Promise<RoomResponse> {
    try {
      const cacheKey = `rooms:list:${page}:${limit}`;
      const cached = await this.cache.get<RoomResponse>(cacheKey);
      if (cached) return cached;

      const pagination = buildOffsetPagination(page, limit);

      const [items, total] = await Promise.all([
        this.prisma.room.findMany({
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.room.count(),
      ]);

      const response: RoomResponse = {
        success: true,
        data: {
          items: items.map((r) => this.formatRoom(r)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get rooms: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get rooms' },
      };
    }
  }

  async getRoomBySlug(slug: string): Promise<RoomResponse> {
    try {
      const cacheKey = `rooms:detail:${slug}`;
      const cached = await this.cache.get<RoomResponse>(cacheKey);
      if (cached) return cached;

      const room = await this.prisma.room.findUnique({
        where: { slug },
      });

      if (!room) {
        throw new NotFoundException(`Room not found: ${slug}`);
      }

      const response: RoomResponse = {
        success: true,
        data: this.formatRoom(room),
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get room by slug: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get room' },
      };
    }
  }

  async getRoomPosts(roomId: string, page = 1, limit = 20): Promise<RoomResponse> {
    try {
      const cacheKey = `rooms:posts:${roomId}:${page}:${limit}`;
      const cached = await this.cache.get<RoomResponse>(cacheKey);
      if (cached) return cached;

      const where = { roomId, status: 'published' };
      const pagination = buildOffsetPagination(page, limit);

      const [items, total] = await Promise.all([
        this.prisma.roomPost.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.roomPost.count({ where }),
      ]);

      const response: RoomResponse = {
        success: true,
        data: {
          items: items.map((p) => this.formatRoomPost(p)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get room posts: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get room posts' },
      };
    }
  }

  async createRoom(data: CreateRoomData): Promise<RoomResponse> {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const room = await this.prisma.room.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          universeId: data.universeId,
        },
      });

      await this.cache.invalidate('rooms:');
      return { success: true, data: this.formatRoom(room) };
    } catch (error) {
      this.logger.error(`Failed to create room: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create room' },
      };
    }
  }

  async updateRoom(id: string, data: UpdateRoomData): Promise<RoomResponse> {
    try {
      const existing = await this.prisma.room.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Room not found: ${id}`);
      }

      const updateData: Record<string, unknown> = {};
      if (data.name) {
        updateData.name = data.name;
        updateData.slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      const updated = await this.prisma.room.update({
        where: { id },
        data: updateData,
      });

      await this.cache.invalidate('rooms:');
      return { success: true, data: this.formatRoom(updated) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update room: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update room' },
      };
    }
  }

  async createRoomPost(data: CreateRoomPostData): Promise<RoomResponse> {
    try {
      if (
        !this.sanitization.checkRateLimit(
          data.authorId,
          'create_room_post',
          this.rateLimitConfig.maxRequests,
          this.rateLimitConfig.windowMs
        )
      ) {
        throw new ForbiddenException('Rate limit exceeded: max 20 posts per hour');
      }

      const room = await this.prisma.room.findUnique({ where: { id: data.roomId } });
      if (!room) {
        throw new NotFoundException(`Room not found: ${data.roomId}`);
      }

      const sanitizedContent = this.sanitization.sanitizeContent(data.content);
      const spoilerLevel = this.sanitization.validateSpoilerLevel(data.spoilerLevel || 'none');

      const post = await this.prisma.roomPost.create({
        data: {
          roomId: data.roomId,
          content: sanitizedContent,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatar: data.authorAvatar || '',
          spoilerLevel,
          status: 'published',
        },
      });

      await this.cache.invalidate(`rooms:posts:${data.roomId}`);
      await this.cache.invalidate('rooms:');
      return { success: true, data: this.formatRoomPost(post) };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to create room post: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create room post' },
      };
    }
  }

  async deleteRoomPost(id: string, userId: string): Promise<RoomResponse> {
    try {
      const existing = await this.prisma.roomPost.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Post not found: ${id}`);
      }

      if (existing.authorId !== userId) {
        throw new ForbiddenException('You can only delete your own posts');
      }

      await this.prisma.roomPost.delete({ where: { id } });
      await this.cache.invalidate(`rooms:posts:${existing.roomId}`);
      return { success: true, data: { message: 'Post deleted' } };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to delete room post: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete room post' },
      };
    }
  }
}
