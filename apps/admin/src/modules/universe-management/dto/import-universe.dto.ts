import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImportUniverseFeatureFlagDto {
  @ApiProperty({ description: 'Feature flag key' })
  @IsString()
  featureKey!: string;

  @ApiProperty({ description: 'Whether the feature is enabled' })
  @IsBoolean()
  isEnabled!: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ImportUniverseDto {
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
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Feature flags to import',
    required: false,
    type: [ImportUniverseFeatureFlagDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportUniverseFeatureFlagDto)
  featureFlags?: ImportUniverseFeatureFlagDto[];
}

export class ImportUniversesBodyDto {
  @ApiProperty({ description: 'Array of universes to import', type: [ImportUniverseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportUniverseDto)
  universes!: ImportUniverseDto[];
}
