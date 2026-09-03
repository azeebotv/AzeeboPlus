import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePremiumUrlDto {
  @ApiProperty({ description: 'Content ID to generate premium URL for' })
  @IsString()
  contentId!: string;

  @ApiPropertyOptional({ description: 'URL expiry time in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  expiresInSeconds?: number;
}

export class ValidatePremiumUrlDto {
  @ApiProperty({ description: 'Premium URL token to validate' })
  @IsString()
  token!: string;
}

export class CdnPurgeDto {
  @ApiPropertyOptional({ description: 'CDN cache keys to purge' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  @ApiPropertyOptional({ description: 'CDN prefix to purge' })
  @IsOptional()
  @IsString()
  prefix?: string;
}

export class LifecycleCdnPurgeDto {
  @ApiProperty({ description: 'URLs to purge from CDN' })
  @IsArray()
  @IsString({ each: true })
  urls!: string[];

  @ApiPropertyOptional({ description: 'Patterns to purge' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  patterns?: string[];

  @ApiPropertyOptional({ description: 'CDN region' })
  @IsOptional()
  @IsString()
  region?: string;
}
