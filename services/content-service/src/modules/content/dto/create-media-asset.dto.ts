import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateMediaAssetDto {
  @IsString()
  originalUrl!: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  format!: string;

  @IsNumber()
  size!: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  @IsObject()
  @IsOptional()
  metadata?: any;
}
