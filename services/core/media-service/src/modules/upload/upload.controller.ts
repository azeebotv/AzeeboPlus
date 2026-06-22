import {
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
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { PremiumContentService } from './premium-content.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';

@Controller('api/media')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly premiumContentService: PremiumContentService
  ) {}

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadImage(file);
  }

  @Post('upload/video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadVideo(file);
  }

  @Post('upload/audio')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadAudio(file);
  }

  @Post('upload/document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadDocument(file);
  }

  @Post('upload/thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  async uploadThumbnail(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadThumbnail(file);
  }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadAvatar(file);
  }

  @Post('upload/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(@UploadedFile() file: Express.Multer.File): Promise<unknown> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadBanner(file);
  }

  @Get('presigned/upload')
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
  async getPresignedDownloadUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn = 3600
  ): Promise<unknown> {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }
    const url = await this.uploadService.getPresignedDownloadUrl(key, Number(expiresIn));
    return ApiResponseWrapper.success({ url, expiresIn: Number(expiresIn) });
  }

  @Get('metadata')
  async getFileMetadata(@Query('key') key: string): Promise<unknown> {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }
    return this.uploadService.getFileMetadata(key);
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string): Promise<unknown> {
    await this.uploadService.deleteFile(decodeURIComponent(key));
    return ApiResponseWrapper.success({ message: 'File deleted successfully' });
  }

  @Get('transcoding/:jobId/status')
  async getTranscodingJobStatus(@Param('jobId') jobId: string): Promise<unknown> {
    const job = await this.uploadService.getTranscodingJobStatus(jobId);
    if (!job) {
      return ApiResponseWrapper.error('NOT_FOUND', 'Transcoding job not found');
    }
    return ApiResponseWrapper.success(job);
  }

  @Get('transcoding/jobs')
  async listTranscodingJobs(@Query('status') status?: string): Promise<unknown> {
    const jobs = await this.uploadService.listTranscodingJobs(
      status as 'pending' | 'processing' | 'completed' | 'failed'
    );
    return ApiResponseWrapper.success(jobs);
  }

  @Post('transcoding/retry-failed')
  async retryFailedTranscodingJobs(): Promise<unknown> {
    const retriedCount = await this.uploadService.retryFailedTranscodingJobs();
    return ApiResponseWrapper.success({ retriedCount });
  }

  @Post('cleanup/orphaned')
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
  async generatePremiumUrl(
    @Request() req: { user: { sub: string } },
    @Body() body: { contentId: string; expiresInSeconds?: number }
  ): Promise<unknown> {
    const { contentId, expiresInSeconds } = body;
    if (!contentId) {
      throw new BadRequestException('contentId is required');
    }

    const result = await this.premiumContentService.generatePremiumUrl(
      contentId,
      req.user.sub,
      expiresInSeconds
    );

    return ApiResponseWrapper.success(result);
  }

  @Post('premium/url/cdn')
  @UseGuards(AuthGuard('jwt'))
  async generateCdnPremiumUrl(
    @Request() req: { user: { sub: string } },
    @Body() body: { contentId: string; expiresInSeconds?: number }
  ): Promise<unknown> {
    const { contentId, expiresInSeconds } = body;
    if (!contentId) {
      throw new BadRequestException('contentId is required');
    }

    const result = await this.premiumContentService.generateCdnPremiumUrl(
      contentId,
      req.user.sub,
      expiresInSeconds
    );

    return ApiResponseWrapper.success(result);
  }

  @Post('premium/url/validate')
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
  async invalidatePremiumUrl(@Param('token') token: string): Promise<unknown> {
    await this.premiumContentService.invalidatePremiumUrl(token);
    return ApiResponseWrapper.success({ message: 'URL invalidated successfully' });
  }

  @Delete('premium/urls/user')
  @UseGuards(AuthGuard('jwt'))
  async invalidateAllUserUrls(@Request() req: { user: { sub: string } }): Promise<unknown> {
    const count = await this.premiumContentService.invalidateAllUserUrls(req.user.sub);
    return ApiResponseWrapper.success({ invalidatedCount: count });
  }

  @Get('premium/url/:token/analytics')
  @UseGuards(AuthGuard('jwt'))
  async getUrlAnalytics(@Param('token') token: string): Promise<unknown> {
    const result = await this.premiumContentService.getUrlAnalytics(token);
    return ApiResponseWrapper.success(result);
  }
}
