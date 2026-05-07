import { IsString, IsOptional, IsObject, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChargebackDto {
  @ApiProperty()
  @IsString()
  ticketId: string;

  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class SubmitEvidenceDto {
  @ApiProperty()
  @IsObject()
  evidence: Record<string, unknown>;
}

export class ResolveChargebackDto {
  @ApiProperty({ enum: ['WON', 'LOST'] })
  @IsString()
  resolution: 'WON' | 'LOST';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}

export class ChargebackQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
