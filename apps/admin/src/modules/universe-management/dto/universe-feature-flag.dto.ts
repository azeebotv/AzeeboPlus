import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UniverseFeatureFlagDto {
  @ApiProperty({ description: 'Feature flag key (e.g., voting_enabled, predictions_enabled)' })
  @IsString()
  featureKey!: string;

  @ApiProperty({ description: 'Whether the feature is enabled', default: true })
  @IsBoolean()
  isEnabled!: boolean;

  @ApiProperty({ description: 'Additional metadata for the feature flag', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
