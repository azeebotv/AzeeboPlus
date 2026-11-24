import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ description: 'Whether the flag is enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Variant/numeric payload — e.g. queue_dlq_retry_base_delay_ms in ms, ' +
      'queue_dlq_retry_max_passes as an integer',
  })
  @IsOptional()
  value?: string | number | boolean | null;

  @ApiPropertyOptional({ description: 'Human-readable description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Owning team or service (context)' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({
    description:
      'Percentage rollout for boolean flags (0–100). 100 = everyone; a lower ' +
      'value serves the flag to a stable hash-derived bucket of users.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @ApiPropertyOptional({
    description: 'User IDs that always receive the flag, regardless of rollout',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'ISO date after which the flag is considered stale (removal candidate)',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsString()
  staleAfter?: string;
}
