import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface CreateReviewDto {
  contentId: string;
  rating: number; // 1-5
  title?: string;
  body?: string;
  containsSpoilers?: boolean;
}

export interface Review {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  body?: string;
  containsSpoilers: boolean;
  helpfulCount: number;
  replyCount: number;
  status: 'published' | 'pending' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingSummary {
  contentId: string;
  averageRating: number;
  totalRatings: number;
  distribution: { stars: number; count: number; percentage: number }[];
}

export interface ReviewList {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  ratingSummary: RatingSummary;
}

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update a review
   */
  async createOrUpdateReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Validate rating
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Check if content exists
    const content = await this.prisma.contentItem.findUnique({
      where: { id: dto.contentId },
    });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check for existing review
    const existing = await this.prisma.review.findFirst({
      where: { contentId: dto.contentId, userId },
    });

    let review;
    if (existing) {
      // Update existing review
      review = await this.prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          containsSpoilers: dto.containsSpoilers || false,
        },
      });
    } else {
      // Create new review
      review = await this.prisma.review.create({
        data: {
          contentId: dto.contentId,
          userId,
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          containsSpoilers: dto.containsSpoilers || false,
          status: 'published',
        },
      });
    }

    // Update content average rating
    await this.updateContentRating(dto.contentId);

    this.logger.log(`Review created/updated by ${userId} for ${dto.contentId}`);

    return this.formatReview(review);
  }

  /**
   * Get reviews for content
   */
  async getReviews(
    contentId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'recent' | 'helpful' | 'rating' = 'recent',
  ): Promise<ReviewList> {
    const skip = (page - 1) * limit;

    const orderBy = sortBy === 'helpful'
      ? { helpfulCount: 'desc' as const }
      : sortBy === 'rating'
        ? { rating: 'desc' as const }
        : { createdAt: 'desc' as const };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { contentId, status: 'published' },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { contentId, status: 'published' },
      }),
    ]);

    const ratingSummary = await this.getRatingSummary(contentId);

    return {
      reviews: reviews.map((r) => this.formatReview(r)),
      total,
      page,
      limit,
      ratingSummary,
    };
  }

  /**
   * Get rating summary for content
   */
  async getRatingSummary(contentId: string): Promise<RatingSummary> {
    const reviews = await this.prisma.review.findMany({
      where: { contentId, status: 'published' },
      select: { rating: true },
    });

    const totalRatings = reviews.length;
    const averageRating = totalRatings > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      return {
        stars,
        count,
        percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
      };
    });

    return {
      contentId,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      distribution,
    };
  }

  /**
   * Delete a review
   */
  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.updateContentRating(review.contentId);

    this.logger.log(`Review deleted: ${reviewId} by ${userId}`);
  }

  /**
   * Mark review as helpful
   */
  async toggleHelpful(userId: string, reviewId: string): Promise<{ helpful: boolean; count: number }> {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    const existing = await this.prisma.reviewHelpful.findFirst({
      where: { reviewId, userId },
    });

    if (existing) {
      await this.prisma.reviewHelpful.delete({ where: { id: existing.id } });
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
      });
      return { helpful: false, count: review.helpfulCount - 1 };
    } else {
      await this.prisma.reviewHelpful.create({
        data: { reviewId, userId },
      });
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      });
      return { helpful: true, count: review.helpfulCount + 1 };
    }
  }

  /**
   * Report a review
   */
  async reportReview(userId: string, reviewId: string, reason: string): Promise<void> {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.reviewReport.create({
      data: { reviewId, userId, reason },
    });

    this.logger.log(`Review reported: ${reviewId} by ${userId} reason: ${reason}`);
  }

  /**
   * Get user's review for content
   */
  async getUserReview(userId: string, contentId: string): Promise<Review | null> {
    const review = await this.prisma.review.findFirst({
      where: { contentId, userId },
    });

    return review ? this.formatReview(review) : null;
  }

  /**
   * Admin: Get pending reviews for moderation
   */
  async getPendingReviews(page: number = 1, limit: number = 50): Promise<{ reviews: Review[]; total: number }> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { status: 'pending' } }),
    ]);

    return {
      reviews: reviews.map((r) => this.formatReview(r)),
      total,
    };
  }

  /**
   * Admin: Moderate a review
   */
  async moderateReview(reviewId: string, status: 'published' | 'rejected'): Promise<void> {
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (review) {
      await this.updateContentRating(review.contentId);
    }

    this.logger.log(`Review ${reviewId} moderated: ${status}`);
  }

  /**
   * Update content's average rating
   */
  private async updateContentRating(contentId: string): Promise<void> {
    const result = await this.prisma.review.aggregate({
      where: { contentId, status: 'published' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        metadata: {
          averageRating: result._avg.rating || 0,
          totalRatings: result._count.rating || 0,
        },
      },
    });
  }

  /**
   * Format review for API response
   */
  private formatReview(review: {
    id: string;
    contentId: string;
    userId: string;
    rating: number;
    title?: string | null;
    body?: string | null;
    containsSpoilers: boolean;
    helpfulCount: number;
    replyCount?: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Review {
    return {
      id: review.id,
      contentId: review.contentId,
      userId: review.userId,
      userName: 'User', // Would be enriched from user-service
      rating: review.rating,
      title: review.title || undefined,
      body: review.body || undefined,
      containsSpoilers: review.containsSpoilers,
      helpfulCount: review.helpfulCount,
      replyCount: review.replyCount || 0,
      status: review.status as Review['status'],
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
