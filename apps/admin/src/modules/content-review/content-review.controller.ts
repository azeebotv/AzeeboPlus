import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ContentReviewService } from './content-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/content-review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContentReviewController {
  constructor(private readonly contentReviewService: ContentReviewService) {}

  @Get()
  async getReviewQueue(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return this.contentReviewService.getContentReviewQueue(Number(page), Number(limit));
  }

  @Post(':id/approve')
  async approveContent(@Param('id') id: string) {
    return this.contentReviewService.approveContent(id);
  }

  @Post(':id/reject')
  async rejectContent(@Param('id') id: string) {
    return this.contentReviewService.rejectContent(id);
  }
}
