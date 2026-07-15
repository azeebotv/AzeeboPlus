import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { FanContestsService } from './fan-contests.service.js';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { JoinContestDto, SubmitContestScoreDto } from './dto/contest.dto.js';

@ApiTags('Fan Contests')
@ApiBearerAuth()
@Controller('v1/sports/fan-contests')
export class FanContestsController {
  constructor(
    @Inject(FanContestsService) private readonly fanContestsService: FanContestsService
  ) {}

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
    @Body() body: JoinContestDto,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.fanContestsService.enterContest(req.user.id, contestId, body.entryData);
  }

  @Post(':id/score')
  @ApiOperation({ summary: 'Update entry score' })
  async updateScore(
    @Param('id') contestId: string,
    @Body() body: SubmitContestScoreDto,
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.fanContestsService.updateEntryScore(req.user.id, contestId, body.score);
  }

  @Get(':id/leaderboard')
  @UseGuards(RateLimitGuard)
  @RateLimit(100, 60000)
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'End contest (admin)' })
  async endContest(@Param('id') contestId: string): Promise<unknown> {
    return this.fanContestsService.endContest(contestId);
  }
}
