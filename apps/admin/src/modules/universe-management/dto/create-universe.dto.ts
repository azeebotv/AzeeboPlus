import { IsString, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUniverseDto {
  @ApiProperty({ description: 'Unique name identifier for the universe' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Display name for the universe' })
  @IsString()
  displayName!: string;

  @ApiProperty({ description: 'Description of the universe', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Icon identifier', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: 'Color code', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: 'Whether the universe is enabled', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
