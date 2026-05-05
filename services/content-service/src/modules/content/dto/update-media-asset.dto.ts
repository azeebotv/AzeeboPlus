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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  @IsObject()
  @IsOptional()
  metadata?: any;
}
