import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Admin CRUD DTOs for the lifestyle guides catalogs. The service runs a global
 * ValidationPipe with `whitelist` + `forbidNonWhitelisted`, so every accepted
 * field must be declared and decorated here — plain TypeScript types alone
 * would be stripped or rejected at runtime.
 */

const CATALOG_STATUSES = ['draft', 'published', 'archived'] as const;
const OFFER_STATUSES = ['active', 'expired', 'archived'] as const;

// ─── Itineraries ─────────────────────────────────────────────────────────────

export class CreateItineraryStopDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  duration!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  order!: number;
}

export class CreateItineraryDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  duration!: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ enum: CATALOG_STATUSES })
  @IsIn(CATALOG_STATUSES)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [CreateItineraryStopDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateItineraryStopDto)
  stops!: CreateItineraryStopDto[];
}

export class UpdateItineraryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ enum: CATALOG_STATUSES })
  @IsIn(CATALOG_STATUSES)
  @IsOptional()
  status?: string;

  /** When present, replaces the full stop list (delete + recreate in a tx). */
  @ApiPropertyOptional({ type: [CreateItineraryStopDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateItineraryStopDto)
  @IsOptional()
  stops?: CreateItineraryStopDto[];
}

// ─── Neighborhoods ───────────────────────────────────────────────────────────

export class CreateNeighborhoodPlaceDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rating!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateNeighborhoodDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ enum: CATALOG_STATUSES })
  @IsIn(CATALOG_STATUSES)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ type: [CreateNeighborhoodPlaceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNeighborhoodPlaceDto)
  @IsOptional()
  places?: CreateNeighborhoodPlaceDto[];
}

export class UpdateNeighborhoodDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ enum: CATALOG_STATUSES })
  @IsIn(CATALOG_STATUSES)
  @IsOptional()
  status?: string;

  /** When present, replaces the full place list (delete + recreate in a tx). */
  @ApiPropertyOptional({ type: [CreateNeighborhoodPlaceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNeighborhoodPlaceDto)
  @IsOptional()
  places?: CreateNeighborhoodPlaceDto[];
}

// ─── Partners ────────────────────────────────────────────────────────────────

export class CreatePartnerDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: CATALOG_STATUSES })
  @IsIn(CATALOG_STATUSES)
  @IsOptional()
  status?: string;
}

export class UpdatePartnerDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: CATALOG_STATUSES })
  @IsIn(CATALOG_STATUSES)
  @IsOptional()
  status?: string;
}

// ─── Offers ──────────────────────────────────────────────────────────────────

export class CreatePartnerOfferDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  discount!: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  terms!: string[];

  @ApiProperty({ format: 'date-time' })
  @IsString()
  validUntil!: string;

  @ApiPropertyOptional({ enum: OFFER_STATUSES })
  @IsIn(OFFER_STATUSES)
  @IsOptional()
  status?: string;
}

export class UpdatePartnerOfferDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  discount?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  terms?: string[];

  @ApiPropertyOptional({ format: 'date-time' })
  @IsString()
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional({ enum: OFFER_STATUSES })
  @IsIn(OFFER_STATUSES)
  @IsOptional()
  status?: string;
}
