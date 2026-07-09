import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

type CategoryModel = Prisma.CategoryGetPayload<{}>;
type TagModel = Prisma.TagGetPayload<{}>;
type ContentWithUniverseCategories = Prisma.ContentItemGetPayload<{ include: { universe: true; categories: true } }>;
type ContentWithUniverseTags = Prisma.ContentItemGetPayload<{ include: { universe: true; tags: true } }>;

@Injectable()
export class ContentCategoryService {
  private readonly logger = new Logger(ContentCategoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  private canModifyContent(userId: string, userRole: string | undefined, creatorId: string): boolean {
    return creatorId === userId || userRole === 'admin' || userRole === 'moderator';
  }

  async createCategory(
    name: string,
    slug: string,
    description?: string,
    icon?: string,
    color?: string
  ): Promise<{ success: boolean; data: CategoryModel }> {
    try {
      const category = await this.prisma.category.create({
        data: {
          name,
          slug,
          description,
          icon,
          color,
        },
      });

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      this.logger.error(`Failed to create category: ${error}`);
      return { success: false, error: { code: 'CREATE_CATEGORY_FAILED', message: 'Failed to create category' } } as never;
    }
  }

  async updateCategory(
    id: string,
    name?: string,
    slug?: string,
    description?: string,
    icon?: string,
    color?: string
  ): Promise<{ success: boolean; data: CategoryModel }> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException(`Category not found`);
      }

      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          name: name || category.name,
          slug: slug || category.slug,
          description: description !== undefined ? description : category.description,
          icon: icon !== undefined ? icon : category.icon,
          color: color !== undefined ? color : category.color,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedCategory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update category: ${error}`);
      return { success: false, error: { code: 'UPDATE_CATEGORY_FAILED', message: 'Failed to update category' } } as never;
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException(`Category not found`);
      }

      await this.prisma.category.delete({
        where: { id },
      });

      return {
        success: true,
        data: { message: 'Category deleted successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete category: ${error}`);
      return { success: false, error: { code: 'DELETE_CATEGORY_FAILED', message: 'Failed to delete category' } };
    }
  }

  async getCategories(): Promise<{ success: boolean; data: CategoryModel[] }> {
    try {
      const categories = await this.prisma.category.findMany();

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error}`);
      return { success: false, error: { code: 'GET_CATEGORIES_FAILED', message: 'Failed to retrieve categories' } };
    }
  }

  async createTag(name: string, description?: string): Promise<{ success: boolean; data: TagModel }> {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          name,
          description,
        },
      });

      return {
        success: true,
        data: tag,
      };
    } catch (error) {
      this.logger.error(`Failed to create tag: ${error}`);
      return { success: false, error: { code: 'CREATE_TAG_FAILED', message: 'Failed to create tag' } } as never;
    }
  }

  async updateTag(
    id: string,
    name?: string,
    description?: string
  ): Promise<{ success: boolean; data: TagModel }> {
    try {
      const tag = await this.prisma.tag.findUnique({
        where: { id },
      });

      if (!tag) {
        throw new NotFoundException(`Tag not found`);
      }

      const updatedTag = await this.prisma.tag.update({
        where: { id },
        data: {
          name: name || tag.name,
          description: description !== undefined ? description : tag.description,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedTag,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update tag: ${error}`);
      return { success: false, error: { code: 'UPDATE_TAG_FAILED', message: 'Failed to update tag' } } as never;
    }
  }

  async deleteTag(id: string): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const tag = await this.prisma.tag.findUnique({
        where: { id },
      });

      if (!tag) {
        throw new NotFoundException(`Tag not found`);
      }

      await this.prisma.tag.delete({
        where: { id },
      });

      return {
        success: true,
        data: { message: 'Tag deleted successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete tag: ${error}`);
      return { success: false, error: { code: 'DELETE_TAG_FAILED', message: 'Failed to delete tag' } };
    }
  }

  async getTags(): Promise<{ success: boolean; data: TagModel[] }> {
    try {
      const tags = await this.prisma.tag.findMany();

      return {
        success: true,
        data: tags,
      };
    } catch (error) {
      this.logger.error(`Failed to get tags: ${error}`);
      return { success: false, error: { code: 'GET_TAGS_FAILED', message: 'Failed to retrieve tags' } };
    }
  }

  async addCategoryToContent(
    userId: string,
    contentId: string,
    categoryId: string,
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

      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category not found`);
      }

      await this.prisma.contentItem.update({
        where: { id: contentId },
        data: {
          categories: {
            connect: { id: categoryId },
          },
        },
      });

      return {
        success: true,
        data: { message: 'Category added to content successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to add category to content: ${error}`);
      return { success: false, error: { code: 'ADD_CATEGORY_TO_CONTENT_FAILED', message: 'Failed to add category to content' } };
    }
  }

  async removeCategoryFromContent(
    userId: string,
    contentId: string,
    categoryId: string,
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

      await this.prisma.contentItem.update({
        where: { id: contentId },
        data: {
          categories: {
            disconnect: { id: categoryId },
          },
        },
      });

      return {
        success: true,
        data: { message: 'Category removed from content successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to remove category from content: ${error}`);
      return { success: false, error: { code: 'REMOVE_CATEGORY_FROM_CONTENT_FAILED', message: 'Failed to remove category from content' } };
    }
  }

  async addTagToContent(
    userId: string,
    contentId: string,
    tagId: string,
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

      const tag = await this.prisma.tag.findUnique({
        where: { id: tagId },
      });

      if (!tag) {
        throw new NotFoundException(`Tag not found`);
      }

      await this.prisma.contentItem.update({
        where: { id: contentId },
        data: {
          tags: {
            connect: { id: tagId },
          },
        },
      });

      return {
        success: true,
        data: { message: 'Tag added to content successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to add tag to content: ${error}`);
      return { success: false, error: { code: 'ADD_TAG_TO_CONTENT_FAILED', message: 'Failed to add tag to content' } };
    }
  }

  async removeTagFromContent(
    userId: string,
    contentId: string,
    tagId: string,
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

      await this.prisma.contentItem.update({
        where: { id: contentId },
        data: {
          tags: {
            disconnect: { id: tagId },
          },
        },
      });

      return {
        success: true,
        data: { message: 'Tag removed from content successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to remove tag from content: ${error}`);
      return { success: false, error: { code: 'REMOVE_TAG_FROM_CONTENT_FAILED', message: 'Failed to remove tag from content' } };
    }
  }

  async getContentByCategory(categoryId: string): Promise<{ success: boolean; data: ContentWithUniverseCategories[] }> {
    try {
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          categories: {
            some: {
              id: categoryId,
            },
          },
        },
        include: { universe: true, categories: true },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to get content by category: ${error}`);
      return { success: false, error: { code: 'GET_CONTENT_BY_CATEGORY_FAILED', message: 'Failed to retrieve content by category' } };
    }
  }

  async getContentByTag(tagId: string): Promise<{ success: boolean; data: ContentWithUniverseTags[] }> {
    try {
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          tags: {
            some: {
              id: tagId,
            },
          },
        },
        include: { universe: true, tags: true },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to get content by tag: ${error}`);
      return { success: false, error: { code: 'GET_CONTENT_BY_TAG_FAILED', message: 'Failed to retrieve content by tag' } };
    }
  }
}
