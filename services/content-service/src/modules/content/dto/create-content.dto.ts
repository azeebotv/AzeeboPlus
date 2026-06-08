import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateContentDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  thumbnail!: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsUUID()
  universeId!: string;

  @IsString()
  @IsOptional()
  status?: string;
  @IsOptional()
  metadata?: Record<string, unknown>;
}
