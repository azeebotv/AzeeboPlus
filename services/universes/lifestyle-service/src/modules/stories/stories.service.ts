import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface Story {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  status: string;
  viewCount: number;
  readTime: number;
  publishedAt: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface StoryResponse {
  success: boolean;
  data?:
    | Story
    | Story[]
    | Category[]
    | { items: Story[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

interface CreateStoryData {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  authorId: string;
}

interface UpdateStoryData {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  status?: string;
}

interface WhereClause {
  status?: string;
  category?: { slug: string };
}

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getStories(page = 1, limit = 20, category?: string): Promise<StoryResponse> {
    try {
      const where: WhereClause = { status: 'published' };

      if (category) {
        where.category = { slug: category };
      }

      const [items, total] = await Promise.all([
        this.prisma.cultureStory.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: { category: true },
        }),
        this.prisma.cultureStory.count({ where }),
      ]);

      const formattedItems: Story[] = items.map((story) => ({
        id: story.id,
        title: story.title,
        slug: story.slug,
        content: story.content,
        excerpt: story.excerpt || '',
        coverImage: story.coverImage || '',
        categoryId: story.categoryId || '',
        categoryName: story.category?.name || '',
        authorId: story.authorId,
        authorName: '',
        status: story.status,
        viewCount: story.viewCount,
        readTime: story.readTime || Math.ceil(story.content.split(' ').length / 200),
        publishedAt: story.publishedAt?.toISOString() || '',
        createdAt: story.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: {
          items: formattedItems,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get stories: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get stories' },
      };
    }
  }

  async getCategories(): Promise<StoryResponse> {
    try {
      const categories = await this.prisma.storyCategory.findMany();
      const formattedCategories: Category[] = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
      }));

      return {
        success: true,
        data: formattedCategories,
      };
    } catch (error) {
      this.logger.error(`Failed to get categories: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get categories' },
      };
    }
  }

  async getStoryBySlug(slug: string): Promise<StoryResponse> {
    try {
      const story = await this.prisma.cultureStory.findUnique({
        where: { slug },
        include: { category: true },
      });

      if (!story) {
        throw new NotFoundException(`Story not found: ${slug}`);
      }

      const formattedStory: Story = {
        id: story.id,
        title: story.title,
        slug: story.slug,
        content: story.content,
        excerpt: story.excerpt || '',
        coverImage: story.coverImage || '',
        categoryId: story.categoryId || '',
        categoryName: story.category?.name || '',
        authorId: story.authorId,
        authorName: '',
        status: story.status,
        viewCount: story.viewCount,
        readTime: story.readTime || Math.ceil(story.content.split(' ').length / 200),
        publishedAt: story.publishedAt?.toISOString() || '',
        createdAt: story.createdAt.toISOString(),
      };

      return {
        success: true,
        data: formattedStory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get story by slug: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get story' },
      };
    }
  }

  async createStory(data: CreateStoryData): Promise<StoryResponse> {
    try {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const readTime = Math.ceil(data.content.split(' ').length / 200);

      const story = await this.prisma.cultureStory.create({
        data: {
          title: data.title,
          slug,
          content: data.content,
          excerpt: data.excerpt || '',
          coverImage: '',
          categoryId: data.categoryId || undefined,
          authorId: data.authorId,
          status: 'draft',
          viewCount: 0,
          readTime,
          publishedAt: null,
        },
        include: { category: true },
      });

      const formattedStory: Story = {
        id: story.id,
        title: story.title,
        slug: story.slug,
        content: story.content,
        excerpt: story.excerpt || '',
        coverImage: story.coverImage || '',
        categoryId: story.categoryId || '',
        categoryName: story.category?.name || 'Uncategorized',
        authorId: story.authorId,
        authorName: '',
        status: story.status,
        viewCount: story.viewCount,
        readTime: story.readTime || readTime,
        publishedAt: story.publishedAt?.toISOString() || '',
        createdAt: story.createdAt.toISOString(),
      };

      return {
        success: true,
        data: formattedStory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to create story: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create story' },
      };
    }
  }

  async updateStory(id: string, data: UpdateStoryData): Promise<StoryResponse> {
    try {
      const story = await this.prisma.cultureStory.findUnique({ where: { id } });

      if (!story) {
        throw new NotFoundException(`Story not found: ${id}`);
      }

      const updateData: Record<string, unknown> = {};
      if (data.title) {
        updateData.title = data.title;
        updateData.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (data.content) {
        updateData.content = data.content;
        updateData.readTime = Math.ceil(data.content.split(' ').length / 200);
      }
      if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === 'published' && !story.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      const updatedStory = await this.prisma.cultureStory.update({
        where: { id },
        data: updateData,
        include: { category: true },
      });

      const formattedStory: Story = {
        id: updatedStory.id,
        title: updatedStory.title,
        slug: updatedStory.slug,
        content: updatedStory.content,
        excerpt: updatedStory.excerpt || '',
        coverImage: updatedStory.coverImage || '',
        categoryId: updatedStory.categoryId || '',
        categoryName: updatedStory.category?.name || '',
        authorId: updatedStory.authorId,
        authorName: '',
        status: updatedStory.status,
        viewCount: updatedStory.viewCount,
        readTime: updatedStory.readTime || Math.ceil(updatedStory.content.split(' ').length / 200),
        publishedAt: updatedStory.publishedAt?.toISOString() || '',
        createdAt: updatedStory.createdAt.toISOString(),
      };

      return {
        success: true,
        data: formattedStory,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update story: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update story' },
      };
    }
  }

  async deleteStory(id: string): Promise<StoryResponse> {
    try {
      const story = await this.prisma.cultureStory.findUnique({ where: { id } });
      if (!story) {
        throw new NotFoundException(`Story not found: ${id}`);
      }

      await this.prisma.cultureStory.delete({ where: { id } });

      return {
        success: true,
        data: { message: 'Story deleted successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete story: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete story' },
      };
    }
  }

  async incrementViewCount(id: string): Promise<StoryResponse> {
    try {
      const story = await this.prisma.cultureStory.findUnique({ where: { id } });
      if (!story) {
        throw new NotFoundException(`Story not found: ${id}`);
      }

      const updated = await this.prisma.cultureStory.update({
        where: { id },
        data: { viewCount: story.viewCount + 1 },
      });

      return {
        success: true,
        data: { message: `View count incremented to ${updated.viewCount}` },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to increment view count: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to increment view count' },
      };
    }
  }
}
