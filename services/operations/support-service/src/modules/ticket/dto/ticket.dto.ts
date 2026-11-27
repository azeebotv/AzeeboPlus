import { IsEnum, IsOptional, IsString, IsInt, IsNotEmpty, Min, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupportTicketCategory {
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',
  ACCOUNT_APPEAL = 'ACCOUNT_APPEAL',
  CONTENT_TAKEDOWN = 'CONTENT_TAKEDOWN',
  PAYOUT_DISPUTE = 'PAYOUT_DISPUTE',
  USER_SUSPENSION = 'USER_SUSPENSION',
  GENERAL = 'GENERAL',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_INFO = 'PENDING_INFO',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

/**
 * The mobile support screen offers human labels ('Account', 'Payment',
 * 'Content', 'Technical', 'Creator') while the API stores a routing enum. The
 * transform maps the label to the closest case type and falls back to GENERAL,
 * so a label the API has never heard of creates a triaged ticket instead of a
 * 400. Canonical enum values pass through untouched.
 */
const CATEGORY_ALIASES: Record<string, SupportTicketCategory> = {
  ACCOUNT: SupportTicketCategory.ACCOUNT_APPEAL,
  ACCOUNTS: SupportTicketCategory.ACCOUNT_APPEAL,
  SUSPENSION: SupportTicketCategory.USER_SUSPENSION,
  PAYMENT: SupportTicketCategory.REFUND,
  PAYMENTS: SupportTicketCategory.REFUND,
  BILLING: SupportTicketCategory.REFUND,
  REFUND: SupportTicketCategory.REFUND,
  REFUNDS: SupportTicketCategory.REFUND,
  CONTENT: SupportTicketCategory.CONTENT_TAKEDOWN,
  TAKEDOWN: SupportTicketCategory.CONTENT_TAKEDOWN,
  TECHNICAL: SupportTicketCategory.GENERAL,
  TECH: SupportTicketCategory.GENERAL,
  CREATOR: SupportTicketCategory.PAYOUT_DISPUTE,
  PAYOUT: SupportTicketCategory.PAYOUT_DISPUTE,
  OTHER: SupportTicketCategory.GENERAL,
};

const PRIORITY_ALIASES: Record<string, SupportTicketPriority> = {
  LOW: SupportTicketPriority.LOW,
  MEDIUM: SupportTicketPriority.MEDIUM,
  NORMAL: SupportTicketPriority.MEDIUM,
  HIGH: SupportTicketPriority.HIGH,
  URGENT: SupportTicketPriority.CRITICAL,
  CRITICAL: SupportTicketPriority.CRITICAL,
};

export function normalizeTicketCategory(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.trim().toUpperCase();
  if (!key) return value;
  if ((Object.values(SupportTicketCategory) as string[]).includes(key)) return key;
  return CATEGORY_ALIASES[key] ?? SupportTicketCategory.GENERAL;
}

export function normalizeTicketPriority(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.trim().toUpperCase();
  if (!key) return value;
  return PRIORITY_ALIASES[key] ?? SupportTicketPriority.MEDIUM;
}

export class CreateTicketDto {
  @ApiProperty({ enum: SupportTicketCategory })
  @Transform(({ value }) => normalizeTicketCategory(value))
  @IsEnum(SupportTicketCategory)
  category: SupportTicketCategory = SupportTicketCategory.REFUND;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string = '';

  /**
   * Required only when no `message` is supplied: the mobile client sends
   * `message`, the admin/web surfaces send `description`. Requiring only the
   * latter rejected every ticket created from the app.
   */
  @ApiPropertyOptional()
  @ValidateIf((dto: CreateTicketDto) => !dto.message)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateTicketDto) => !dto.description)
  @IsString()
  @IsNotEmpty()
  message?: string;

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @Transform(({ value }) => normalizeTicketPriority(value))
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class AddMessageDto {
  @ApiProperty()
  @IsString()
  message: string = '';

  @ApiPropertyOptional()
  @IsOptional()
  isInternal?: boolean;
}

export class AssignTicketDto {
  @ApiProperty()
  @IsString()
  assignedTo: string = '';
}

export class TicketQueryDto {
  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional({ enum: SupportTicketCategory })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: SupportTicketStatus })
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus = SupportTicketStatus.OPEN;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
