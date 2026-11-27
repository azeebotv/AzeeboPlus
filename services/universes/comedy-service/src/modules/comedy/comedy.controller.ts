import { Inject, Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit, Public } from '@azeebo/security';
import { FeatureFlag, FeatureFlagGuard, comedyFlags } from '@azeebo/feature-flags';

import { ComedyService } from './comedy.service.js';
import { ComedyResponse } from './interfaces/comedy-response.interface.js';
import { SubmitChallengeDto } from './dto/submit-challenge.dto.js';

@ApiTags('Comedy')
@Controller('comedy')
export class ComedyController {
  constructor(@Inject(ComedyService) private readonly comedyService: ComedyService) {}

  @Public()
  @Get('clips')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Comedy clips feed' })
  @ApiResponse({ status: 200, description: 'Clips feed' })
  async getClips(): Promise<ComedyResponse> {
    return this.comedyService.getClips();
  }

  @Public()
  @Get('comedians')
  @ApiOperation({ summary: 'Comedian profiles' })
  @ApiResponse({ status: 200, description: 'Comedians' })
  async getComedians(): Promise<ComedyResponse> {
    return this.comedyService.getComedians();
  }

  @Public()
  @Get('comedians/:id')
  @ApiOperation({ summary: 'Comedian profile details' })
  @ApiResponse({ status: 200, description: 'Comedian profile' })
  @ApiResponse({ status: 404, description: 'Comedian not found' })
  async getComedian(@Param('id') id: string): Promise<ComedyResponse> {
    return this.comedyService.getComedian(id);
  }

  @Public()
  @Get('series')
  @ApiOperation({ summary: 'Comedy series' })
  @ApiResponse({ status: 200, description: 'Series' })
  async getSeries(): Promise<ComedyResponse> {
    return this.comedyService.getSeries();
  }

  @Post('challenges')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(comedyFlags.challengesEnabled)
  @ApiOperation({ summary: 'Submit comedy challenge entry' })
  @ApiResponse({ status: 201, description: 'Entry submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitChallenge(
    @Request() req: { user: { id: string } },
    @Body() body: SubmitChallengeDto
  ): Promise<ComedyResponse> {
    return this.comedyService.submitChallenge(req.user.id, body);
  }

  @Public()
  @Get('challenges')
  @UseGuards(FeatureFlagGuard)
  @FeatureFlag(comedyFlags.challengesEnabled)
  @ApiOperation({ summary: 'Active comedy challenges' })
  @ApiResponse({ status: 200, description: 'Challenges' })
  async getChallenges(): Promise<ComedyResponse> {
    return this.comedyService.getChallenges();
  }

  @Post('clips/:clipId/share')
  @ApiOperation({ summary: 'Share clip' })
  @ApiResponse({ status: 200, description: 'Clip shared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async shareClip(
    @Request() req: { user: { id: string } },
    @Param('clipId') clipId: string
  ): Promise<ComedyResponse> {
    return this.comedyService.shareClip(req.user.id, clipId);
  }

  @Public()
  @Get('trending')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Trending comedy clips' })
  @ApiResponse({ status: 200, description: 'Trending clips' })
  async getTrending(): Promise<ComedyResponse> {
    return this.comedyService.getTrending();
  }
}
