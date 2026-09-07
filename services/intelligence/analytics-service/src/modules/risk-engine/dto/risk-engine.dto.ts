import { IsString, IsOptional, IsArray, IsNumber, IsIn, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Valid Enums ──────────────────────────────────────────────

export const RISK_LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4'] as const;
export const AUTONOMY_LEVELS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] as const;
export const REVERSIBILITY = ['reversible', 'bounded-reversible', 'irreversible'] as const;
export const DATA_SENSITIVITY = ['public', 'internal', 'confidential', 'restricted'] as const;
export const FINANCIAL_EXPOSURE = ['none', 'low', 'medium', 'high'] as const;
export const DECISIONS = ['ALLOW', 'ASK', 'DENY'] as const;
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'expired', 'revoked'] as const;
export const ASSESSMENT_OUTCOMES = ['completed', 'failed', 'escalated'] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];
export type Decision = (typeof DECISIONS)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

// ─── Risk Level Definitions (AOS-MA-001 §20) ─────────────────

export const RISK_DEFINITIONS: Record<
  string,
  { name: string; description: string; example: string }
> = {
  R0: {
    name: 'Negligible',
    description: 'No material risk — read/analyse actions',
    example: 'View dashboard, run report',
  },
  R1: {
    name: 'Low',
    description: 'Low risk — draft/propose actions with audit trail',
    example: 'Draft proposal, prepare report',
  },
  R2: {
    name: 'Medium',
    description: 'Moderate risk — internal metadata writes',
    example: 'Update CRM, modify schedule',
  },
  R3: {
    name: 'High',
    description: 'High risk — external/financial/rights actions',
    example: 'Send payment, grant rights, publish content',
  },
  R4: {
    name: 'Critical',
    description: 'Critical risk — irreversible/regulated actions',
    example: 'Delete data, transfer ownership, litigate',
  },
};

// ─── Autonomy Level Definitions (AOS-MA-001 §1) ─────────────

export const AUTONOMY_DEFINITIONS: Record<
  string,
  { name: string; description: string; agentMayDo: string; cannotDo: string }
> = {
  A0: {
    name: 'Human Only',
    description: 'Agent may analyse/draft only',
    agentMayDo: 'Analyse, draft, retrieve',
    cannotDo: 'Execute any action',
  },
  A1: {
    name: 'Human Approval',
    description: 'Agent prepares; human approves material step',
    agentMayDo: 'Prepare, draft, propose',
    cannotDo: 'Execute without approval',
  },
  A2: {
    name: 'Rule-Bound',
    description: 'Agent may act inside explicit policy and thresholds',
    agentMayDo: 'Execute within policy',
    cannotDo: 'Exceed thresholds',
  },
  A3: {
    name: 'Broad Autonomy',
    description: 'Agent may act with standard oversight',
    agentMayDo: 'Execute, notify, escalate',
    cannotDo: 'Modify policy',
  },
  A4: {
    name: 'High Autonomy',
    description: 'Agent may act with minimal oversight',
    agentMayDo: 'Execute, modify, optimise',
    cannotDo: 'Delete, transfer, legal',
  },
  A5: {
    name: 'Full Autonomy',
    description: 'Agent may act freely within domain',
    agentMayDo: 'Full domain control',
    cannotDo: 'Cross-domain, financial',
  },
};

// ─── Create Classification DTO ───────────────────────────────

export class CreateClassificationDto {
  @ApiProperty({ description: 'Unique action type identifier', example: 'payment_initiate' })
  @IsString()
  actionType!: string;

  @ApiProperty({ description: 'Business domain', example: 'finance' })
  @IsString()
  domain!: string;

  @ApiProperty({ enum: RISK_LEVELS, description: 'Risk level R0-R4' })
  @IsString()
  @IsIn([...RISK_LEVELS])
  riskLevel!: RiskLevel;

  @ApiProperty({ enum: AUTONOMY_LEVELS, description: 'Autonomy level A0-A5' })
  @IsString()
  @IsIn([...AUTONOMY_LEVELS])
  autonomyLevel!: AutonomyLevel;

