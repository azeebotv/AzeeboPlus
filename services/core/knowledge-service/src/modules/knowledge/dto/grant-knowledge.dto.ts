import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrantKnowledgeDto {
  @ApiProperty({ description: 'User ID to grant knowledge to' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Knowledge unit ID to grant' })
  @IsString()
  @IsNotEmpty()
  knowledgeUnitId!: string;

  @ApiProperty({ description: 'Source of the grant', enum: ['checkpoint', 'purchase', 'admin', 'promo'] })
  @IsString()
  @IsNotEmpty()
  grantSource!: string;

  @ApiPropertyOptional({ description: 'Source ID (e.g. checkpoint ID, purchase ID)' })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Optional expiration date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Optional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
