import { Inject,
  Controller,
  Post,
  Get,
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
 } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit, AdminGuard } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { PremiumContentService } from './premium-content.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@ApiTags('Media Upload')
@Controller('media')
@UseGuards(RateLimitGuard)
export class UploadController {
  constructor(
    @Inject(UploadService) private readonly uploadService: UploadService,
    @Inject(PremiumContentService) private readonly premiumContentService: PremiumContentService
  ) {}

  @Post('upload/image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadImage(file);
  }

  @Post('upload/video')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a video file' })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadVideo(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadVideo(file);
  }

  @Post('upload/audio')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an audio file' })
  @ApiResponse({ status: 201, description: 'Audio uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAudio(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadAudio(file);
  }

  @Post('upload/document')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document file' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadDocument(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadDocument(file);
  }

  @Post('upload/thumbnail')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(10, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a thumbnail image' })
  @ApiResponse({ status: 201, description: 'Thumbnail uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadThumbnail(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadThumbnail(file);
  }

  @Post('upload/avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a user avatar' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadAvatar(file);
  }

  @Post('upload/banner')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @RateLimit(5, 60000)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a user banner image' })
  @ApiResponse({ status: 201, description: 'Banner uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadBanner(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadBanner(file);
  }

  @Get('presigned/upload')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get file metadata by key' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved' })
  @ApiResponse({ status: 400, description: 'Missing required parameter: key' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFileMetadata(@Query('key') key: string): Promise<unknown> {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }
    return this.uploadService.getFileMetadata(key);
  }

  @Delete(':key')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file by key' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFile(
    @Request() req: { user: { id: string; role?: string } },
    @Param('key') key: string
  ): Promise<unknown> {
    const decodedKey = decodeURIComponent(key);
    const metadata = await this.uploadService.getFileMetadata(decodedKey);
    if (metadata && metadata.userId && metadata.userId !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only delete your own files');
    }
    await this.uploadService.deleteFile(decodedKey);
    return ApiResponseWrapper.success({ message: 'File deleted successfully' });
  }

  @Get('transcoding/:jobId/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  @UseGuards(AuthGuard('jwt'), AdminGuard)
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
  @UseGuards(AuthGuard('jwt'), AdminGuard)
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a premium content URL' })
  @ApiResponse({ status: 201, description: 'Premium URL generated' })
  @ApiResponse({ status: 400, description: 'contentId is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generatePremiumUrl(
    @Request() req: { user: { sub: string; id: string } },
    @Body() body: { contentId: string; expiresInSeconds?: number }
  ): Promise<unknown> {
    const { contentId, expiresInSeconds } = body;
    if (!contentId) {
      throw new BadRequestException('contentId is required');
    }

    const result = await this.premiumContentService.generatePremiumUrl(
      contentId,
      req.user.id,
      expiresInSeconds
    );

    return ApiResponseWrapper.success(result);
  }

  @Post('premium/url/cdn')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a CDN premium content URL' })
  @ApiResponse({ status: 201, description: 'CDN premium URL generated' })
  @ApiResponse({ status: 400, description: 'contentId is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateCdnPremiumUrl(
    @Request() req: { user: { sub: string; id: string } },
    @Body() body: { contentId: string; expiresInSeconds?: number }
  ): Promise<unknown> {
    const { contentId, expiresInSeconds } = body;
    if (!contentId) {
      throw new BadRequestException('contentId is required');
    }

    const result = await this.premiumContentService.generateCdnPremiumUrl(
      contentId,
      req.user.id,
      expiresInSeconds
    );

    return ApiResponseWrapper.success(result);
  }

  @Post('premium/url/validate')
  @ApiOperation({ summary: 'Validate a premium content URL token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  @ApiResponse({ status: 400, description: 'token is required' })
  async validatePremiumUrl(@Body() body: { token: string }): Promise<unknown> {
    const { token } = body;
    if (!token) {
      throw new BadRequestException('token is required');
    }

    const result = await this.premiumContentService.validatePremiumUrl(token);
    if (result.valid) {
      return ApiResponseWrapper.success(result);
    }
    return ApiResponseWrapper.error('INVALID_TOKEN', 'Token is invalid');
  }

  @Delete('premium/url/:token')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate a premium content URL' })
  @ApiResponse({ status: 200, description: 'URL invalidated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async invalidatePremiumUrl(@Param('token') token: string): Promise<unknown> {
    await this.premiumContentService.invalidatePremiumUrl(token);
    return ApiResponseWrapper.success({ message: 'URL invalidated successfully' });
  }

  @Delete('premium/urls/user')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics for a premium content URL' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUrlAnalytics(@Param('token') token: string): Promise<unknown> {
    const result = await this.premiumContentService.getUrlAnalytics(token);
    return ApiResponseWrapper.success(result);
  }
}
