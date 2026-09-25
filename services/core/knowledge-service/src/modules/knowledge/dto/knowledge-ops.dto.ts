import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupersedeEventDto {
  @ApiPropertyOptional({ description: 'Additional metadata for the superseded event' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateEquivalenceSetDto {
  @ApiProperty({ description: 'Machine-readable equivalence set code' })
  @IsString()
  setCode!: string;

  @ApiProperty({ description: 'Human-readable name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Knowledge unit IDs in this equivalence set', type: [String] })
  @IsArray()
  @IsString({ each: true })
  knowledgeUnitIds!: string[];
}