  @ApiProperty({ enum: REVERSIBILITY })
  @IsString()
  @IsIn([...REVERSIBILITY])
  reversibility!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @ApiPropertyOptional({ description: 'Role required for approval' })
  @IsOptional()
  @IsString()
  approverRole?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  makerChecker?: boolean;

  @ApiPropertyOptional({ enum: DATA_SENSITIVITY, default: 'internal' })
  @IsOptional()
  @IsString()
  @IsIn([...DATA_SENSITIVITY])
  dataSensitivity?: string;

  @ApiPropertyOptional({ enum: FINANCIAL_EXPOSURE, default: 'none' })
  @IsOptional()
  @IsString()
  @IsIn([...FINANCIAL_EXPOSURE])
  financialExposure?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Reference to governing policy document' })
  @IsOptional()
  @IsString()
  policyRef?: string;

  @ApiPropertyOptional({ description: 'Max USD amount for auto-approval' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAutoApproveUsd?: number;

  @ApiPropertyOptional({ description: 'Risk level that triggers escalation' })
  @IsOptional()
  @IsString()
  escalationThreshold?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  requiredApproverCount?: number;

  @ApiPropertyOptional({ description: 'Cooldown in minutes between approvals for same user' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cooldownMinutes?: number;

  @ApiPropertyOptional({ description: 'Keywords for auto-classification' })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Update Classification DTO ───────────────────────────────

export class UpdateClassificationDto {
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

  @ApiPropertyOptional({ enum: REVERSIBILITY })
  @IsOptional()
  @IsString()
  @IsIn([...REVERSIBILITY])
  reversibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approverRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  makerChecker?: boolean;

  @ApiPropertyOptional({ enum: DATA_SENSITIVITY })
  @IsOptional()
  @IsString()
  @IsIn([...DATA_SENSITIVITY])
  dataSensitivity?: string;

  @ApiPropertyOptional({ enum: FINANCIAL_EXPOSURE })
  @IsOptional()
  @IsString()
  @IsIn([...FINANCIAL_EXPOSURE])
  financialExposure?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  policyRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAutoApproveUsd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escalationThreshold?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  requiredApproverCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  cooldownMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Assess Action DTO ───────────────────────────────────────

export class AssessActionDto {
  @ApiPropertyOptional({ description: 'Domain hint for default assessment' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'External correlation ID' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Context about what is being assessed' })
  @IsOptional()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Override the auto-assessed risk level' })
  @IsOptional()
  @IsString()
  @IsIn([...RISK_LEVELS])
  overrideRiskLevel?: RiskLevel;

  @ApiPropertyOptional({ description: 'Override the decision' })
  @IsOptional()
  @IsString()
  @IsIn([...DECISIONS])
  overrideDecision?: Decision;

  @ApiPropertyOptional({ description: 'Who is requesting this assessment' })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({ description: 'Estimated cost in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCostUsd?: number;
}

// ─── Request Approval DTO ────────────────────────────────────

export class RequestApprovalDto {
  @ApiProperty()
  @IsString()
  actionType!: string;

  @ApiProperty()
  @IsString()
  requestedBy!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Context about what needs approval' })
  @IsOptional()
  requestContext?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Auto-expire after this many minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInMinutes?: number;
}

// ─── Decide Approval DTO ─────────────────────────────────────

export class DecideApprovalDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @ApiProperty()
  @IsString()
  decidedBy!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// ─── Revoke Approval DTO ─────────────────────────────────────

export class RevokeApprovalDto {
  @ApiProperty()
  @IsString()
  revokedBy!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

// ─── Batch Assess DTO ────────────────────────────────────────

export class BatchAssessDto {
  @ApiProperty({ type: [AssessActionDto] })
  @IsArray()
  assessments!: {
    actionType: string;
    domain?: string;
    context?: Record<string, unknown>;
    correlationId?: string;
  }[];
}

// ─── Seed DTO ────────────────────────────────────────────────

export class SeedRiskClassificationsDto {
  @ApiPropertyOptional({ description: 'Domain to seed (default: all)' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Force overwrite existing classifications' })
  @IsOptional()
  force?: boolean;
}
