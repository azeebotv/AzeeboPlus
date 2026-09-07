import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ModelCostTrackerService, RecordCostDto } from './model-cost-tracker.service';

@ApiTags('Model Cost Tracker')
@Controller('cost')
export class ModelCostTrackerController {
  constructor(private readonly costService: ModelCostTrackerService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a model cost event' })
  @ApiResponse({ status: 201, description: 'Cost event recorded' })
  recordEvent(@Body() dto: RecordCostDto) {
    return this.costService.recordEvent(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get cost summary for a date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'model', required: false })
  getSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('agentId') agentId?: string,
    @Query('domain') domain?: string,
    @Query('model') model?: string
  ) {
    return this.costService.getCostSummary(new Date(startDate), new Date(endDate), {
      agentId,
      domain,
      model,
    });
  }

  @Get('events')
  @ApiOperation({ summary: 'Get recent cost events' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  getEvents(@Query('limit') limit?: string, @Query('agentId') agentId?: string) {
    return this.costService.getRecentEvents(limit ? parseInt(limit) : 50, agentId);
  }

  @Get('budget/:agentId')
  @ApiOperation({ summary: 'Check agent budget status' })
  checkBudget(@Param('agentId') agentId: string) {
    return this.costService.checkBudget(agentId);
  }
}
