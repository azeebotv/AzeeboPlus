import { IsString, IsOptional } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  status?: string;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  @IsOptional()
  metadata?: any;
}
