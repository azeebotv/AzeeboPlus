import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UniverseFlagKeyDto {
  @ApiProperty({ description: 'Universe ID' })
  @IsString()
  universeId!: string;

  @ApiProperty({ description: 'Feature flag key within the universe' })
  @IsString()
  featureKey!: string;
}

export class PruneStaleUniverseFlagsDto {
  @ApiPropertyOptional({
    description: 'Optional subset of flags to remove (the confirmed batch); flags not actually past staleAfter are still skipped',
    type: [UniverseFlagKeyDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniverseFlagKeyDto)
  keys?: Array<{ universeId: string; featureKey: string }>;
}
