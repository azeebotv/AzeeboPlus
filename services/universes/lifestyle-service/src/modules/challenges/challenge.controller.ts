import { Inject,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
 } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import {
  ChallengeService,
  CreateChallengeInput,
  ChallengeSubmissionInput,
} from './challenge.service';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengeController {
  constructor(@Inject(ChallengeService) private readonly challengeService: ChallengeService) {}

  @Get()
  @ApiOperation({ summary: 'List challenges' })
  @ApiResponse({ status: 200, description: 'List of challenges' })
  async getChallenges(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string
  ) {
    return this.challengeService.getChallenges(
      Number(page) || 1,
      Number(limit) || 20,
      type,
      status
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get challenge details' })
  @ApiResponse({ status: 200, description: 'Challenge details' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async getChallenge(@Param('id') id: string) {
    return this.challengeService.getChallenge(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createChallenge(
    @Request() req: { user: { id: string } },
    @Body() data: CreateChallengeInput
  ) {
    return this.challengeService.createChallenge(req.user.id, data);
  }

  @Post(':id/submit')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit to a challenge' })
  @ApiResponse({ status: 201, description: 'Submission created' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitToChallenge(
    @Request() req: { user: { id: string } },
    @Param('id') challengeId: string,
    @Body() data: ChallengeSubmissionInput
  ) {
    return this.challengeService.submitToChallenge(challengeId, req.user.id, data);
  }

  @Post('submissions/:id/vote')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote for a submission' })
  @ApiResponse({ status: 200, description: 'Vote recorded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async voteSubmission(
    @Request() req: { user: { id: string } },
    @Param('id') submissionId: string
  ) {
    return this.challengeService.voteSubmission(submissionId, req.user.id);
  }
}
