import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ComedyFeedService } from './comedy-feed.service';

@ApiTags('Comedy Feed')
@Controller('feed')
export class ComedyFeedController {
  constructor(private readonly comedyFeedService: ComedyFeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get comedy feed' })
  @ApiResponse({ status: 200, description: 'Feed items' })
  async getFeed(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string
  ): Promise<unknown> {
    return this.comedyFeedService.getFeed(Number(page), Number(limit), type);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending clips' })
  @ApiResponse({ status: 200, description: 'Trending list' })
  async getTrending(
    @Query('period') period = 'daily',
    @Query('limit') limit = 20
  ): Promise<unknown> {
    return this.comedyFeedService.getTrending(period, Number(limit));
  }

  @Get('specials')
  @ApiOperation({ summary: 'Get premium specials' })
  @ApiResponse({ status: 200, description: 'Specials list' })
  async getSpecials(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('comedianId') comedianId?: string
  ): Promise<unknown> {
    return this.comedyFeedService.getSpecials(Number(page), Number(limit), comedianId);
  }

  @Get('specials/:id')
  @ApiOperation({ summary: 'Get special by id' })
  @ApiResponse({ status: 200, description: 'Special details' })
  async getSpecial(@Param('id') id: string): Promise<unknown> {
    return this.comedyFeedService.getSpecialById(id);
  }

  @Post('specials/:id/like')
  @ApiOperation({ summary: 'Like/unlike special' })
  @ApiResponse({ status: 200, description: 'Result' })
  async likeSpecial(@Param('id') id: string, @Body() body: { userId: string }): Promise<unknown> {
    return this.comedyFeedService.likeSpecial(body.userId, id);
  }

  @Get('clips/:id')
  @ApiOperation({ summary: 'Get clip details' })
  @ApiResponse({ status: 200, description: 'Clip details' })
  async getClip(@Param('id') id: string, @Query('userId') userId?: string): Promise<unknown> {
    return this.comedyFeedService.getClipById(id, userId);
  }

  @Post('clips/:id/like')
  @ApiOperation({ summary: 'Like/unlike clip' })
  @ApiResponse({ status: 200, description: 'Result' })
  async likeClip(@Param('id') id: string, @Body() body: { userId: string }): Promise<unknown> {
    return this.comedyFeedService.likeClip(body.userId, id);
  }

  @Post('clips/:id/comment')
  @ApiOperation({ summary: 'Comment on clip' })
  @ApiResponse({ status: 200, description: 'Comment added' })
  async comment(
    @Param('id') id: string,
    @Body() body: { userId: string; text: string }
  ): Promise<unknown> {
    return this.comedyFeedService.commentOnClip(body.userId, id, body.text);
  }

  @Post('trends/record')
  @ApiOperation({ summary: 'Record trends (admin)' })
  @ApiResponse({ status: 200, description: 'Recorded' })
  async recordTrends(@Body() body: { period?: string }): Promise<unknown> {
    return this.comedyFeedService.recordTrend(body.period || 'daily');
  }
}
