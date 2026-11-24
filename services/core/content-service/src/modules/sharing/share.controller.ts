import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShareService } from './share.service.js';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { IsString } from 'class-validator';

class GenerateShareLinkDto {
  @IsString()
  contentId!: string;

  @IsString()
  platform!: string;
}

@ApiTags('Sharing')
@Controller('sharing')
@UseGuards(RateLimitGuard)
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('link')
  @RateLimit(30, 60000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a shareable link for content' })
  @ApiResponse({ status: 201, description: 'Share link created' })
  async generateShareLink(
    @Request() req: { user?: { id: string } },
    @Body() dto: GenerateShareLinkDto
  ) {
    const result = await this.shareService.generateShareLink(
      dto.contentId,
      dto.platform,
      req.user?.id
    );
    return { success: true, data: result };
  }

  @Public()
  @Get('resolve/:shortCode')
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Resolve a short share URL' })
  @ApiResponse({ status: 200, description: 'Content ID resolved' })
  async resolveShareLink(@Param('shortCode') shortCode: string) {
    const result = await this.shareService.resolveShareLink(shortCode);
    if (!result) {
      return { success: false, error: 'Share link not found' };
    }
    return { success: true, data: result };
  }

  @Get('analytics/:contentId')
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get share analytics for content' })
  @ApiResponse({ status: 200, description: 'Share analytics' })
  async getShareAnalytics(@Param('contentId') contentId: string) {
    const result = await this.shareService.getShareAnalytics(contentId);
    return { success: true, data: result };
  }

  @Public()
  @Get('preview/:contentId')
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get share preview metadata (Open Graph)' })
  @ApiResponse({ status: 200, description: 'Share preview data' })
  async getSharePreview(@Param('contentId') contentId: string) {
    const result = await this.shareService.getSharePreview(contentId);
    return { success: true, data: result };
  }
}
