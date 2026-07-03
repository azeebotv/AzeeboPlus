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

import { ContentService } from './content.service';
import { AccessControlService } from './access-control.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { ContentResponse } from './interfaces/content-response.interface';

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

  @Get('home')
  @Cache({ key: 'content:home:{userId}', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get home feed content' })
  @ApiResponse({ status: 200, description: 'Home feed' })
  async getHomeFeed(@Request() req: { user?: { sub: string } | null }): Promise<ContentResponse> {
    return this.contentService.getHomeFeed(req?.user?.sub);
  }

  @Get('watch')
  @Cache({ key: 'content:watch:{userId}', ttl: 300 })
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get watch hub feed' })
  @ApiResponse({ status: 200, description: 'Watch hub feed' })
  async getWatchFeed(@Request() req: { user?: { sub: string } | null }): Promise<ContentResponse> {
    return this.contentService.getWatchFeed(req?.user?.sub);
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
  async getRecommended(@Request() req: { user: { sub: string } }): Promise<ContentResponse> {
    return this.contentService.getRecommended(req.user.sub);
  }

  @Get('accessible')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get accessible content for user' })
  @ApiResponse({ status: 200, description: 'Accessible content list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAccessibleContent(
    @Request() req: { user: { sub: string } },
    @Query('universeId') universeId?: string,
    @Query('windowType') windowType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<{
    success: boolean;
    data: {
      freeContent: unknown[];
      premiumContent: unknown[];
      totalFree: number;
      totalPremium: number;
    };
  }> {
    const result = await this.accessControlService.getAccessibleContent(req.user.sub, {
      universeId,
      windowType,
      page,
      limit,
    });
    return { success: true, data: result };
  }

  @Get('passes/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check pass access for user' })
  @ApiResponse({ status: 200, description: 'Pass access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkPassAccess(
    @Request() req: { user: { sub: string } },
    @Query('universeId') universeId?: string
  ): Promise<{
    success: boolean;
    data: { hasAccess: boolean; reason?: string; accessType?: string; expiresAt?: Date };
  }> {
    const result = await this.accessControlService.checkPassAccess(req.user.sub, universeId);
    return { success: true, data: result };
  }

  @Get('rentals/:contentId/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check rental access for content' })
  @ApiResponse({ status: 200, description: 'Rental access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkRentalAccess(
    @Request() req: { user: { sub: string } },
    @Param('contentId') contentId: string
  ): Promise<{
    success: boolean;
    data: { hasAccess: boolean; reason?: string; accessType?: string; expiresAt?: Date };
  }> {
    const result = await this.accessControlService.checkRentalAccess(req.user.sub, contentId);
    return { success: true, data: result };
  }

  @Get('screenings/:screeningId/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check screening access' })
  @ApiResponse({ status: 200, description: 'Screening access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkScreeningAccess(
    @Request() req: { user: { sub: string } },
    @Param('screeningId') screeningId: string
  ): Promise<{
    success: boolean;
    data: { hasAccess: boolean; reason?: string; accessType?: string; expiresAt?: Date };
  }> {
    const result = await this.accessControlService.checkScreeningAccess(req.user.sub, screeningId);
    return { success: true, data: result };
  }

  @Get('extras/:extraId/access')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check locked extra access' })
  @ApiResponse({ status: 200, description: 'Locked extra access check result' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkLockedExtraAccess(
    @Request() req: { user: { sub: string } },
    @Param('extraId') extraId: string
  ): Promise<{
    success: boolean;
    data: { hasAccess: boolean; reason?: string; accessType?: string; expiresAt?: Date };
  }> {
    const result = await this.accessControlService.checkLockedExtraAccess(req.user.sub, extraId);
    return { success: true, data: result };
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
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<ContentResponse> {
    return this.contentService.getContentByCategory(categoryId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Get current user's content" })
  async getMyContent(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<ContentResponse> {
    return this.contentService.listContent({ creatorId: req.user.sub, status }, page, limit);
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

  @Get(':id/results')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get vote results for content' })
  @ApiResponse({ status: 200, description: 'Vote results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContentResults(@Param('id') id: string): Promise<ContentResponse> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'content-results' },
      HttpStatus.NOT_IMPLEMENTED
    );
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
    @Request() req: any
  ): Promise<ContentResponse> {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const content = await this.contentService.getContent(id);
    if (!content?.data?.userId || content.data.userId !== userId) {
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
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<{
    success: boolean;
    data: { hasAccess: boolean; reason?: string; accessType?: string; expiresAt?: Date };
  }> {
    const result = await this.accessControlService.checkContentAccess(req.user.sub, id);
    return { success: true, data: result };
  }

  @Get(':id/playback-url')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get media playback URL with access check' })
  @ApiResponse({ status: 200, description: 'Playback URL' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMediaPlaybackUrl(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Query('expiresIn') expiresIn: number = 3600
  ): Promise<{
    success: boolean;
    data: { canPlay: boolean; signedUrl?: string; expiresIn?: number; reason?: string };
  }> {
    const result = await this.accessControlService.checkMediaPlaybackAccess(req.user.sub, id);
    return { success: true, data: result };
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
    @Request() req: { user: { sub: string } },
    @Body() createContentDto: CreateContentDto
  ): Promise<ContentResponse> {
    return this.contentService.createContent(req.user.sub, createContentDto);
  }

  @Post('vote')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Vote on content' })
  @ApiResponse({ status: 201, description: 'Vote recorded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async vote(
    @Request() req: { user: { sub: string } },
    @Body() body: { contestantId?: string; episodeId?: string; isSuperVote: boolean }
  ): Promise<ContentResponse> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'content-vote' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Post('super-vote')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Super vote on content' })
  @ApiResponse({ status: 201, description: 'Super vote recorded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async superVote(
    @Request() req: { user: { sub: string } },
    @Body() body: { contestantId: string; episodeId: string; voteCount: number }
  ): Promise<ContentResponse> {
    throw new HttpException(
      { message: 'Not yet implemented', feature: 'content-super-vote' },
      HttpStatus.NOT_IMPLEMENTED
    );
  }

  @Post('categories')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Create category (admin only)' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
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

  @Post('tags')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Create tag (admin only)' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async createTag(
    @Request() req: { user: { sub: string } },
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
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { text?: string; content?: string }
  ): Promise<ContentResponse> {
    return this.contentService.addCommentToContent(
      req.user.sub,
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
    @Request() req: { user: { sub: string; role?: string } },
    @Param('id') id: string,
    @Body() createMediaAssetDto: CreateMediaAssetDto
  ): Promise<ContentResponse> {
    return this.contentService.createMediaAsset(req.user.sub, id, createMediaAssetDto, req.user.role);
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

  @Post(':id/scan')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Scan content for safety issues before publication' })
  @ApiResponse({ status: 200, description: 'Scan result' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async scanContentForSafety(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<{
    success: boolean;
    data: { scanId: string; result: string; threatLevel?: string; categories?: string[] };
  }> {
    return this.contentService.scanContentForSafety(id);
  }

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
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto
  ): Promise<ContentResponse> {
    return this.contentService.updateContent(req.user.sub, id, updateContentDto);
  }

  @Patch(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset updated' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMediaAsset(
    @Request() req: { user: { sub: string; role?: string } },
    @Param('id') id: string,
    @Body() updateMediaAssetDto: UpdateMediaAssetDto
  ): Promise<ContentResponse> {
    return this.contentService.updateMediaAsset(req.user.sub, id, updateMediaAssetDto, req.user.role);
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
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteContent(req.user.sub, id);
  }

  @Delete(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete media asset for content' })
  @ApiResponse({ status: 200, description: 'Media asset deleted' })
  @ApiResponse({ status: 404, description: 'Content or media asset not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMediaAsset(
    @Request() req: { user: { sub: string; role?: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteMediaAsset(req.user.sub, id, req.user.role);
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

  @Delete('categories/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Delete category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category soft deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async deleteCategory(
    @Request() req: { user: { sub: string } },
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
    @Request() req: { user: { sub: string } },
    @Param('id') id: string
  ): Promise<ContentResponse> {
    return this.contentService.deleteTag(id);
  }
}
