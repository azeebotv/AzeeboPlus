import { IsString, IsOptional, IsObject, IsInt, Min, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTakedownDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  ticketId: string = '';

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  contentId: string = '';

  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  reason: string = '';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}

export class DecideTakedownDto {
  @ApiProperty({ enum: ['REMOVED', 'RESTORED', 'DISMISSED'] })
  @IsString()
  decision: 'REMOVED' | 'RESTORED' | 'DISMISSED' = 'REMOVED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TakedownQueryDto {
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
