import {
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  IsObject,
  IsBoolean,
  IsIn,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const CONSENT_CATEGORIES = ['analytics', 'marketing', 'personalization', 'third_party'] as const;
const EVENT_CATEGORIES = ['essential', ...CONSENT_CATEGORIES] as const;

export class AnalyticsEventDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timestamp?: string;

  /**
   * Consent category the client classified this event under. The server
   * re-checks the category against the batch consent state and defaults
   * unknown/unclassified events to 'analytics' (deny-by-default).
   */
  @ApiPropertyOptional({ enum: EVENT_CATEGORIES })
  @IsIn(EVENT_CATEGORIES)
  @IsOptional()
  category?: (typeof EVENT_CATEGORIES)[number];
}

export class ConsentStateDto {
  @ApiProperty()
  @IsBoolean()
  analytics!: boolean;

  @ApiProperty()
  @IsBoolean()
  marketing!: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  personalization?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  third_party?: boolean;
}

export class IngestEventsDto {
  @ApiProperty({ type: [AnalyticsEventDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events!: AnalyticsEventDto[];

  /** The sender's current consent state; events are filtered against it server-side. */
  @ApiPropertyOptional({ type: ConsentStateDto })
  @ValidateNested()
  @Type(() => ConsentStateDto)
  @IsOptional()
  consent?: ConsentStateDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  consentVersion?: string;
}

export class WebVitalDto {
  @ApiProperty({ example: 'LCP' })
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  value!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ enum: ['good', 'needs-improvement', 'poor'] })
  @IsIn(['good', 'needs-improvement', 'poor'])
  @IsOptional()
  rating?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  delta?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  navigationType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  page?: string;
}
