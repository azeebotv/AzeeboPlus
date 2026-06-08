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

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
