import { Inject, Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import { FixturesService } from './fixtures.service.js';
import { RolesGuard, Roles } from '@azeebo/shared-services';
import { UpdateFixtureResultDto } from './dto/update-fixture-result.dto.js';

@ApiTags('Fixtures')
@ApiBearerAuth()
@Controller('sports/fixtures')
export class FixturesController {
  constructor(@Inject(FixturesService) private readonly fixturesService: FixturesService) {}

  @Get()
  @ApiOperation({ summary: 'Get fixtures' })
  async getFixtures(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sport') sport?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ): Promise<unknown> {
    return this.fixturesService.getFixtures(
      Number(page),
      Number(limit),
      sport,
      status,
      fromDate,
      toDate
    );
  }

  @Get('sports')
  @ApiOperation({ summary: 'Get available sports' })
  async getSports(): Promise<unknown> {
    return this.fixturesService.getSports();
  }

  @Get(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit(200, 60000)
  @ApiOperation({ summary: 'Get fixture details' })
  async getFixture(@Param('id') id: string): Promise<unknown> {
    return this.fixturesService.getFixtureById(id);
  }

  @Post(':id/metadata')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Create/update fixture metadata (admin)' })
  async createMetadata(
    @Param('id') eventId: string,
    @Body()
    body: {
      venue?: string;
      referee?: string;
      weather?: string;
      temperature?: number;
      attendance?: number;
      broadcast?: string[];
      stats?: unknown;
    }
  ): Promise<unknown> {
    return this.fixturesService.createFixtureMetadata(eventId, body);
  }

  @Post(':id/result')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: 'Update event result (admin)' })
  async updateResult(
    @Param('id') eventId: string,
    @Body() body: UpdateFixtureResultDto
  ): Promise<unknown> {
    return this.fixturesService.updateEventResult(eventId, body.teams);
  }
}
