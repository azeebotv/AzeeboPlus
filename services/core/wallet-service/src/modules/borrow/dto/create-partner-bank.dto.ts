import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Admin-authored lending partner. Money and rate fields are numbers with
 * bounded decimal places so what the admin panel stores is exactly what the
 * public Borrow page discloses.
 */
export class CreatePartnerBankDto {
  @ApiProperty({
    description: 'URL-safe identifier used in the public page',
    example: 'partner-bank-a',
  })
  @Matches(/^[a-z0-9][a-z0-9-]{1,63}$/, {
    message: 'slug must be lowercase letters, digits and hyphens (2-64 chars)',
  })
  slug!: string;

  @ApiProperty({ example: 'Partner Bank A' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Short-tenor personal advance' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  productName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_tld: true })
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Regulator licence/approval reference shown beside the offer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  licenceRef?: string;

  @ApiPropertyOptional({ description: 'Company registration number (RC)', example: 'RC 1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationNumber?: string;

  @ApiProperty({ example: 10000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  minAmount!: number;

  @ApiProperty({ example: 500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  maxAmount!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(360)
  minTenorMonths!: number;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(360)
  maxTenorMonths!: number;

  @ApiProperty({ description: 'Minimum annual percentage rate', example: 12 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1000)
  interestRateMin!: number;

  @ApiProperty({ description: 'Maximum annual percentage rate', example: 24 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1000)
  interestRateMax!: number;

  @ApiPropertyOptional({ description: 'Fees the borrower must see before applying' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feeDisclosure?: string;

  @ApiPropertyOptional({ description: 'Illustrative total repayment figure' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  totalCostExample?: string;

  @ApiPropertyOptional({ description: 'Who the partner will lend to' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  eligibility?: string;

  @ApiProperty({
    description: 'Partner-hosted application page — the only outbound CTA',
    example: 'https://apply.example.org/bank-a',
  })
  @IsUrl({ protocols: ['https'], require_tld: true })
  @MaxLength(500)
  applyUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_tld: true })
  @MaxLength(500)
  termsUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_tld: true })
  @MaxLength(500)
  privacyUrl?: string;

  @ApiPropertyOptional({ description: 'Sort position on the public page', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Marks dev/placeholder data; the public page labels these offers as samples',
  })
  @IsOptional()
  @IsBoolean()
  isSample?: boolean;
}
