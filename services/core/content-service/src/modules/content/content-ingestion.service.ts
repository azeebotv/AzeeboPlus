import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';
import { CreateContentDto } from './dto/create-content.dto.js';

type ContentWithUniverse = Prisma.ContentItemGetPayload<{ include: { universe: true } }>;

@Injectable()
export class ContentIngestionService {
  private readonly logger = new Logger(ContentIngestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async createContentRecord(
    userId: string,
    createContentDto: CreateContentDto,
    overrides: {
      status?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
      windowType?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const content = await this.prisma.contentItem.create({
        data: {
          ...createContentDto,
          creatorId: userId,
          status: overrides.status || 'draft',
          ...(overrides.isExclusive !== undefined && { isExclusive: overrides.isExclusive }),
          ...(overrides.isPremiere !== undefined && { isPremiere: overrides.isPremiere }),
          ...(overrides.windowType && { windowType: overrides.windowType }),
          metadata: {
            ...((createContentDto.metadata as Record<string, unknown>) || {}),
            ...overrides.metadata,
          } as Prisma.InputJsonValue,
        } as Prisma.ContentItemUncheckedCreateInput,
        include: { universe: true },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to create content record: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_CONTENT_RECORD_FAILED', message: 'Failed to create content record' },
      } as never;
    }
  }

  async ingestShortFormContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { isExclusive?: boolean; windowType?: 'basic' | 'standard' | 'premium' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      isExclusive: options?.isExclusive || false,
      windowType: options?.windowType || 'basic',
      metadata: { contentCategory: 'short-form' },
    });
  }

  async ingestLongFormContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { isPremiere?: boolean; windowType?: 'standard' | 'premium' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      isPremiere: options?.isPremiere || false,
      windowType: options?.windowType || 'standard',
      metadata: { contentCategory: 'long-form' },
    });
  }

  async ingestClipContent(
    userId: string,
    createContentDto: CreateContentDto,
    parentContentId: string,
    clipStartTime: number,
    clipEndTime: number
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const parentContent = await this.prisma.contentItem.findUnique({
        where: { id: parentContentId },
      });

      if (!parentContent) {
        throw new NotFoundException('Parent content not found');
      }

      return this.createContentRecord(userId, createContentDto, {
        windowType: parentContent.windowType,
        metadata: {
          contentCategory: 'clip',
          parentContentId,
          clipStartTime,
          clipEndTime,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to ingest clip content: ${error}`);
      return {
        success: false,
        error: { code: 'INGEST_CLIP_FAILED', message: 'Failed to ingest clip content' },
      } as never;
    }
  }

  async ingestEpisodeContent(
    userId: string,
    createContentDto: CreateContentDto,
    seasonNumber: number,
    episodeNumber: number,
    seriesId?: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      metadata: {
        contentCategory: 'episode',
        seasonNumber,
        episodeNumber,
        seriesId,
      },
    });
  }

  async ingestMovieContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { isPremiere?: boolean; isExclusive?: boolean; windowType?: 'standard' | 'premium' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      isPremiere: options?.isPremiere || false,
      isExclusive: options?.isExclusive || false,
      windowType: options?.windowType || 'premium',
      metadata: { contentCategory: 'movie' },
    });
  }

  async ingestGameContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { difficulty?: 'easy' | 'medium' | 'hard'; gameType?: string }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      metadata: {
        contentCategory: 'game',
        difficulty: options?.difficulty || 'medium',
        gameType: options?.gameType,
      },
    });
  }

  async ingestSportsHighlightContent(
    userId: string,
    createContentDto: CreateContentDto,
    gameDate: Date,
    teams: string[],
    highlightType: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      windowType: 'basic',
      metadata: {
        contentCategory: 'sports-highlight',
        gameDate: gameDate.toISOString(),
        teams,
        highlightType,
      },
    });
  }

  async ingestCreatorUpload(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { contentSubtype?: 'video' | 'audio' | 'image' | 'article' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.createContentRecord(userId, createContentDto, {
      windowType: 'basic',
      metadata: {
        contentCategory: 'creator-upload',
        contentSubtype: options?.contentSubtype || 'video',
        uploadedByCreator: true,
      },
    });
  }
}
