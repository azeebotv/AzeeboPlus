import { IsArray, IsString, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsEventDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class IngestEventsDto {
  @ApiProperty({ type: [AnalyticsEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events!: AnalyticsEventDto[];
}
