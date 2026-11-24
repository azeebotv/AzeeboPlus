import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TaskRouterService } from './task-router.service';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  RouteTaskDto,
  RecordExecutionDto,
  AutoClassifyDto,
  SeedClassificationsDto,
  WorkClass,
  WORK_CLASSES,
} from './dto/task-router.dto';

@ApiTags('Task Router')
@Controller('tasks')
export class TaskRouterController {
  constructor(private readonly routerService: TaskRouterService) {}

  // ── CRUD ─────────────────────────────────────────────────

  @Post('classifications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task classification (H0-H1-A1-A2-S-X)' })
  @ApiResponse({ status: 201, description: 'Classification created' })
  @ApiResponse({ status: 409, description: 'Task type already exists' })
  createClassification(@Body() dto: CreateClassificationDto) {
    return this.routerService.createClassification(dto);
  }

  @Get('classifications')
  @ApiOperation({ summary: 'List all task classifications with filters' })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'workClass', required: false, enum: [...WORK_CLASSES] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'automationCandidate', required: false })
  @ApiQuery({ name: 'eliminationCandidate', required: false })
  findAll(
    @Query('domain') domain?: string,
    @Query('workClass') workClass?: WorkClass,
    @Query('search') search?: string,
    @Query('automationCandidate') automationCandidate?: string,
    @Query('eliminationCandidate') eliminationCandidate?: string
  ) {
    return this.routerService.findAll({
      domain,
      workClass,
      search,
      automationCandidate:
        automationCandidate === 'true' ? true : automationCandidate === 'false' ? false : undefined,
      eliminationCandidate:
        eliminationCandidate === 'true'
          ? true
          : eliminationCandidate === 'false'
            ? false
            : undefined,
    });
  }

  @Get('classifications/stats')
  @ApiOperation({ summary: 'Get classification statistics (counts, volumes, costs)' })
  getStats() {
    return this.routerService.getStats();
  }

  @Get('classifications/:taskType')
  @ApiOperation({ summary: 'Get classification details with recent executions' })
  findOne(@Param('taskType') taskType: string) {
    return this.routerService.findOne(taskType);
  }

  @Put('classifications/:taskType')
  @ApiOperation({ summary: 'Update a task classification' })
  update(@Param('taskType') taskType: string, @Body() dto: UpdateClassificationDto) {
    return this.routerService.update(taskType, dto);
  }

  @Delete('classifications/:taskType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task classification' })
  delete(@Param('taskType') taskType: string) {
    return this.routerService.delete(taskType);
  }

  // ── Routing ───────────────────────────────────────────────

  @Post('route/:taskType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Route a task to the cheapest reliable execution tier' })
  @ApiResponse({ status: 200, description: 'Routing decision returned' })
  routeTask(@Param('taskType') taskType: string, @Body() dto: RouteTaskDto) {
    return this.routerService.routeTask(taskType, dto);
  }

  @Post('route/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Route multiple tasks in batch' })
  routeBatch(
    @Body()
    body: {
      tasks: { taskType: string; correlationId?: string; overrideWorkClass?: WorkClass }[];
    }
  ) {
    return this.routerService.routeBatch(body.tasks);
  }

  // ── Auto-Classification ───────────────────────────────────

  @Post('auto-classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-classify a task based on description keywords' })
  autoClassify(@Body() dto: AutoClassifyDto) {
    return this.routerService.autoClassify(dto);
  }

  // ── Execution Tracking ────────────────────────────────────

  @Post('executions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a task execution result' })
  recordExecution(@Body() dto: RecordExecutionDto) {
    return this.routerService.recordExecution(dto);
  }

  @Get('executions/history/:taskType')
  @ApiOperation({ summary: 'Get execution history for a task type' })
  @ApiQuery({ name: 'limit', required: false })
  getExecutionHistory(@Param('taskType') taskType: string, @Query('limit') limit?: string) {
    return this.routerService.getExecutionHistory(taskType, limit ? parseInt(limit) : 20);
  }

  @Get('executions/stats')
  @ApiOperation({ summary: 'Get execution statistics (cost, duration, success rate, escalations)' })
  @ApiQuery({ name: 'taskType', required: false })
  getExecutionStats(@Query('taskType') taskType?: string) {
    return this.routerService.getExecutionStats(taskType);
  }

  // ── Process Mining ────────────────────────────────────────

  @Get('process-mining')
  @ApiOperation({ summary: 'Get process mining overview (P0-P7 step distribution)' })
  getProcessMining() {
    return this.routerService.getProcessMiningOverview();
  }

  // ── Seed ──────────────────────────────────────────────────

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed common Azeebo+ task classifications (19 task types)' })
  seedClassifications(@Body() dto: SeedClassificationsDto) {
    return this.routerService.seedClassifications(dto);
  }
}
