import { Inject, Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { ParticipationService } from './participation.service';

/**
 * Unified participation result — public read surface for the
 * /participation/result/[id] web page. Poll results are public aggregate
 * data; quiz attempt results expose only aggregate option stats plus the
 * anonymous points summary (no user identity).
 */
@ApiTags('Participation')
@Controller('participation')
export class ParticipationController {
  constructor(
    @Inject(ParticipationService) private readonly participationService: ParticipationService
  ) {}

  @Public()
  @Get(':id/result')
  @ApiOperation({ summary: 'Get poll or quiz attempt result' })
  @ApiResponse({ status: 200, description: 'Unified result payload' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async getResult(@Param('id') id: string): Promise<unknown> {
    return this.participationService.getResult(id);
  }
}
