import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { ContentResponse } from './interfaces/content-response.interface';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('home')
  @ApiOperation({ summary: 'Get home feed content' })
  @ApiResponse({ status: 200, description: 'Home feed' })
  async getHomeFeed(@Request() req: { user?: { sub: string } | null }): Promise<ContentResponse> {
    return this.contentService.getHomeFeed(req?.user?.sub);
  }

  @Get('watch')
  @ApiOperation({ summary: 'Get watch hub feed' })
  @ApiResponse({ status: 200, description: 'Watch hub feed' })
  async getWatchFeed(@Request() req: { user?: { sub: string } | null }): Promise<ContentResponse> {
    return this.contentService.getWatchFeed(req?.user?.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content details' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContent(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContent(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search content' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchContent(@Query('q') query: string): Promise<ContentResponse> {
    return this.contentService.searchContent(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending content' })
  @ApiResponse({ status: 200, description: 'Trending content' })
  async getTrending(): Promise<ContentResponse> {
    return this.contentService.getTrending();
  }

  @Get('recommended')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get recommended content' })
  @ApiResponse({ status: 200, description: 'Recommended content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommended(@Request() req: { user: { sub: string } }): Promise<ContentResponse> {
    return this.contentService.getRecommended(req.user.sub);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create content' })
  @ApiResponse({ status: 201, description: 'Content created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createContent(
    @Request() req: { user: { sub: string } },
    @Body() createContentDto: CreateContentDto
  ): Promise<ContentResponse> {
    return this.contentService.createContent(req.user.sub, createContentDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update content' })
  @ApiResponse({ status: 200, description: 'Content updated' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto
  ): Promise<ContentResponse> {
    return this.contentService.updateContent(req.user.sub, id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete content' })
  @ApiResponse({ status: 200, description: 'Content soft deleted' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteContent(req.user.sub, id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Publish content' })
  @ApiResponse({ status: 200, description: 'Content published' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async publishContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.publishContent(req.user.sub, id);
  }

  @Post(':id/unpublish')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Unpublish content' })
  @ApiResponse({ status: 200, description: 'Content unpublished' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unpublishContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.unpublishContent(req.user.sub, id);
  }

  @Post(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create media asset for content' })
  @ApiResponse({ status: 201, description: 'Media asset created' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMediaAsset(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() createMediaAssetDto: CreateMediaAssetDto
  ): Promise<ContentResponse> {
    return this.contentService.createMediaAsset(req.user.sub, id, createMediaAssetDto);
  }

  @Patch(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset updated' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMediaAsset(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() updateMediaAssetDto: UpdateMediaAssetDto
  ): Promise<ContentResponse> {
    return this.contentService.updateMediaAsset(req.user.sub, id, updateMediaAssetDto);
  }

  @Delete(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset deleted' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMediaAsset(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteMediaAsset(req.user.sub, id);
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Get media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset details' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  async getMediaAsset(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getMediaAsset(id);
  }

  @Get(':id/media/signed-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get signed URL for media asset' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Premium content requires subscription' })
  async getSignedMediaUrl(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Query('expiresIn') expiresIn: number = 3600
  ): Promise<ContentResponse> {
    return this.contentService.getSignedMediaUrl(req.user.sub, id, expiresIn);
  }

  @Post(':id/media/thumbnail')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Generate thumbnail for media asset' })
  @ApiResponse({ status: 200, description: 'Thumbnail generated' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateThumbnail(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { width?: number; height?: number; quality?: number }
  ): Promise<ContentResponse> {
    return this.contentService.generateThumbnail(id, body);
  }

  @Post(':id/report')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Report content' })
  @ApiResponse({ status: 200, description: 'Content reported' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reportContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { type: string; reason: string }
  ): Promise<ContentResponse> {
    return this.contentService.reportContent(req.user.sub, id, body);
  }

  @Get(':id/moderation-status')
  @ApiOperation({ summary: 'Get content moderation status' })
  @ApiResponse({ status: 200, description: 'Moderation status retrieved' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentModerationStatus(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentModerationStatus(id);
  }

  // Category endpoints
  @Post('categories')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCategory(
    @Request() req: { user: { sub: string } },
    @Body()
    body: { name: string; slug: string; description?: string; icon?: string; color?: string }
  ): Promise<ContentResponse> {
    return this.contentService.createCategory(
      body.name,
      body.slug,
      body.description,
      body.icon,
      body.color
    );
  }

  @Patch('categories/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCategory(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body()
    body: { name?: string; slug?: string; description?: string; icon?: string; color?: string }
  ): Promise<ContentResponse> {
    return this.contentService.updateCategory(
      id,
      body.name,
      body.slug,
      body.description,
      body.icon,
      body.color
    );
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category soft deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteCategory(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteCategory(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(): Promise<ContentResponse> {
    return this.contentService.getCategories();
  }

  // Tag endpoints
  @Post('tags')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create tag' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTag(
    @Request() req: { user: { sub: string } },
    @Body() body: { name: string; description?: string }
  ): Promise<ContentResponse> {
    return this.contentService.createTag(body.name, body.description);
  }

  @Patch('tags/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update tag' })
  @ApiResponse({ status: 200, description: 'Tag updated' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTag(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string }
  ): Promise<ContentResponse> {
    return this.contentService.updateTag(id, body.name, body.description);
  }
  @Delete('tags/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete tag' })
  @ApiResponse({ status: 200, description: 'Tag soft deleted' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTag(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteTag(id);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags list' })
  async getTags(): Promise<ContentResponse> {
    return this.contentService.getTags();
  }

  // Content categorization endpoints
  @Post(':id/categories/:categoryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add category to content' })
  @ApiResponse({ status: 200, description: 'Category added' })
  @ApiResponse({ status: 404, description: 'Content or category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addCategoryToContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('categoryId') categoryId: string
  ): Promise<ContentResponse> {
    return this.contentService.addCategoryToContent(req.user.sub, id, categoryId);
  }

  @Delete(':id/categories/:categoryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove category from content' })
  @ApiResponse({ status: 200, description: 'Category removed' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeCategoryFromContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('categoryId') categoryId: string
  ): Promise<ContentResponse> {
    return this.contentService.removeCategoryFromContent(req.user.sub, id, categoryId);
  }

  @Post(':id/tags/:tagId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add tag to content' })
  @ApiResponse({ status: 200, description: 'Tag added' })
  @ApiResponse({ status: 404, description: 'Content or tag not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTagToContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('tagId') tagId: string
  ): Promise<ContentResponse> {
    return this.contentService.addTagToContent(req.user.sub, id, tagId);
  }

  @Delete(':id/tags/:tagId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove tag from content' })
  @ApiResponse({ status: 200, description: 'Tag removed' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeTagFromContent(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('tagId') tagId: string
  ): Promise<ContentResponse> {
    return this.contentService.removeTagFromContent(req.user.sub, id, tagId);
  }

  // Get content by category or tag
  @Get('categories/:id/content')
  @ApiOperation({ summary: 'Get content by category' })
  @ApiResponse({ status: 200, description: 'Content list' })
  async getContentByCategory(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentByCategory(id);
  }

  @Get('tags/:id/content')
  @ApiOperation({ summary: 'Get content by tag' })
  @ApiResponse({ status: 200, description: 'Content list' })
  async getContentByTag(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentByTag(id);
  }

  // Content relationship endpoints
  @Post(':id/relationships')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add content relationship' })
  @ApiResponse({ status: 201, description: 'Relationship created' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addContentRelationship(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { relatedContentId: string; type: string }
  ): Promise<ContentResponse> {
    return this.contentService.addContentRelationship(
      req.user.sub,
      id,
      body.relatedContentId,
      body.type
    );
  }

  @Delete(':id/relationships/:relatedContentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove content relationship' })
  @ApiResponse({ status: 200, description: 'Relationship removed' })
  @ApiResponse({ status: 404, description: 'Content or relationship not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeContentRelationship(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('relatedContentId') relatedContentId: string
  ): Promise<ContentResponse> {
    return this.contentService.removeContentRelationship(req.user.sub, id, relatedContentId);
  }

  @Get(':id/relationships')
  @ApiOperation({ summary: 'Get content relationships' })
  @ApiResponse({ status: 200, description: 'Relationships list' })
  async getContentRelationships(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentRelationships(id);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related content' })
  @ApiResponse({ status: 200, description: 'Related content list' })
  async getContentByRelationship(
    @Param('id') id: string,
    @Query('type') type?: string
  ): Promise<ContentResponse> {
    return this.contentService.getContentByRelationship(id, type);
  }

  // Transcoding endpoints
  @Post(':id/transcode')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Start media transcoding' })
  @ApiResponse({ status: 200, description: 'Transcoding job started' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startTranscoding(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { formats?: string[]; resolutions?: string[]; bitrates?: number[] }
  ): Promise<ContentResponse> {
    return this.contentService.startTranscoding(id, body);
  }

  @Get(':id/transcode/:jobId/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transcoding job status' })
  @ApiResponse({ status: 200, description: 'Transcoding job status' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTranscodingStatus(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('jobId') jobId: string
  ): Promise<ContentResponse> {
    return this.contentService.getTranscodingStatus(id, jobId);
  }

  @Get(':id/transcode/:jobId/url')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transcoded media URL' })
  @ApiResponse({ status: 200, description: 'Transcoded media URL' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTranscodedMediaUrl(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Query('format') format: string,
    @Query('resolution') resolution: string,
    @Query('expiresIn') expiresIn: number = 3600
  ): Promise<ContentResponse> {
    return this.contentService.getTranscodedMediaUrl(id, jobId, format, resolution, expiresIn);
  }
}
