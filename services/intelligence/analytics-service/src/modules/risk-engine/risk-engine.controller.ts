import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RiskEngineService } from './risk-engine.service';
import {
  CreateClassificationDto,
  UpdateClassificationDto,
  AssessActionDto,
  RequestApprovalDto,
  DecideApprovalDto,
  RevokeApprovalDto,
  BatchAssessDto,
  SeedRiskClassificationsDto,
  RISK_LEVELS,
  AUTONOMY_LEVELS,
  DECISIONS,
  RISK_DEFINITIONS,
  AUTONOMY_DEFINITIONS,
} from './dto/risk-engine.dto';

@ApiTags('Risk Engine')
@Controller('risk')
export class RiskEngineController {
  constructor(private readonly riskService: RiskEngineService) {}

  // ── Classification CRUD ───────────────────────────────────

  @Post('classifications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create risk classification for an action type' })
  createClassification(@Body() dto: CreateClassificationDto) {
    return this.riskService.createClassification(dto);
  }

  @Get('classifications')
  @ApiOperation({ summary: 'List all risk classifications' })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'riskLevel', required: false, enum: [...RISK_LEVELS] })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('domain') domain?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('search') search?: string,
  ) {
    return this.riskService.findAll({ domain, riskLevel, search });
  }

  @Get('classifications/:actionType')
  @ApiOperation({ summary: 'Get classification with recent assessments and pending approvals' })
  findOne(@Param('actionType') actionType: string) {
    return this.riskService.findOne(actionType);
  }

  @Put('classifications/:actionType')
  @ApiOperation({ summary: 'Update risk classification' })
  update(@Param('actionType') actionType: string, @Body() dto: UpdateClassificationDto) {
    return this.riskService.update(actionType, dto);
  }

  @Delete('classifications/:actionType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete risk classification' })
  delete(@Param('actionType') actionType: string) {
    return this.riskService.delete(actionType);
  }

  // ── Assessment ────────────────────────────────────────────

  @Post('assess/:actionType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assess risk and return ALLOW/ASK/DENY decision' })
  assess(@Param('actionType') actionType: string, @Body() dto: AssessActionDto) {
    return this.riskService.assessAction(actionType, dto);
  }

  @Post('assess/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch-assess multiple actions' })
  batchAssess(@Body() dto: BatchAssessDto) {
    return this.riskService.batchAssess(dto);
  }

  // ── Approval Workflow ─────────────────────────────────────

  @Post('approvals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request approval for an action' })
  requestApproval(@Body() dto: RequestApprovalDto) {
    return this.riskService.requestApproval(dto);
  }

  @Get('approvals/pending')
  @ApiOperation({ summary: 'Get all pending approval requests' })
  @ApiQuery({ name: 'domain', required: false })
  getPendingApprovals(@Query('domain') domain?: string) {
    return this.riskService.getPendingApprovals(domain);
  }

  @Get('approvals/history/:actionType')
  @ApiOperation({ summary: 'Get approval history for an action type' })
  @ApiQuery({ name: 'limit', required: false })
  getApprovalHistory(@Param('actionType') actionType: string, @Query('limit') limit?: string) {
    return this.riskService.getApprovalHistory(actionType, limit ? parseInt(limit) : 20);
  }

  @Post('approvals/:approvalId/decide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a pending approval request' })
  decideApproval(@Param('approvalId') approvalId: string, @Body() dto: DecideApprovalDto) {
    return this.riskService.decideApproval(approvalId, dto);
  }

  @Post('approvals/:approvalId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a previously approved request' })
  revokeApproval(@Param('approvalId') approvalId: string, @Body() dto: RevokeApprovalDto) {
    return this.riskService.revokeApproval(approvalId, dto);
  }

  // ── Audit Trail ───────────────────────────────────────────

  @Get('audit-log')
  @ApiOperation({ summary: 'Get risk assessment audit trail' })
  @ApiQuery({ name: 'actionType', required: false })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'decision', required: false, enum: [...DECISIONS] })
  @ApiQuery({ name: 'limit', required: false })
  getAuditLog(
    @Query('actionType') actionType?: string,
    @Query('domain') domain?: string,
    @Query('decision') decision?: string,
    @Query('limit') limit?: string,
  ) {
    return this.riskService.getAssessmentLog({
      actionType,
      domain,
      decision,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  // ── Stats ─────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get risk engine statistics' })
  getStats() {
    return this.riskService.getStats();
  }

  // ── Seed ──────────────────────────────────────────────────

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed common Azeebo+ risk classifications (24 action types)' })
  seedClassifications(@Body() dto: SeedRiskClassificationsDto) {
    return this.riskService.seedClassifications(dto);
  }

  // ── Reference Data ────────────────────────────────────────

  @Get('definitions/risk-levels')
  @ApiOperation({ summary: 'Get risk level definitions (R0-R4)' })
  getRiskLevelDefinitions() {
    return RISK_LEVELS.map((level) => ({
      level,
      ...RISK_DEFINITIONS[level],
    }));
  }

  @Get('definitions/autonomy-levels')
  @ApiOperation({ summary: 'Get autonomy level definitions (A0-A5)' })
  getAutonomyLevelDefinitions() {
    return AUTONOMY_LEVELS.map((level) => ({
      level,
      ...AUTONOMY_DEFINITIONS[level],
    }));
  }
}
