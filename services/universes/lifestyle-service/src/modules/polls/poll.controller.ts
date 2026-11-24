import {
  Inject,
  Controller,
  Get,
  Post,
  Request,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeatureFlag, FeatureFlagGuard, lifestyleFlags } from '@azeebo/feature-flags';
import { Public, ServiceAuthGuard } from '@azeebo/security';
import { ensureUser } from '../../common/user-provisioning';
import { PrismaService } from '../database/prisma.service';

import { PollService } from './poll.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';

@ApiTags('Polls')
@UseGuards(ServiceAuthGuard)
@FeatureFlag(lifestyleFlags.pollsEnabled)
@UseGuards(FeatureFlagGuard)
@Controller('polls')
export class PollController {
  constructor(
    @Inject(PollService) private readonly pollService: PollService,
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List polls' })
  @ApiResponse({ status: 200, description: 'List of polls' })
  async getPolls(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string
  ) {
    return this.pollService.getPolls(Number(page) || 1, Number(limit) || 20, status);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get poll details' })
  @ApiResponse({ status: 200, description: 'Poll details' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getPoll(@Param('id') id: string) {
    return this.pollService.getPoll(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a poll' })
  @ApiResponse({ status: 201, description: 'Poll created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPoll(@Request() req: { user: { id: string } }, @Body() data: CreatePollDto) {
    await ensureUser(this.prisma, req.user);
    return this.pollService.createPoll(req.user.id, data);
  }

  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote in a poll' })
  @ApiResponse({ status: 200, description: 'Vote recorded' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async votePoll(
    @Request() req: { user: { id: string } },
    @Param('id') pollId: string,
    @Body() body: VotePollDto
  ) {
    await ensureUser(this.prisma, req.user);
    return this.pollService.votePoll(pollId, req.user.id, body.optionId);
  }
}
