import { IsString, IsNotEmpty, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeUnitDto {
  @ApiProperty({ description: 'ID of the canonical event this unit relates to' })
  @IsString()
  @IsNotEmpty()
  canonicalEventId!: string;

  @ApiProperty({ description: 'Title of the knowledge unit' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Knowledge type',
    enum: ['fact', 'character', 'plot_point', 'location', 'timeline'],
  })
  @IsString()
  @IsIn(['fact', 'character', 'plot_point', 'location', 'timeline'])
  knowledgeType!: string;

  @ApiPropertyOptional({
    description: 'Spoiler level',
    enum: ['none', 'mild', 'major', 'severe'],
    default: 'none',
  })
  @IsString()
  @IsIn(['none', 'mild', 'major', 'severe'])
  @IsOptional()
  spoilerLevel?: string;

  @ApiPropertyOptional({ description: 'Optional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
