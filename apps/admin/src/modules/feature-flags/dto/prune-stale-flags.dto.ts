import { IsArray, IsOptional, IsString, ArrayUnique } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PruneStaleFlagsDto {
  @ApiPropertyOptional({
    description:
      'Restrict pruning to these keys (must still be past their staleAfter). ' +
      'When omitted, every stale flag is pruned.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  keys?: string[];
}
