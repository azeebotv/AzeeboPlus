import { Inject, Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgbalaAdminService } from './agbala-admin.service';
import {
  CreatePathDto,
  UpdatePathDto,
  CreateQuizDto,
  RejectTheoryDto,
} from './dto/agbala-admin.dto';

/**
 * Upstream admin surface for the Agbala vertical. The admin backend proxies
 * /admin/agbala/* to these routes as /vertical/agbala/*:
 *
 *   POST   /vertical/agbala/storyworlds/:storyworldId/paths
 *   PATCH  /vertical/agbala/paths/:id
 *   DELETE /vertical/agbala/paths/:id
 *   GET    /vertical/agbala/quizzes
 *   POST   /vertical/agbala/quizzes
 *   DELETE /vertical/agbala/quizzes/:id
 *   GET    /vertical/agbala/moderation/review-queue
 *   POST   /vertical/agbala/moderation/:contentId/approve
 *   POST   /vertical/agbala/moderation/:contentId/reject
 */
@ApiTags('Agbala Admin')
@Controller('vertical/agbala')
export class AgbalaAdminController {
  constructor(@Inject(AgbalaAdminService) private readonly admin: AgbalaAdminService) {}

  // ── Paths ────────────────────────────────────────────────────────────────

  @Post('storyworlds/:storyworldId/paths')
  @ApiOperation({ summary: 'Create a learning path for a storyworld (admin)' })
  async createPath(@Param('storyworldId') storyworldId: string, @Body() dto: CreatePathDto) {
    return this.admin.createPath(storyworldId, dto);
  }

  @Patch('paths/:id')
  @ApiOperation({ summary: 'Update a learning path (admin)' })
  async updatePath(@Param('id') id: string, @Body() dto: UpdatePathDto) {
    return this.admin.updatePath(id, dto);
  }

  @Delete('paths/:id')
  @ApiOperation({ summary: 'Delete a learning path (admin)' })
  async deletePath(@Param('id') id: string) {
    return this.admin.deletePath(id);
  }

  // ── Quizzes ──────────────────────────────────────────────────────────────

  @Get('quizzes')
  @ApiOperation({ summary: 'List quizzes with optional storyworld filter (admin)' })
  async getQuizzes(
    @Query('storyworldId') storyworldId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.admin.getQuizzes({
      storyworldId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('quizzes')
  @ApiOperation({ summary: 'Create a quiz (admin)' })
  async createQuiz(@Body() dto: CreateQuizDto) {
    return this.admin.createQuiz(dto);
  }

  @Delete('quizzes/:id')
  @ApiOperation({ summary: 'Delete a quiz (admin)' })
  async deleteQuiz(@Param('id') id: string) {
    return this.admin.deleteQuiz(id);
  }

  // ── Moderation ───────────────────────────────────────────────────────────

  @Get('moderation/review-queue')
  @ApiOperation({ summary: 'List content pending review (admin)' })
  async getReviewQueue(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.admin.getReviewQueue({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('moderation/:contentId/approve')
  @ApiOperation({ summary: 'Approve queued content (admin)' })
  async approveContent(@Param('contentId') contentId: string) {
    return this.admin.approveContent(contentId);
  }

  @Post('moderation/:contentId/reject')
  @ApiOperation({ summary: 'Reject queued content with a reason (admin)' })
  async rejectContent(@Param('contentId') contentId: string, @Body() dto: RejectTheoryDto) {
    return this.admin.rejectContent(contentId, dto.reason);
  }
}
