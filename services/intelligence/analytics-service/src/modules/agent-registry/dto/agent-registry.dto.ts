import { IsString, IsOptional, IsArray, IsNumber, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Valid Enums ──────────────────────────────────────────────

export const AGENT_CATEGORIES = ['control-plane', 'shared-enterprise', 'domain-skill-pack'] as const;
export const AGENT_STATUSES = ['active', 'suspended', 'retired', 'degraded'] as const;
export const EXECUTION_TIERS = ['T0', 'T1', 'T2', 'T3', 'T4'] as const;
export const RISK_LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4'] as const;
export const AUTONOMY_LEVELS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] as const;
export const KILL_SWITCH_LEVELS = ['K0', 'K1', 'K2', 'K3', 'K4'] as const;
export const HEALTH_STATUSES = ['healthy', 'degraded', 'unhealthy', 'unknown'] as const;
export const EVALUATION_TYPES = ['golden', 'regression', 'security', 'authority', 'performance'] as const;

export type AgentCategory = typeof AGENT_CATEGORIES[number];
export type AgentStatus = typeof AGENT_STATUSES[number];
export type ExecutionTier = typeof EXECUTION_TIERS[number];
export type RiskLevel = typeof RISK_LEVELS[number];
export type AutonomyLevel = typeof AUTONOMY_LEVELS[number];
export type KillSwitchLevel = typeof KILL_SWITCH_LEVELS[number];
export type HealthStatus = typeof HEALTH_STATUSES[number];
export type EvaluationType = typeof EVALUATION_TYPES[number];

// ─── Create Agent DTO ────────────────────────────────────────

export class CreateAgentDto {
  @ApiProperty({ description: 'Unique agent identifier (e.g. CP-01, EA-01)', example: 'CP-01' })
  @IsString()
  agentId!: string;

  @ApiProperty({ description: 'Human-readable agent name', example: 'Executive Orchestrator' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Semantic version', example: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'What this agent does' })
  @IsString()
  purpose!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Named human role responsible for this agent', example: 'COO / PMO' })
  @IsString()
  humanOwner!: string;

  @ApiProperty({ enum: AGENT_CATEGORIES })
  @IsString()
  @IsIn([...AGENT_CATEGORIES])
  category!: AgentCategory;

  @ApiPropertyOptional({ enum: EXECUTION_TIERS, default: 'T2' })
  @IsOptional()
  @IsString()
  @IsIn([...EXECUTION_TIERS])
  executionTier?: ExecutionTier;

  @ApiPropertyOptional({ enum: RISK_LEVELS, default: 'R1' })
  @IsOptional()
  @IsString()
  @IsIn([...RISK_LEVELS])
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ enum: AUTONOMY_LEVELS, default: 'A1' })
  @IsOptional()
  @IsString()
  @IsIn([...AUTONOMY_LEVELS])
  autonomyLevel?: AutonomyLevel;

  @ApiPropertyOptional({ enum: KILL_SWITCH_LEVELS, default: 'K0' })
  @IsOptional()
  @IsString()
  @IsIn([...KILL_SWITCH_LEVELS])
  killSwitchLevel?: KillSwitchLevel;

  @ApiPropertyOptional({ description: 'Tools this agent is allowed to use' })
  @IsOptional()
  @IsArray()
  allowedTools?: string[];

  @ApiPropertyOptional({ description: 'Actions this agent is denied from performing' })
  @IsOptional()
  @IsArray()
  deniedActions?: string[];

  @ApiPropertyOptional({ description: 'Actions that require explicit approval' })
  @IsOptional()
  @IsArray()
  approvalActions?: string[];

  @ApiPropertyOptional({ description: 'Data classification levels this agent can access' })
  @IsOptional()
  @IsArray()
  dataClasses?: string[];

