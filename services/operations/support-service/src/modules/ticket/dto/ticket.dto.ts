import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
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

export class CreateTicketDto {
  @ApiProperty({ enum: SupportTicketCategory })
  @IsEnum(SupportTicketCategory)
  category: SupportTicketCategory = SupportTicketCategory.REFUND;

  @ApiProperty()
  @IsString()
  subject: string = '';

  @ApiProperty()
  @IsString()
  description: string = '';

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
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
