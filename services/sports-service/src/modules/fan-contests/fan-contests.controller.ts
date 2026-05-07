import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FanContestsService } from './fan-contests.service';

@ApiTags('Fan Contests')
@Controller('contests')
export class FanContestsController {
  constructor(private readonly fanContestsService: FanContestsService) {}

  @Get()
  @ApiOperation({ summary: 'Get contests' })
  async getContests(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('eventId') eventId?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.fanContestsService.getContests(Number(page), Number(limit), eventId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contest details' })
  async getContest(@Param('id') id: string): Promise<unknown> {
    return this.fanContestsService.getContestById(id);
  }

  @Post(':id/enter')
  @ApiOperation({ summary: 'Enter contest' })
  async enterContest(
    @Param('id') contestId: string,
    @Body() body: { userId: string; entryData: Record<string, unknown> }
  ): Promise<unknown> {
    return this.fanContestsService.enterContest(body.userId, contestId, body.entryData);
  }

  @Post(':id/score')
  @ApiOperation({ summary: 'Update entry score' })
  async updateScore(
    @Param('id') contestId: string,
    @Body() body: { userId: string; score: number }
  ): Promise<unknown> {
    return this.fanContestsService.updateEntryScore(body.userId, contestId, body.score);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get contest leaderboard' })
  async getLeaderboard(
    @Param('id') contestId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50
  ): Promise<unknown> {
    return this.fanContestsService.getLeaderboard(contestId, Number(page), Number(limit));
  }

  @Get(':id/rank/:userId')
  @ApiOperation({ summary: 'Get user rank' })
  async getUserRank(
    @Param('id') contestId: string,
    @Param('userId') userId: string
  ): Promise<unknown> {
    return this.fanContestsService.getUserRank(userId, contestId);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End contest (admin)' })
  async endContest(@Param('id') contestId: string): Promise<unknown> {
    return this.fanContestsService.endContest(contestId);
  }
}
