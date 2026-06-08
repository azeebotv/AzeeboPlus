import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveModerationDto {
  @ApiProperty({ enum: ['resolved', 'dismissed', 'escalated'] })
  @IsString()
  resolution!: 'resolved' | 'dismissed' | 'escalated';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ModerationDecisionDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsString()
  decision!: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
