import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';

import { ComedyService } from './comedy.service';
import { ComedyResponse } from './interfaces/comedy-response.interface';
import { SubmitChallengeDto } from './dto/submit-challenge.dto';

@ApiTags('Comedy')
@Controller('v1/comedy')
export class ComedyController {
  constructor(private readonly comedyService: ComedyService) {}

  @Get('clips')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Comedy clips feed' })
  @ApiResponse({ status: 200, description: 'Clips feed' })
  async getClips(): Promise<ComedyResponse> {
    return this.comedyService.getClips();
  }

  @Get('comedians')
  @ApiOperation({ summary: 'Comedian profiles' })
  @ApiResponse({ status: 200, description: 'Comedians' })
  async getComedians(): Promise<ComedyResponse> {
    return this.comedyService.getComedians();
  }

  @Get('series')
  @ApiOperation({ summary: 'Comedy series' })
  @ApiResponse({ status: 200, description: 'Series' })
  async getSeries(): Promise<ComedyResponse> {
    return this.comedyService.getSeries();
  }

  @Post('challenges')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit comedy challenge entry' })
  @ApiResponse({ status: 201, description: 'Entry submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitChallenge(
    @Request() req: { user: { sub: string } },
    @Body() body: SubmitChallengeDto
  ): Promise<ComedyResponse> {
    return this.comedyService.submitChallenge(req.user.sub, body);
  }

  @Get('challenges')
  @ApiOperation({ summary: 'Active comedy challenges' })
  @ApiResponse({ status: 200, description: 'Challenges' })
  async getChallenges(): Promise<ComedyResponse> {
    return this.comedyService.getChallenges();
  }

  @Post('clips/:clipId/share')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Share clip' })
  @ApiResponse({ status: 200, description: 'Clip shared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async shareClip(
    @Request() req: { user: { sub: string } },
    @Param('clipId') clipId: string
  ): Promise<ComedyResponse> {
    return this.comedyService.shareClip(req.user.sub, clipId);
  }

  @Get('trending')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Trending comedy clips' })
  @ApiResponse({ status: 200, description: 'Trending clips' })
  async getTrending(): Promise<ComedyResponse> {
    return this.comedyService.getTrending();
  }
}
