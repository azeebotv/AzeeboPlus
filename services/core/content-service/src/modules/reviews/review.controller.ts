import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReviewService, CreateReviewDto } from './review.service.js';
import { RateLimitGuard, RateLimit, Public, AdminGuard } from '@azeebo/security';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

class CreateReviewBodyDto {
  @IsString()
  contentId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  containsSpoilers?: boolean;
}

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(RateLimitGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update a review' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Invalid rating' })
  async createReview(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateReviewBodyDto,
  ) {
    const review = await this.reviewService.createOrUpdateReview(req.user.id, dto);
    return { success: true, data: review };
  }

  @Public()
  @Get('content/:contentId')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get reviews for content' })
  @ApiResponse({ status: 200, description: 'Reviews list' })
  async getContentReviews(
    @Param('contentId') contentId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sortBy') sortBy: 'recent' | 'helpful' | 'rating' = 'recent',
  ) {
    const result = await this.reviewService.getReviews(contentId, page, limit, sortBy);
    return { success: true, data: result };
  }

  @Public()
  @Get('content/:contentId/summary')
  @RateLimit(60, 60000)
  @ApiOperation({ summary: 'Get rating summary for content' })
  @ApiResponse({ status: 200, description: 'Rating summary' })
  async getRatingSummary(@Param('contentId') contentId: string) {
    const summary = await this.reviewService.getRatingSummary(contentId);
    return { success: true, data: summary };
  }

  @Get('content/:contentId/mine')
  @ApiOperation({ summary: 'Get current user review for content' })
  @ApiResponse({ status: 200, description: 'User review' })
  async getUserReview(
    @Request() req: { user: { id: string } },
    @Param('contentId') contentId: string,
  ) {
    const review = await this.reviewService.getUserReview(req.user.id, contentId);
    return { success: true, data: review };
  }

  @Delete(':reviewId')
  @RateLimit(10, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete your review' })
  @ApiResponse({ status: 200, description: 'Review deleted' })
  async deleteReview(
    @Request() req: { user: { id: string } },
    @Param('reviewId') reviewId: string,
  ) {
    await this.reviewService.deleteReview(req.user.id, reviewId);
    return { success: true };
  }

  @Post(':reviewId/helpful')
  @RateLimit(30, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle helpful on a review' })
  @ApiResponse({ status: 200, description: 'Helpful toggled' })
  async toggleHelpful(
    @Request() req: { user: { id: string } },
    @Param('reviewId') reviewId: string,
  ) {
    const result = await this.reviewService.toggleHelpful(req.user.id, reviewId);
    return { success: true, data: result };
  }

  @Post(':reviewId/report')
  @RateLimit(5, 60000)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Report a review' })
  @ApiResponse({ status: 200, description: 'Review reported' })
  async reportReview(
    @Request() req: { user: { id: string } },
    @Param('reviewId') reviewId: string,
    @Body() body: { reason: string },
  ) {
    await this.reviewService.reportReview(req.user.id, reviewId, body.reason);
    return { success: true };
  }

  // Admin endpoints
  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Get pending reviews for moderation' })
  @ApiResponse({ status: 200, description: 'Pending reviews' })
  async getPendingReviews(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const result = await this.reviewService.getPendingReviews(page, limit);
    return { success: true, data: result };
  }

  @Patch('admin/:reviewId/moderate')
  @UseGuards(AdminGuard)
  @RateLimit(30, 60000)
  @ApiOperation({ summary: 'Moderate a review' })
  @ApiResponse({ status: 200, description: 'Review moderated' })
  async moderateReview(
    @Param('reviewId') reviewId: string,
    @Body() body: { status: 'published' | 'rejected' },
  ) {
    await this.reviewService.moderateReview(reviewId, body.status);
    return { success: true };
  }
}
