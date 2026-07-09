import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ComedyFeedService } from './comedy-feed.service';

@ApiTags('Comedy Feed')
@Controller('v1/comedy')
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Like/unlike special' })
  @ApiResponse({ status: 200, description: 'Result' })
  async likeSpecial(
    @Param('id') id: string,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.comedyFeedService.likeSpecial(req.user.id, id);
  }

  @Get('clips/:id')
  @ApiOperation({ summary: 'Get clip details' })
  @ApiResponse({ status: 200, description: 'Clip details' })
  async getClip(@Param('id') id: string, @Query('userId') userId?: string): Promise<unknown> {
    return this.comedyFeedService.getClipById(id, userId);
  }

  @Post('clips/:id/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Like/unlike clip' })
  @ApiResponse({ status: 200, description: 'Result' })
  async likeClip(
    @Param('id') id: string,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.comedyFeedService.likeClip(req.user.id, id);
  }

  @Post('clips/:id/comment')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Comment on clip' })
  @ApiResponse({ status: 200, description: 'Comment added' })
  async comment(
    @Param('id') id: string,
    @Body() body: { text: string },
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.comedyFeedService.commentOnClip(req.user.id, id, body.text);
  }

  @Post('trends/record')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Record trends (admin)' })
  @ApiResponse({ status: 200, description: 'Recorded' })
  async recordTrends(@Body() body: { period?: string }): Promise<unknown> {
    return this.comedyFeedService.recordTrend(body.period || 'daily');
  }
}
