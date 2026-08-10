import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ description: 'Whether the flag is enabled' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    description:
      'Variant/numeric payload — e.g. queue_dlq_retry_base_delay_ms in ms, ' +
      'queue_dlq_retry_max_passes as an integer',
    required: false,
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
}
