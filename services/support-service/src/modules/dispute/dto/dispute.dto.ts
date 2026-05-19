import { IsString, IsOptional, IsObject, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  ticketId: string = '';

  @ApiProperty()
  @IsString()
  payoutId: string = '';

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  amount: number = 0;

  @ApiProperty()
  @IsString()
  reason: string = '';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'PARTIAL'] })
  @IsString()
  resolution: 'APPROVED' | 'REJECTED' | 'PARTIAL' = 'APPROVED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  compensation?: number;
}

export class DisputeQueryDto {
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
