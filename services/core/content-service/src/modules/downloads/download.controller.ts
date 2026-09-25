import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DownloadService } from './download.service.js';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { IsString, IsIn } from 'class-validator';

class RequestDownloadDto {
  @IsString()
  contentId!: string;

  @IsString()
  @IsIn(['low', 'medium', 'high'])
  quality!: 'low' | 'medium' | 'high';
}

@ApiTags('Downloads')
@ApiBearerAuth()
@Controller('content/downloads')
@UseGuards(RateLimitGuard)
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Post()
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a content download for offline viewing' })
  @ApiResponse({ status: 201, description: 'Download initiated' })
  @ApiResponse({ status: 400, description: 'Storage quota exceeded or content not downloadable' })
  async requestDownload(@Request() req: { user: { id: string } }, @Body() dto: RequestDownloadDto) {
    const result = await this.downloadService.requestDownload({
      contentId: dto.contentId,
      quality: dto.quality,
      userId: req.user.id,
    });
    return { success: true, data: result };
  }

  @Get()
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get all downloads for current user' })
  @ApiResponse({ status: 200, description: 'List of downloads' })
  async getDownloads(@Request() req: { user: { id: string } }) {
    const downloads = await this.downloadService.getUserDownloads(req.user.id);
    return { success: true, data: downloads };
  }

  @Get('storage')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get storage usage info' })
  @ApiResponse({ status: 200, description: 'Storage info' })
  async getStorageInfo(@Request() req: { user: { id: string } }) {
    const info = await this.downloadService.getStorageInfo(req.user.id);
    return { success: true, data: info };
  }

  @Get(':downloadId')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get download by ID' })
  @ApiResponse({ status: 200, description: 'Download details' })
  async getDownload(
    @Request() req: { user: { id: string } },
    @Param('downloadId') downloadId: string
  ) {
    const download = await this.downloadService.getDownload(downloadId, req.user.id);
    return { success: true, data: download };
  }

  @Post(':downloadId/progress')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Update download progress' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateProgress(
    @Param('downloadId') downloadId: string,
    @Body() body: { progress: number }
  ) {
    await this.downloadService.updateProgress(downloadId, body.progress);
    return { success: true };
  }

  @Delete(':downloadId')
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a download' })
  @ApiResponse({ status: 200, description: 'Download deleted' })
  async deleteDownload(
    @Request() req: { user: { id: string } },
    @Param('downloadId') downloadId: string
  ) {
    await this.downloadService.deleteDownload(downloadId, req.user.id);
    return { success: true };
  }

  @Delete()
  @RateLimit(5, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete all downloads' })
  @ApiResponse({ status: 200, description: 'All downloads deleted' })
  async deleteAllDownloads(@Request() req: { user: { id: string } }) {
    const count = await this.downloadService.deleteAllDownloads(req.user.id);
    return { success: true, deletedCount: count };
  }
}
