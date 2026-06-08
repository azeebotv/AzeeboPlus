import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class UpdateMediaAssetDto {
  @IsString()
  @IsOptional()
  originalUrl?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  format?: string;

  @IsNumber()
  @IsOptional()
  size?: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
