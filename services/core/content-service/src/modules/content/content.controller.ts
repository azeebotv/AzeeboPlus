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
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit, Public, AdminGuard } from '@azeebo/security';
import { CacheInterceptor, Cache } from '@azeebo/shared-services';

import { ContentService } from './content.service.js';
import { AccessControlService } from './access-control.service.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto.js';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto.js';
import { ContentResponse } from './interfaces/content-response.interface.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Content')
@Controller('v1/content')
@UseInterceptors(CacheInterceptor)
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly accessControlService: AccessControlService
  ) {}

  // ========================
  // Static string GET routes (MUST come before :id parameterized routes)
  // ========================

  @Public()
  @Get()
  @Cache({ key: 'content:list:{universe}', ttl: 600 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'List content with filters' })
  @ApiResponse({ status: 200, description: 'Content list' })
  async listContent(
    @Query('universe') universe?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<ContentResponse> {
    const result = await this.contentService.listContent({ universe }, page, limit);
    return result;
  }

  @Public()
  @Get('home')
  @Cache({ key: 'content:home:{userId}', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get home feed content' })
  @ApiResponse({ status: 200, description: 'Home feed' })
  async getHomeFeed(
    @Request() req: { user?: { id: string } | null }
  ): Promise<ContentResponse> {
    return this.contentService.getHomeFeed(req?.user?.id);
  }

  @Public()
  @Get('watch')
  @Cache({ key: 'content:watch:{userId}', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get watch hub feed' })
  @ApiResponse({ status: 200, description: 'Watch hub feed' })
  async getWatchFeed(
    @Request() req: { user?: { id: string } | null }
  ): Promise<ContentResponse> {
    return this.contentService.getWatchFeed(req?.user?.id);
  }

  @Public()
  @Get('featured')
  @Cache({ key: 'content:featured', ttl: 600 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get featured content' })
  @ApiResponse({ status: 200, description: 'Featured content' })
  async getFeatured(): Promise<ContentResponse> {
    return this.contentService.getFeatured();
  }

  @Public()
  @Get('trending')
  @Cache({ key: 'content:trending', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get trending content' })
  @ApiResponse({ status: 200, description: 'Trending content' })
  async getTrending(): Promise<ContentResponse> {
    return this.contentService.getTrending();
  }

  @Public()
  @Get('new-releases')
  @Cache({ key: 'content:new-releases', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get new release content' })
  @ApiResponse({ status: 200, description: 'New releases' })
  async getNewReleases(@Query('limit') limit?: number): Promise<ContentResponse> {
    return this.contentService.getNewReleases(limit);
  }

  @Public()
  @Get('featured-slides')
  @Cache({ key: 'content:featured-slides', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get featured slides for hero carousel' })
  @ApiResponse({ status: 200, description: 'Featured slides' })
  async getFeaturedSlides(@Query('limit') limit?: number): Promise<ContentResponse> {
    return this.contentService.getFeaturedSlides(limit);
  }

  @Public()
  @Get('popular-region')
  @Cache({ key: 'content:popular-region', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get popular content in region' })
  @ApiResponse({ status: 200, description: 'Popular content' })
  async getPopularInRegion(@Query('limit') limit?: number): Promise<ContentResponse> {
    return this.contentService.getPopularInRegion(limit);
  }

  @Public()
  @Get('search')
  @Cache({ key: 'content:search:{q}', ttl: 600 })
  @UseGuards(RateLimitGuard)
  @RateLimit(50, 60000)
  @ApiOperation({ summary: 'Search content' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchContent(@Query('q') query: string): Promise<ContentResponse> {
    return this.contentService.searchContent(query);
  }

  @Get('recommended')
  @Cache({ key: 'content:recommended:{userId}', ttl: 1800 })
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get recommended content' })
  @ApiResponse({ status: 200, description: 'Recommended content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommended(
    @Request() req: { user: { id: string } }
  ): Promise<ContentResponse> {
    return this.contentService.getRecommended(req.user.id);
  }

  @Get('accessible')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get accessible content for user' })
  @ApiResponse({ status: 200, description: 'Accessible content list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAccessibleContent(
    @Request() req: { user: { id: string } },
    @Query('universeId') universeId?: string,
    @Query('windowType') windowType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const result = await this.accessControlService.getAccessibleContent(req.user.id, {
      universeId,
      windowType,
      page,
      limit,
    });
    return ApiResponseWrapper.success(result);
  }

  @Get('passes/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check pass access for user' })
  @ApiResponse({ status: 200, description: 'Pass access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkPassAccess(
    @Request() req: { user: { id: string } },
    @Query('universeId') universeId?: string
  ) {
    const result = await this.accessControlService.checkPassAccess(req.user.id, universeId);
    return ApiResponseWrapper.success(result);
  }

  @Get('rentals/:contentId/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check rental access for content' })
  @ApiResponse({ status: 200, description: 'Rental access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkRentalAccess(
    @Request() req: { user: { id: string } },
    @Param('contentId') contentId: string
  ) {
    const result = await this.accessControlService.checkRentalAccess(req.user.id, contentId);
    return ApiResponseWrapper.success(result);
  }

  @Get('screenings/:screeningId/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check screening access' })
  @ApiResponse({ status: 200, description: 'Screening access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkScreeningAccess(
    @Request() req: { user: { id: string } },
    @Param('screeningId') screeningId: string
  ) {
    const result = await this.accessControlService.checkScreeningAccess(req.user.id, screeningId);
    return ApiResponseWrapper.success(result);
  }

  @Get('extras/:extraId/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check locked extra access' })
  @ApiResponse({ status: 200, description: 'Locked extra access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkLockedExtraAccess(
    @Request() req: { user: { id: string } },
    @Param('extraId') extraId: string
  ) {
    const result = await this.accessControlService.checkLockedExtraAccess(req.user.id, extraId);
    return ApiResponseWrapper.success(result);
  }

  // Category endpoints
  @Get('categories')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(): Promise<ContentResponse> {
    return this.contentService.getCategories();
  }

  @Get('categories/:id/content')
  @ApiOperation({ summary: 'Get content by category' })
  @ApiResponse({ status: 200, description: 'Content list' })
  async getContentByCategory(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentByCategory(id);
  }

  // Tag endpoints
  @Get('tags')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Tags list' })
  async getTags(): Promise<ContentResponse> {
    return this.contentService.getTags();
  }

  @Get('tags/:id/content')
  @ApiOperation({ summary: 'Get content by tag' })
  @ApiResponse({ status: 200, description: 'Content list' })
  async getContentByTag(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentByTag(id);
  }

  // ========================
  // Parameterized GET routes (more specific patterns before :id catch-all)
  // ========================

  @Get('universe/:universeId')
  @Cache({ key: 'content:universe:{universeId}:{page}:{limit}', ttl: 600 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get content by universe' })
  @ApiResponse({ status: 200, description: 'Content list for universe' })
  async getContentByUniverse(
    @Param('universeId') universeId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<ContentResponse> {
    return this.contentService.listContent({ universe: universeId }, page, limit);
  }

  @Get('category/:categoryId')
  @Cache({ key: 'content:category:{categoryId}:{page}:{limit}', ttl: 600 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get content by category' })
  @ApiResponse({ status: 200, description: 'Content list for category' })
  async getContentByCategoryParam(
    @Param('categoryId') categoryId: string,
    @Query('page') _page?: number,
    @Query('limit') _limit?: number
  ): Promise<ContentResponse> {
    return this.contentService.getContentByCategory(categoryId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Get current user's content" })
  async getMyContent(
    @Request() req: { user: { id: string } },
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<ContentResponse> {
    return this.contentService.listContent({ creatorId: req.user.id, status }, page, limit);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: "Get creator's content" })
  async getContentByCreator(
    @Param('creatorId') creatorId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<ContentResponse> {
    return this.contentService.listContent({ creatorId }, page, limit);
  }

  @Public()
  @Get(':id')
  @Cache({ key: 'content:{id}', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiResponse({ status: 200, description: 'Content details' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContent(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContent(id);
  }

  @Public()
  @Get(':id/comments')
  @Cache({ key: 'content:{id}:comments', ttl: 120 })
  @ApiOperation({ summary: 'Get content comments' })
  @ApiResponse({ status: 200, description: 'Comments list' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentComments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<ContentResponse> {
    return this.contentService.getContentComments(id, page, limit);
  }

  @Get(':id/analytics')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get content analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not content owner' })
  async getContentAnalytics(
    @Param('id') id: string,
    @Request() req: { user?: { id: string } }
  ): Promise<ContentResponse> {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const content = await this.contentService.getContent(id);
    if (!content?.data?.creatorId || content.data.creatorId !== userId) {
      throw new HttpException(
        'Forbidden - you can only view analytics for your own content',
        HttpStatus.FORBIDDEN
      );
    }

    return this.contentService.getContentAnalytics(id);
  }

  @Get(':id/moderation-status')
  @ApiOperation({ summary: 'Get content moderation status' })
  @ApiResponse({ status: 200, description: 'Moderation status retrieved' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentModerationStatus(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentModerationStatus(id);
  }

  @Get(':id/access-check')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check if user can access content' })
  @ApiResponse({ status: 200, description: 'Access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkContentAccess(
    @Request() req: { user: { id: string } },
    @Param('id') id: string
  ) {
    const result = await this.accessControlService.checkContentAccess(req.user.id, id);
    return ApiResponseWrapper.success(result);
  }

  @Get(':id/playback-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get media playback URL with access check' })
  @ApiResponse({ status: 200, description: 'Playback URL' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMediaPlaybackUrl(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('expiresIn') _expiresIn: number = 3600
  ) {
    const result = await this.accessControlService.checkMediaPlaybackAccess(req.user.id, id);
    return ApiResponseWrapper.success(result);
  }

  @Get(':id/relationships')
  @ApiOperation({ summary: 'Get content relationships' })
  @ApiResponse({ status: 200, description: 'Relationships list' })
  async getContentRelationships(@Param('id') id: string): Promise<ContentResponse> {
    return this.contentService.getContentRelationships(id);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related content' })
  @ApiResponse({ status: 200, description: 'Related content list' })
  async getContentByRelationship(
    @Param('id') id: string,
    @Query('type') _type?: string
  ): Promise<ContentResponse> {
    return this.contentService.getContentByRelationship(id, _type);
  }

  @Get(':id/media')
  @UseGuards(AuthGuard('jwt'))
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
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Query('expiresIn') expiresIn: number = 3600
  ): Promise<ContentResponse> {
    return this.contentService.getSignedMediaUrl(req.user.id, id, expiresIn);
  }

  @Get(':id/transcode/:jobId/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transcoding job status' })
  @ApiResponse({ status: 200, description: 'Transcoding job status' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTranscodingStatus(
    @Request() _req: { user: { id: string } },
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
    @Request() _req: { user: { id: string } },
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Query('format') format: string,
    @Query('resolution') resolution: string,
    @Query('expiresIn') expiresIn: number = 3600
  ): Promise<ContentResponse> {
    return this.contentService.getTranscodedMediaUrl(id, jobId, format, resolution, expiresIn);
  }

  // ========================
  // POST routes
  // ========================

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create content' })
  @ApiResponse({ status: 201, description: 'Content created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createContent(
    @Request() req: { user: { id: string } },
    @Body() createContentDto: CreateContentDto
  ): Promise<ContentResponse> {
    return this.contentService.createContent(req.user.id, createContentDto);
  }

  @Post('categories')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Create category (admin only)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async createCategory(
    @Request() _req: { user: { id: string } },
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

  @Post('tags')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Create tag (admin only)' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async createTag(
    @Request() _req: { user: { id: string } },
    @Body() body: { name: string; description?: string }
  ): Promise<ContentResponse> {
    return this.contentService.createTag(body.name, body.description);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add comment to content' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addCommentToContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { text?: string; content?: string }
  ): Promise<ContentResponse> {
    return this.contentService.addCommentToContent(
      req.user.id,
      id,
      body.text || body.content || ''
    );
  }

  @Post(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create media asset for content' })
  @ApiResponse({ status: 201, description: 'Media asset created' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMediaAsset(
    @Request() req: { user: { id: string; role?: string } },
    @Param('id') id: string,
    @Body() createMediaAssetDto: CreateMediaAssetDto
  ): Promise<ContentResponse> {
    return this.contentService.createMediaAsset(
      req.user.id,
      id,
      createMediaAssetDto,
      req.user.role
    );
  }

  @Post(':id/media/thumbnail')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Generate thumbnail for media asset' })
  @ApiResponse({ status: 200, description: 'Thumbnail generated' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateThumbnail(
    @Request() _req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { width?: number; height?: number; quality?: number }
  ): Promise<ContentResponse> {
    return this.contentService.generateThumbnail(id, body);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Publish content' })
  @ApiResponse({ status: 200, description: 'Content published' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async publishContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.publishContent(req.user.id, id);
  }

  @Post(':id/unpublish')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Unpublish content' })
  @ApiResponse({ status: 200, description: 'Content unpublished' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unpublishContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.unpublishContent(req.user.id, id);
  }

  @Post(':id/report')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Report content' })
  @ApiResponse({ status: 200, description: 'Content reported' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reportContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { type: string; reason: string }
  ): Promise<ContentResponse> {
    return this.contentService.reportContent(req.user.id, id, body);
  }

  @Post(':id/transcode')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Start media transcoding' })
  @ApiResponse({ status: 200, description: 'Transcoding job started' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startTranscoding(
    @Request() _req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { formats?: string[]; resolutions?: string[]; bitrates?: number[] }
  ): Promise<ContentResponse> {
    return this.contentService.startTranscoding(id, body);
  }

  @Post(':id/scan')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Scan content for safety issues before publication' })
  @ApiResponse({ status: 200, description: 'Scan result' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async scanContentForSafety(
    @Request() _req: { user: { id: string } },
    @Param('id') id: string
  ) {
    const result = await this.contentService.scanContentForSafety(id);
    return ApiResponseWrapper.success(result);
  }

  @Post(':id/categories/:categoryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add category to content' })
  @ApiResponse({ status: 200, description: 'Category added' })
  @ApiResponse({ status: 404, description: 'Content or category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addCategoryToContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('categoryId') categoryId: string
  ): Promise<ContentResponse> {
    return this.contentService.addCategoryToContent(req.user.id, id, categoryId);
  }

  @Post(':id/tags/:tagId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add tag to content' })
  @ApiResponse({ status: 200, description: 'Tag added' })
  @ApiResponse({ status: 404, description: 'Content or tag not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addTagToContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('tagId') tagId: string
  ): Promise<ContentResponse> {
    return this.contentService.addTagToContent(req.user.id, id, tagId);
  }

  @Post(':id/relationships')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add content relationship' })
  @ApiResponse({ status: 201, description: 'Relationship created' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addContentRelationship(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { relatedContentId: string; type: string }
  ): Promise<ContentResponse> {
    return this.contentService.addContentRelationship(
      req.user.id,
      id,
      body.relatedContentId,
      body.type
    );
  }

  // ========================
  // PATCH routes
  // ========================

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update content' })
  @ApiResponse({ status: 200, description: 'Content updated' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto
  ): Promise<ContentResponse> {
    return this.contentService.updateContent(req.user.id, id, updateContentDto);
  }

  @Patch(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset updated' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMediaAsset(
    @Request() req: { user: { id: string; role?: string } },
    @Param('id') id: string,
    @Body() updateMediaAssetDto: UpdateMediaAssetDto
  ): Promise<ContentResponse> {
    return this.contentService.updateMediaAsset(
      req.user.id,
      id,
      updateMediaAssetDto,
      req.user.role
    );
  }

  @Patch('categories/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCategory(
    @Request() _req: { user: { id: string } },
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

  @Patch('tags/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update tag' })
  @ApiResponse({ status: 200, description: 'Tag updated' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTag(
    @Request() _req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string }
  ): Promise<ContentResponse> {
    return this.contentService.updateTag(id, body.name, body.description);
  }

  // ========================
  // DELETE routes
  // ========================

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete content' })
  @ApiResponse({ status: 200, description: 'Content soft deleted' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteContent(req.user.id, id);
  }

  @Delete(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset deleted' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMediaAsset(
    @Request() req: { user: { id: string; role?: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteMediaAsset(req.user.id, id, req.user.role);
  }

  @Delete(':id/categories/:categoryId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove category from content' })
  @ApiResponse({ status: 200, description: 'Category removed' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeCategoryFromContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('categoryId') categoryId: string
  ): Promise<ContentResponse> {
    return this.contentService.removeCategoryFromContent(req.user.id, id, categoryId);
  }

  @Delete(':id/tags/:tagId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove tag from content' })
  @ApiResponse({ status: 200, description: 'Tag removed' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeTagFromContent(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('tagId') tagId: string
  ): Promise<ContentResponse> {
    return this.contentService.removeTagFromContent(req.user.id, id, tagId);
  }

  @Delete(':id/relationships/:relatedContentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Remove content relationship' })
  @ApiResponse({ status: 200, description: 'Relationship removed' })
  @ApiResponse({ status: 404, description: 'Content or relationship not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeContentRelationship(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('relatedContentId') relatedContentId: string
  ): Promise<ContentResponse> {
    return this.contentService.removeContentRelationship(req.user.id, id, relatedContentId);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Delete category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category soft deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async deleteCategory(
    @Request() _req: { user: { id: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteCategory(id);
  }

  @Delete('tags/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Delete tag (admin only)' })
  @ApiResponse({ status: 200, description: 'Tag soft deleted' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async deleteTag(
    @Request() _req: { user: { id: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteTag(id);
  }
}
