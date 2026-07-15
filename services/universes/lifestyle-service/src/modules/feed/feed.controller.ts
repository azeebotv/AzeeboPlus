import { Inject, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { LifestyleFeedService } from './feed.service';

@ApiTags('Feed')
@Controller('v1/lifestyle/feed')
export class FeedController {
  constructor(@Inject(LifestyleFeedService) private readonly feedService: LifestyleFeedService) {}

  @Get()
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get lifestyle feed' })
  @ApiResponse({ status: 200, description: 'Feed items' })
  async getFeed(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string
  ): Promise<unknown> {
    return this.feedService.getFeed(Number(page), Number(limit), category);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending content' })
  @ApiResponse({ status: 200, description: 'Trending items' })
  async getTrending(@Query('limit') limit = 10): Promise<unknown> {
    return this.feedService.getTrending(Number(limit));
  }
}
