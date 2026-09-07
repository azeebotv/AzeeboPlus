import {
  Inject,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { PremiumContentService } from './premium-content.service';
import { CdnPurgeService } from './cdn-purge.service';
import { MediaLifecycleService } from '../media/media-lifecycle.service';
import { InitChunkedUploadDto } from './dto/chunked-upload.dto.js';
import {
  GeneratePremiumUrlDto,
  ValidatePremiumUrlDto,
  CdnPurgeDto,
  LifecycleCdnPurgeDto,
} from './dto/premium-url.dto.js';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { FeatureFlag, FeatureFlagGuard, mediaFlags } from '@azeebo/feature-flags';

@ApiTags('Media Upload')
@Controller('media')
@UseGuards(RateLimitGuard)
export class UploadController {
  constructor(
    @Inject(UploadService) private readonly uploadService: UploadService,
    @Inject(PremiumContentService) private readonly premiumContentService: PremiumContentService,
    @Inject(CdnPurgeService) private readonly cdnPurgeService: CdnPurgeService,
    @Inject(MediaLifecycleService) private readonly mediaLifecycle: MediaLifecycleService
  ) {}

  @Post('upload/image')
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadImage(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/video')
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a video file' })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadVideo(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/audio')
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an audio file' })
  @ApiResponse({ status: 201, description: 'Audio uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadAudio(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/document')
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document file' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadDocument(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/thumbnail')
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a thumbnail image' })
  @ApiResponse({ status: 201, description: 'Thumbnail uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadThumbnail(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/avatar')
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a user avatar' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadAvatar(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/banner')
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a user banner image' })
  @ApiResponse({ status: 201, description: 'Banner uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadBanner(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user?: { id?: string } },
    @Res({ passthrough: true }) res: Response
  ): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.uploadService.uploadBanner(file, req.user?.id);
    res.setHeader('Cache-Control', result.cacheControl);
    return result;
  }

  @Post('upload/chunked/init')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.uploadChunked)
  @ApiOperation({ summary: 'Start a chunked/resumable upload session (media_upload_chunked)' })
  @ApiResponse({ status: 201, description: 'Upload session created' })
  @ApiResponse({ status: 403, description: 'Chunked uploads disabled' })
  async initChunkedUpload(
    @Request() req: { user?: { id?: string } },
    @Body() dto: InitChunkedUploadDto
  ): Promise<unknown> {
    const result = await this.uploadService.initChunkedUpload(dto, req.user?.id);
    return ApiResponseWrapper.success(result);
  }

  @Put('upload/chunked/:uploadId/:index')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.uploadChunked)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload one chunk of a chunked upload session' })
  @ApiResponse({ status: 200, description: 'Chunk stored' })
  @ApiResponse({ status: 400, description: 'Invalid chunk index or size' })
  @ApiResponse({ status: 403, description: 'Chunked uploads disabled' })
  async uploadChunk(
    @Param('uploadId') uploadId: string,
    @Param('index') index: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<unknown> {
    const result = await this.uploadService.uploadChunk(uploadId, Number.parseInt(index, 10), file);
    return ApiResponseWrapper.success(result);
  }

  @Post('upload/chunked/:uploadId/complete')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.uploadChunked)
  @ApiOperation({ summary: 'Assemble a chunked upload and process it like a normal upload' })
  @ApiResponse({ status: 201, description: 'Upload completed' })
  @ApiResponse({ status: 400, description: 'Incomplete session or assembly failure' })
  @ApiResponse({ status: 403, description: 'Chunked uploads disabled' })
  async completeChunkedUpload(@Param('uploadId') uploadId: string): Promise<unknown> {
    const result = await this.uploadService.completeChunkedUpload(uploadId);
    return ApiResponseWrapper.success(result);
  }

  @Get('presigned/upload')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.presignedUrls)
  @ApiOperation({ summary: 'Get a presigned upload URL' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  @ApiResponse({ status: 400, description: 'Missing required parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPresignedUploadUrl(
    @Query('type') type: 'image' | 'video' | 'audio' | 'document',
    @Query('fileId') fileId: string,
    @Query('extension') extension: string,
    @Query('contentType') contentType: string,
    @Query('expiresIn') expiresIn = 3600
  ): Promise<unknown> {
    if (!type || !fileId || !extension || !contentType) {
      throw new BadRequestException(
        'Missing required parameters: type, fileId, extension, contentType'
      );
    }
    return this.uploadService.getPresignedUploadUrl(
      type,
      fileId,
      extension,
      contentType,
      Number(expiresIn)
    );
  }

  @Get('presigned/download')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.presignedUrls)
  @ApiOperation({ summary: 'Get a presigned download URL' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  @ApiResponse({ status: 400, description: 'Missing or invalid key' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPresignedDownloadUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn = 3600
  ): Promise<unknown> {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }

    if (key.includes('..') || key.startsWith('/')) {
      throw new BadRequestException('Invalid key format');
    }

    const allowedPrefixes = [
      'uploads/',
      'images/',
      'videos/',
      'audio/',
      'documents/',
      'thumbnails/',
      'avatars/',
      'banners/',
    ];
    if (!allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
      throw new BadRequestException('Invalid key prefix');
    }

    const metadata = await this.uploadService.getFileMetadata(key);
    if (!metadata.contentType) {
      throw new BadRequestException('File not found');
    }

    const url = await this.uploadService.getPresignedDownloadUrl(key, Number(expiresIn));
    return ApiResponseWrapper.success({ url, expiresIn: Number(expiresIn) });
  }

  @Get('metadata')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file metadata by key' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved' })
  @ApiResponse({ status: 400, description: 'Missing required parameter: key' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFileMetadata(@Query('key') key: string): Promise<unknown> {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }
    if (key.includes('..') || key.startsWith('/')) {
      throw new BadRequestException('Invalid key format');
    }
    return this.uploadService.getFileMetadata(key);
  }

  @Delete(':key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file by key' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(
    @Request() req: { user: { id: string; role?: string } },
    @Param('key') key: string
  ): Promise<unknown> {
    const decodedKey = decodeURIComponent(key);
    if (decodedKey.includes('..') || decodedKey.startsWith('/')) {
      throw new BadRequestException('Invalid key format');
    }
    const metadata = await this.uploadService.getFileMetadata(decodedKey);
    const ownerId = metadata?.metadata?.userId;
    if (ownerId && ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own files');
    }
    await this.uploadService.deleteFile(decodedKey);
    return ApiResponseWrapper.success({ message: 'File deleted successfully' });
  }

  @Get('transcoding/:jobId/status')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.transcodeAv1)
  @ApiOperation({ summary: 'Get transcoding job status' })
  @ApiResponse({ status: 200, description: 'Job status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTranscodingJobStatus(@Param('jobId') jobId: string): Promise<unknown> {
    const job = await this.uploadService.getTranscodingJobStatus(jobId);
    if (!job) {
      return ApiResponseWrapper.error('NOT_FOUND', 'Transcoding job not found');
    }
    return ApiResponseWrapper.success(job);
  }

  @Get('transcoding/jobs')
  @ApiBearerAuth()
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(mediaFlags.transcodeAv1)
  @ApiOperation({ summary: 'List transcoding jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTranscodingJobs(@Query('status') status?: string): Promise<unknown> {
    const jobs = await this.uploadService.listTranscodingJobs(
      status as 'pending' | 'processing' | 'completed' | 'failed'
    );
    return ApiResponseWrapper.success(jobs);
  }

  @Post('transcoding/retry-failed')
  @UseGuards(FeatureFlagGuard, AdminGuard)
  @FeatureFlag(mediaFlags.transcodeAv1)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed transcoding jobs' })
  @ApiResponse({ status: 200, description: 'Failed jobs retried' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async retryFailedTranscodingJobs(): Promise<unknown> {
    const retriedCount = await this.uploadService.retryFailedTranscodingJobs();
    return ApiResponseWrapper.success({ retriedCount });
  }

  @Post('cleanup/orphaned')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup orphaned files' })
  @ApiResponse({ status: 200, description: 'Orphaned files cleaned up' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async cleanupOrphanedFiles(
    @Query('prefix') prefix?: string,
    @Query('olderThanDays') olderThanDays = 30
  ): Promise<unknown> {
    if (prefix) {
      const deletedCount = await this.uploadService.cleanupOrphanedFiles(
        prefix,
        Number(olderThanDays)
      );
      return ApiResponseWrapper.success({ deletedCount });
    } else {
      const results = await this.uploadService.cleanupAllOrphanedFiles();
      return ApiResponseWrapper.success(results);
    }
  }

  @Post('premium/url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a premium content URL' })
  @ApiResponse({ status: 201, description: 'Premium URL generated' })
  @ApiResponse({ status: 400, description: 'contentId is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generatePremiumUrl(
    @Request() req: { user: { sub: string; id: string } },
    @Body() dto: GeneratePremiumUrlDto
  ): Promise<unknown> {
    if (!dto.contentId) {
      throw new BadRequestException('contentId is required');
    }

    const result = await this.premiumContentService.generatePremiumUrl(
      dto.contentId,
      req.user.id,
      dto.expiresInSeconds
    );

    return ApiResponseWrapper.success(result);
  }

  @Post('premium/url/cdn')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a CDN premium content URL' })
  @ApiResponse({ status: 201, description: 'CDN premium URL generated' })
  @ApiResponse({ status: 400, description: 'contentId is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateCdnPremiumUrl(
    @Request() req: { user: { sub: string; id: string } },
    @Body() dto: GeneratePremiumUrlDto
  ): Promise<unknown> {
    if (!dto.contentId) {
      throw new BadRequestException('contentId is required');
    }

    const result = await this.premiumContentService.generateCdnPremiumUrl(
      dto.contentId,
      req.user.id,
      dto.expiresInSeconds
    );

    return ApiResponseWrapper.success(result);
  }

  @Post('premium/url/validate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a premium content URL token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  @ApiResponse({ status: 400, description: 'token is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validatePremiumUrl(@Body() dto: ValidatePremiumUrlDto): Promise<unknown> {
    if (!dto.token) {
      throw new BadRequestException('token is required');
    }

    const result = await this.premiumContentService.validatePremiumUrl(dto.token);
    if (result.valid) {
      return ApiResponseWrapper.success(result);
    }
    return ApiResponseWrapper.error('INVALID_TOKEN', 'Token is invalid');
  }

  @Delete('premium/url/:token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate a premium content URL' })
  @ApiResponse({ status: 200, description: 'URL invalidated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async invalidatePremiumUrl(@Param('token') token: string): Promise<unknown> {
    await this.premiumContentService.invalidatePremiumUrl(token);
    return ApiResponseWrapper.success({ message: 'URL invalidated successfully' });
  }

  @Delete('premium/urls/user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate all premium URLs for a user' })
  @ApiResponse({ status: 200, description: 'All user URLs invalidated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async invalidateAllUserUrls(
    @Request() req: { user: { sub: string; id: string } }
  ): Promise<unknown> {
    const count = await this.premiumContentService.invalidateAllUserUrls(req.user.id);
    return ApiResponseWrapper.success({ invalidatedCount: count });
  }

  @Get('premium/url/:token/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics for a premium content URL' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUrlAnalytics(@Param('token') token: string): Promise<unknown> {
    const result = await this.premiumContentService.getUrlAnalytics(token);
    return ApiResponseWrapper.success(result);
  }

  // ── Admin endpoints ──────────────────────────────────────────────
  @Post('admin/cdn/purge')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purge cached media from the CDN (admin)' })
  @ApiResponse({ status: 200, description: 'CDN purge initiated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async purgeCdn(@Body() dto: CdnPurgeDto): Promise<unknown> {
    if (dto.keys?.length) {
      const result = await this.cdnPurgeService.purgeKeys(dto.keys);
      return ApiResponseWrapper.success(result);
    }
    if (dto.prefix) {
      const result = await this.cdnPurgeService.purgePrefix(dto.prefix);
      return ApiResponseWrapper.success(result);
    }
    return ApiResponseWrapper.success({ purged: 0, message: 'Provide keys or prefix to purge' });
  }

  // ========================
  // Media lifecycle endpoints
  // ========================

  @Post('lifecycle/cdn-purge')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Purge CDN by URLs and patterns' })
  @ApiResponse({ status: 200, description: 'CDN purge completed' })
  async lifecycleCDNPurge(@Body() dto: LifecycleCdnPurgeDto) {
    const result = await this.mediaLifecycle.purgeCDN(dto);
    return ApiResponseWrapper.success(result);
  }

  @Get('lifecycle/transcoding/:jobId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transcoding job status via lifecycle service' })
  @ApiResponse({ status: 200, description: 'Transcoding status' })
  async getTranscodingLifecycleStatus(@Param('jobId') jobId: string) {
    const status = await this.mediaLifecycle.getTranscodingStatus(jobId);
    return ApiResponseWrapper.success(status);
  }

  @Post('lifecycle/cleanup/orphaned')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @ApiOperation({ summary: 'Cleanup orphaned media files' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupOrphaned() {
    const result = await this.mediaLifecycle.cleanupOrphanedMedia();
    return ApiResponseWrapper.success(result);
  }

  @Get('lifecycle/premium/:mediaUploadId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate premium media URL' })
  @ApiResponse({ status: 200, description: 'Premium URL' })
  async generatePremiumMediaUrl(
    @Param('mediaUploadId') mediaUploadId: string,
    @Query('expiresIn') expiresIn?: number
  ) {
    const result = await this.mediaLifecycle.generatePremiumUrl(mediaUploadId, { expiresIn });
    return ApiResponseWrapper.success(result);
  }
}
