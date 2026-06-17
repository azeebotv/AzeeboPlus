import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StoriesService } from './stories.service';
import { RolesGuard, Roles } from '@azeebo/shared-services';

interface CreateStoryDto {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  authorId: string;
}

interface UpdateStoryDto {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  status?: string;
}

@ApiTags('Stories')
@Controller('v1/lifestyle/stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stories' })
  @ApiResponse({ status: 200, description: 'List of stories' })
  async getStories(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string
  ): Promise<unknown> {
    return this.storiesService.getStories(Number(page), Number(limit), category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get story categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories(): Promise<unknown> {
    return this.storiesService.getCategories();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get story by slug' })
  @ApiResponse({ status: 200, description: 'Story details' })
  async getStory(@Param('slug') slug: string): Promise<unknown> {
    return this.storiesService.getStoryBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create new story' })
  @ApiResponse({ status: 201, description: 'Story created' })
  async createStory(@Body() data: CreateStoryDto): Promise<unknown> {
    return this.storiesService.createStory(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Update story' })
  @ApiResponse({ status: 200, description: 'Story updated' })
  async updateStory(@Param('id') id: string, @Body() data: UpdateStoryDto): Promise<unknown> {
    return this.storiesService.updateStory(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Delete story' })
  @ApiResponse({ status: 200, description: 'Story deleted' })
  async deleteStory(@Param('id') id: string): Promise<unknown> {
    return this.storiesService.deleteStory(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment story view count' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  async incrementView(@Param('id') id: string): Promise<unknown> {
    return this.storiesService.incrementViewCount(id);
  }
}
