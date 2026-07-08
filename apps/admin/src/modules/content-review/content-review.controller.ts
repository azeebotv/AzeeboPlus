import { Controller, Get, Post, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ContentReviewService } from './content-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogService } from '../audit/audit.service';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { id: string; email: string; role: string };
}

@Controller('admin/content-review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ContentReviewController {
  constructor(
    private readonly contentReviewService: ContentReviewService,
    private readonly auditService: AuditLogService,
  ) {}

  @Get()
  async getReviewQueue(
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    return this.contentReviewService.getContentReviewQueue(Number(page), Number(limit));
  }

  @Post(':id/approve')
  async approveContent(@Param('id') id: string, @Req() req: AuthRequest) {
    const result = await this.contentReviewService.approveContent(id);
    await this.auditService.log({
      actorId: req.user?.id,
      actorType: 'admin',
      action: 'content.approved',
      targetType: 'content',
      targetId: id,
      details: { contentId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }

  @Post(':id/reject')
  async rejectContent(@Param('id') id: string, @Req() req: AuthRequest) {
    const result = await this.contentReviewService.rejectContent(id);
    await this.auditService.log({
      actorId: req.user?.id,
      actorType: 'admin',
      action: 'content.rejected',
      targetType: 'content',
      targetId: id,
      details: { contentId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return result;
  }
}
