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
import { AgentRegistryService } from './agent-registry.service';
import {
  CreateAgentDto,
  UpdateAgentDto,
  KillSwitchDto,
  RecordEvaluationDto,
  SeedAgentsDto,
  AgentCategory,
  AgentStatus,
} from './dto/agent-registry.dto';

@ApiTags('Agent Registry')
@Controller('agents')
export class AgentRegistryController {
  constructor(private readonly registryService: AgentRegistryService) {}

  // ── CRUD ─────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new agent in the registry' })
  @ApiResponse({ status: 201, description: 'Agent registered successfully' })
  @ApiResponse({ status: 409, description: 'Agent ID already exists' })
  create(@Body() dto: CreateAgentDto) {
    return this.registryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered agents with optional filters' })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['control-plane', 'shared-enterprise', 'domain-skill-pack'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'suspended', 'retired', 'degraded'],
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, ID, or purpose' })
  findAll(
    @Query('category') category?: AgentCategory,
    @Query('status') status?: AgentStatus,
    @Query('search') search?: string
  ) {
    return this.registryService.findAll({ category, status, search });
  }

  @Get(':agentId')
  @ApiOperation({ summary: 'Get agent details with recent evaluations' })
  @ApiResponse({ status: 200, description: 'Agent found' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  findOne(@Param('agentId') agentId: string) {
    return this.registryService.findOne(agentId);
  }

  @Put(':agentId')
  @ApiOperation({ summary: 'Update agent configuration' })
  update(@Param('agentId') agentId: string, @Body() dto: UpdateAgentDto) {
    return this.registryService.update(agentId, dto);
  }

  @Delete(':agentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a non-active agent from the registry' })
  delete(@Param('agentId') agentId: string) {
    return this.registryService.delete(agentId);
  }

  // ── Kill Switch ───────────────────────────────────────────

  @Post(':agentId/kill-switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate kill switch — immediately suspend an agent' })
  @ApiResponse({ status: 200, description: 'Kill switch activated' })
  activateKillSwitch(@Param('agentId') agentId: string, @Body() dto: KillSwitchDto) {
    return this.registryService.activateKillSwitch(agentId, dto);
  }

  @Post(':agentId/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a suspended agent' })
  @ApiResponse({ status: 200, description: 'Agent resumed' })
  resume(@Param('agentId') agentId: string, @Body() dto: KillSwitchDto) {
    return this.registryService.resumeAgent(agentId, dto);
  }

  @Post(':agentId/retire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retire an agent permanently' })
  retire(@Param('agentId') agentId: string, @Body() body: { reason: string; triggeredBy: string }) {
    return this.registryService.retire(agentId, body.reason, body.triggeredBy);
  }

  @Get(':agentId/kill-switch-history')
  @ApiOperation({ summary: 'Get kill switch activation history for an agent' })
  @ApiQuery({ name: 'limit', required: false })
  getKillSwitchHistory(@Param('agentId') agentId: string, @Query('limit') limit?: string) {
    return this.registryService.getKillSwitchHistory(agentId, limit ? parseInt(limit) : 20);
  }

  // ── Health Monitoring ─────────────────────────────────────

  @Post(':agentId/execution')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record an execution result (success/failure)' })
  recordExecution(@Param('agentId') agentId: string, @Body() body: { success: boolean }) {
    return this.registryService.recordExecution(agentId, body.success);
  }

  @Get(':agentId/health')
  @ApiOperation({ summary: 'Check agent health status' })
  checkHealth(@Param('agentId') agentId: string) {
    return this.registryService.checkHealth(agentId);
  }

  @Get('health/overview')
  @ApiOperation({ summary: 'Get health overview of all agents' })
  getHealthOverview() {
    return this.registryService.getHealthOverview();
  }

  // ── Evaluation Suite ──────────────────────────────────────

  @Post(':agentId/evaluations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record an evaluation result for an agent' })
  recordEvaluation(@Param('agentId') agentId: string, @Body() dto: RecordEvaluationDto) {
    return this.registryService.recordEvaluation(agentId, dto);
  }

  @Get(':agentId/evaluations')
  @ApiOperation({ summary: 'Get evaluation history for an agent' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['golden', 'regression', 'security', 'authority', 'performance'],
  })
  @ApiQuery({ name: 'limit', required: false })
  getEvaluations(
    @Param('agentId') agentId: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string
  ) {
    return this.registryService.getEvaluations(agentId, type, limit ? parseInt(limit) : 20);
  }

  @Get(':agentId/evaluations/summary')
  @ApiOperation({ summary: 'Get evaluation summary by type' })
  getEvaluationSummary(@Param('agentId') agentId: string) {
    return this.registryService.getEvaluationSummary(agentId);
  }

  // ── Seed ──────────────────────────────────────────────────

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed the registry with AOS-MA-001 defined agents (18 agents)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'force', required: false })
  seedAgents(@Body() dto: SeedAgentsDto) {
    return this.registryService.seedAgents(dto);
  }

  // ── Stats ─────────────────────────────────────────────────

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get registry statistics (counts by category, status, risk, autonomy)' })
  getStats() {
    return this.registryService.getStats();
  }
}
