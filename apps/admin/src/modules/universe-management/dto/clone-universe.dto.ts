import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloneUniverseDto {
  @ApiProperty({ description: 'New unique name identifier for the cloned universe' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'New display name for the cloned universe', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ description: 'Copy feature flags from the source universe', default: true })
  @IsOptional()
  @IsBoolean()
  copyFeatureFlags?: boolean;

  @ApiProperty({ description: 'Whether the cloned universe is enabled', default: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ description: 'Override metadata for the cloned universe', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