  @ApiPropertyOptional({ description: 'Daily cost budget in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costBudgetDaily?: number;

  @ApiPropertyOptional({ description: 'Monthly cost budget in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costBudgetMonthly?: number;

  @ApiPropertyOptional({ description: 'Default model tier (e.g. claude-sonnet-4-20250514, gpt-4o-mini)' })
  @IsOptional()
  @IsString()
  modelTierDefault?: string;

  @ApiPropertyOptional({ description: 'Fallback model tier' })
  @IsOptional()
  @IsString()
  modelTierFallback?: string;

  @ApiPropertyOptional({ description: 'Quality thresholds (accuracy, confidence, escalation)' })
  @IsOptional()
  qualityThreshold?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Value KPIs this agent is measured against' })
  @IsOptional()
  valueKpis?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'SLA targets' })
  @IsOptional()
  slaTarget?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Queue/workflow IDs this agent serves' })
  @IsOptional()
  @IsArray()
  workflowIds?: string[];

  @ApiPropertyOptional({ description: 'Governing authority document references' })
  @IsOptional()
  @IsArray()
  authorityRefs?: string[];

  @ApiPropertyOptional({ description: 'Path or description of manual kill switch process' })
  @IsOptional()
  @IsString()
  killSwitchPath?: string;

  @ApiPropertyOptional({ description: 'Manual process to follow when agent is suspended' })
  @IsOptional()
  @IsString()
  fallbackProcess?: string;

  @ApiPropertyOptional({ description: 'Names of evaluation suites this agent must pass' })
  @IsOptional()
  @IsArray()
  evaluationSuite?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Update Agent DTO ────────────────────────────────────────

export class UpdateAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  humanOwner?: string;

  @ApiPropertyOptional({ enum: AGENT_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn([...AGENT_STATUSES])
  status?: AgentStatus;

  @ApiPropertyOptional({ enum: EXECUTION_TIERS })
  @IsOptional()
  @IsString()
  @IsIn([...EXECUTION_TIERS])
  executionTier?: ExecutionTier;

  @ApiPropertyOptional({ enum: RISK_LEVELS })
  @IsOptional()
  @IsString()
  @IsIn([...RISK_LEVELS])
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ enum: AUTONOMY_LEVELS })
  @IsOptional()
  @IsString()
  @IsIn([...AUTONOMY_LEVELS])
  autonomyLevel?: AutonomyLevel;

  @ApiPropertyOptional({ enum: KILL_SWITCH_LEVELS })
  @IsOptional()
  @IsString()
  @IsIn([...KILL_SWITCH_LEVELS])
  killSwitchLevel?: KillSwitchLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  allowedTools?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  deniedActions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  approvalActions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  dataClasses?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costBudgetDaily?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costBudgetMonthly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelTierDefault?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelTierFallback?: string;

  @ApiPropertyOptional()
  @IsOptional()
  qualityThreshold?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  valueKpis?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  slaTarget?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  workflowIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  authorityRefs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  killSwitchPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fallbackProcess?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  evaluationSuite?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Kill Switch DTO ─────────────────────────────────────────

export class KillSwitchDto {
  @ApiProperty({ description: 'Reason for kill switch activation' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: 'Who triggered the kill switch' })
  @IsString()
  triggeredBy!: string;

  @ApiPropertyOptional({ description: 'State snapshot for rollback' })
  @IsOptional()
  rollbackData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Evidence or description of the issue' })
  @IsOptional()
  @IsString()
  evidence?: string;
}

// ─── Evaluation DTO ──────────────────────────────────────────

export class RecordEvaluationDto {
  @ApiProperty({ enum: EVALUATION_TYPES })
  @IsString()
  @IsIn([...EVALUATION_TYPES])
  evaluationType!: EvaluationType;

  @ApiProperty({ description: 'Name of the test suite run' })
  @IsString()
  testSuite!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalTests!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  passed!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  failed!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  skipped?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  durationMs?: number;

  @ApiPropertyOptional({ description: 'Score 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  score?: number;

  @ApiPropertyOptional({ description: 'ci, staging, production' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  triggeredBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  failureDetails?: Record<string, unknown>[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Seed DTO ────────────────────────────────────────────────

export class SeedAgentsDto {
  @ApiPropertyOptional({ description: 'Agent category to seed (default: all)' })
  @IsOptional()
  @IsString()
  @IsIn([...AGENT_CATEGORIES])
  category?: AgentCategory;

  @ApiPropertyOptional({ description: 'Force overwrite existing agents' })
  @IsOptional()
  force?: boolean;
}
