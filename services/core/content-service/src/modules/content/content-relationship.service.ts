import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';

type ContentRelationshipWithContent = Prisma.ContentRelationshipGetPayload<{
  include: { content: true; relatedContent: true };
}>;
type ContentRelationshipWithRelatedUniverse = Prisma.ContentRelationshipGetPayload<{
  include: { relatedContent: { include: { universe: true } } };
}>;
type ContentWithUniverseMediaAsset = Prisma.ContentItemGetPayload<{
  include: { universe: true; mediaAsset: true };
}>;

@Injectable()
export class ContentRelationshipService {
  private readonly logger = new Logger(ContentRelationshipService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private canModifyContent(
    userId: string,
    userRole: string | undefined,
    creatorId: string
  ): boolean {
    return creatorId === userId || userRole === 'admin' || userRole === 'moderator';
  }

  async addContentRelationship(
    userId: string,
    contentId: string,
    relatedContentId: string,
    relationshipType: string,
    userRole?: string
  ): Promise<{ success: boolean; data: ContentRelationshipWithContent }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to modify this content');
      }

      const relatedContent = await this.prisma.contentItem.findUnique({
        where: { id: relatedContentId },
      });

      if (!relatedContent) {
        throw new NotFoundException(`Related content not found`);
      }

      const existingRelationship = await this.prisma.contentRelationship.findUnique({
        where: { contentId_relatedContentId: { contentId, relatedContentId } },
      });

      if (existingRelationship) {
        throw new BadRequestException('Relationship already exists');
      }

      const relationship = await this.prisma.contentRelationship.create({
        data: {
          contentId,
          relatedContentId,
          type: relationshipType,
        },
        include: {
          content: true,
          relatedContent: true,
        },
      });

      return {
        success: true,
        data: relationship,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      this.logger.error(`Failed to add content relationship: ${error}`);
      return {
        success: false,
        error: { code: 'ADD_RELATIONSHIP_FAILED', message: 'Failed to add content relationship' },
      } as never;
    }
  }

  async removeContentRelationship(
    userId: string,
    contentId: string,
    relatedContentId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to modify this content');
      }

      const relationship = await this.prisma.contentRelationship.findUnique({
        where: { contentId_relatedContentId: { contentId, relatedContentId } },
      });

      if (!relationship) {
        throw new NotFoundException(`Relationship not found`);
      }

      await this.prisma.contentRelationship.delete({
        where: { id: relationship.id },
      });

      return {
        success: true,
        data: { message: 'Relationship removed successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to remove content relationship: ${error}`);
      return {
        success: false,
        error: {
          code: 'REMOVE_RELATIONSHIP_FAILED',
          message: 'Failed to remove content relationship',
        },
      } as never;
    }
  }

  async getContentRelationships(contentId: string): Promise<{
    success: boolean;
    data: ContentRelationshipWithRelatedUniverse[];
  }> {
    try {
      const relationships = await this.prisma.contentRelationship.findMany({
        where: {
          contentId,
        },
        include: {
          relatedContent: {
            include: {
              universe: true,
            },
          },
        },
      });

      return {
        success: true,
        data: relationships,
      };
    } catch (error) {
      this.logger.error(`Failed to get content relationships: ${error}`);
      return {
        success: false,
        error: {
          code: 'GET_RELATIONSHIPS_FAILED',
          message: 'Failed to retrieve content relationships',
        },
      } as never;
    }
  }

  async getContentByRelationship(
    contentId: string,
    relationshipType?: string
  ): Promise<{ success: boolean; data: ContentWithUniverseMediaAsset[] }> {
    try {
      const where: Record<string, unknown> = {
        contentId,
      };

      if (relationshipType) {
        where.type = relationshipType;
      }

      const relationships = await this.prisma.contentRelationship.findMany({
        where,
        include: {
          relatedContent: {
            include: {
              universe: true,
              mediaAsset: true,
            },
          },
        },
      });

      const relatedContent = relationships.map((r) => r.relatedContent);

      return {
        success: true,
        data: relatedContent,
      };
    } catch (error) {
      this.logger.error(`Failed to get content by relationship: ${error}`);
      return {
        success: false,
        error: {
          code: 'GET_CONTENT_BY_RELATIONSHIP_FAILED',
          message: 'Failed to retrieve content by relationship',
        },
      } as never;
    }
  }
}
