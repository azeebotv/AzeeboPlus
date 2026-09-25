import { IsString, IsOptional, IsArray, IsNumber, IsIn, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Valid Enums ──────────────────────────────────────────────

export const WORK_CLASSES = ['H0', 'H1', 'A1', 'A2', 'S', 'X'] as const;
export const COMPLEXITY_TIERS = ['T0', 'T1', 'T2', 'T3', 'T4'] as const;
export const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const PROCESS_STEPS = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] as const;
export const REVERSIBILITY = ['reversible', 'bounded-reversible', 'irreversible'] as const;
export const DATA_SENSITIVITY = ['public', 'internal', 'confidential', 'restricted'] as const;
export const EXECUTION_STATUSES = [
  'routed',
  'in-progress',
  'completed',
  'failed',
  'eliminated',
] as const;
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type WorkClass = (typeof WORK_CLASSES)[number];
export type ComplexityTier = (typeof COMPLEXITY_TIERS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type ProcessStep = (typeof PROCESS_STEPS)[number];

// ─── Core Optimisation Hierarchy (AOS-MA-001 §5) ─────────────

export const HIERARCHY: Record<string, { choice: string; useWhen: string; costTier: number }> = {
  X: { choice: 'ELIMINATE', useWhen: 'The work has no continuing enterprise value', costTier: 0 },
  S: {
    choice: 'DETERMINISTIC SOFTWARE',
    useWhen: 'Rules can produce the right result without language reasoning',
    costTier: 1,
  },
  A2: {
    choice: 'LOW-COST AI',
    useWhen:
      'Classification, extraction, routing, drafting or summarisation benefits from language intelligence',
    costTier: 2,
  },
  A1: {
    choice: 'SPECIALIST REASONING',
    useWhen:
      'Complex financial, legal, technical, strategic or creative synthesis earns stronger reasoning cost',
    costTier: 3,
  },
  H1: {
    choice: 'HUMAN LED + AGENT',
    useWhen: 'Human owns outcome; agent prepares evidence/work',
    costTier: 4,
  },
  H0: {
    choice: 'HUMAN JUDGEMENT',
    useWhen:
      'Authority, ambiguity, relationships, ethics, material risk require accountable humans',
    costTier: 5,
  },
};

// ─── Process Mining Steps (AOS-MA-001 §4) ───────────────────

export const PROCESS_MINING_STEPS: Record<string, { question: string; output: string }> = {
  P0: {
    question: 'What actually happens today, including handoffs and workarounds?',
    output: 'Measured current-state workflow',
  },
  P1: {
    question: 'Which steps have no customer, control, revenue or decision value?',
    output: 'Elimination list',
  },
  P2: {
    question: 'Which approvals, forms or handoffs can be removed?',
    output: 'Simplified target workflow',
  },
  P3: {
    question: 'Can one template/rule replace variations?',
    output: 'Standard operating pattern',
  },
  P4: { question: 'Can deterministic rules execute it reliably?', output: 'Automation candidate' },
  P5: {
    question: 'Does language/reasoning materially improve execution?',
    output: 'Agent candidate',
  },
  P6: {
    question: 'Where must accountable judgement remain?',
    output: 'Approval/exception boundary',
  },
  P7: { question: 'Did time, cost, quality or risk improve?', output: 'Before/after evidence' },
};

// ─── Create Classification DTO ───────────────────────────────

export class CreateClassificationDto {
  @ApiProperty({ description: 'Unique task type identifier', example: 'invoice_generation' })
  @IsString()
  taskType!: string;

  @ApiProperty({ enum: WORK_CLASSES, description: 'Work classification tier' })
  @IsString()
  @IsIn([...WORK_CLASSES])
  workClass!: WorkClass;

  @ApiProperty({ description: 'Business domain', example: 'finance' })
  @IsString()
  domain!: string;

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'normal' })
  @IsOptional()
  @IsString()
  @IsIn([...PRIORITIES])
  priority?: Priority;

  @ApiProperty({ enum: COMPLEXITY_TIERS, description: 'Model complexity tier required' })
  @IsString()
  @IsIn([...COMPLEXITY_TIERS])
  complexityTier!: ComplexityTier;

  @ApiPropertyOptional({ description: 'Agent IDs that can execute this task' })
  @IsOptional()
  @IsArray()
  requiredAgents?: string[];

  @ApiPropertyOptional({ description: 'Approval roles required before execution' })
  @IsOptional()
  @IsArray()
  requiredApprovals?: string[];

  @ApiPropertyOptional({ description: 'SLA in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  slaHours?: number;

  @ApiPropertyOptional({ description: 'Estimated cost per execution in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCostUsd?: number;

  @ApiPropertyOptional({ enum: PROCESS_STEPS, description: 'Process mining step this task is at' })
  @IsOptional()
  @IsString()
  @IsIn([...PROCESS_STEPS])
  processStep?: ProcessStep;

  @ApiPropertyOptional({ description: 'Human process owner' })
  @IsOptional()
  @IsString()
  processOwner?: string;

  @ApiPropertyOptional({ description: 'Expected volume per week' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumePerWeek?: number;

  @ApiPropertyOptional({ description: 'Baseline human minutes per execution' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baselineMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Keywords for auto-classification matching' })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @ApiPropertyOptional({ description: 'Expected input patterns' })
  @IsOptional()
  @IsArray()
  inputPatterns?: string[];

  @ApiPropertyOptional({ description: 'Expected output patterns' })
  @IsOptional()
  @IsArray()
  outputPatterns?: string[];

  @ApiPropertyOptional({ description: 'Task types this depends on' })
  @IsOptional()
  @IsArray()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Events this task produces' })
  @IsOptional()
  @IsArray()
  triggersEvents?: string[];

  @ApiPropertyOptional({ enum: REVERSIBILITY, default: 'reversible' })
  @IsOptional()
  @IsString()
  @IsIn([...REVERSIBILITY])
  reversible?: string;

  @ApiPropertyOptional({ enum: DATA_SENSITIVITY, default: 'internal' })
  @IsOptional()
  @IsString()
  @IsIn([...DATA_SENSITIVITY])
  dataSensitivity?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  automationCandidate?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  eliminationCandidate?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Update Classification DTO ───────────────────────────────

export class UpdateClassificationDto {
  @ApiPropertyOptional({ enum: WORK_CLASSES })
  @IsOptional()
  @IsString()
  @IsIn([...WORK_CLASSES])
  workClass?: WorkClass;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsString()
  @IsIn([...PRIORITIES])
  priority?: Priority;

  @ApiPropertyOptional({ enum: COMPLEXITY_TIERS })
  @IsOptional()
  @IsString()
  @IsIn([...COMPLEXITY_TIERS])
  complexityTier?: ComplexityTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  requiredAgents?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  requiredApprovals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  slaHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCostUsd?: number;

  @ApiPropertyOptional({ enum: PROCESS_STEPS })
  @IsOptional()
  @IsString()
  @IsIn([...PROCESS_STEPS])
  processStep?: ProcessStep;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  processOwner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  volumePerWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baselineMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  dependencies?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  triggersEvents?: string[];

  @ApiPropertyOptional({ enum: REVERSIBILITY })
  @IsOptional()
  @IsString()
  @IsIn([...REVERSIBILITY])
  reversible?: string;

  @ApiPropertyOptional({ enum: DATA_SENSITIVITY })
  @IsOptional()
  @IsString()
  @IsIn([...DATA_SENSITIVITY])
  dataSensitivity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  automationCandidate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  eliminationCandidate?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Route Task DTO ──────────────────────────────────────────

export class RouteTaskDto {
  @ApiPropertyOptional({ description: 'External correlation ID for tracking' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Override the auto-classified work class' })
  @IsOptional()
  @IsString()
  @IsIn([...WORK_CLASSES])
  overrideWorkClass?: WorkClass;

  @ApiPropertyOptional({ description: 'Override the assigned agent' })
  @IsOptional()
  @IsString()
  overrideAgent?: string;

  @ApiPropertyOptional({ description: 'Override the assigned model' })
  @IsOptional()
  @IsString()
  overrideModel?: string;

  @ApiPropertyOptional({ description: 'Priority override' })
  @IsOptional()
  @IsString()
  @IsIn([...PRIORITIES])
  priorityOverride?: Priority;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Record Execution DTO ────────────────────────────────────

export class RecordExecutionDto {
  @ApiProperty()
  @IsString()
  taskType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ enum: EXECUTION_STATUSES })
  @IsString()
  @IsIn([...EXECUTION_STATUSES])
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedAgent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelTier?: string;

  @ApiPropertyOptional({ enum: APPROVAL_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn([...APPROVAL_STATUSES])
  approvalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  durationMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  success?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costUsd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokensUsed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  humanEscalated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  escalationReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outputReference?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Auto-Classify DTO ───────────────────────────────────────

export class AutoClassifyDto {
  @ApiProperty({ description: 'Task description or title to classify' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Domain hint' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Input data sample for pattern matching' })
  @IsOptional()
  inputSample?: string;
}

// ─── Seed DTO ────────────────────────────────────────────────

export class SeedClassificationsDto {
  @ApiPropertyOptional({ description: 'Domain to seed (default: all)' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: 'Force overwrite existing classifications' })
  @IsOptional()
  force?: boolean;
}
