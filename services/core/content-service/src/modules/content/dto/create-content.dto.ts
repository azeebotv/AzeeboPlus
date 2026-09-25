import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsArray } from 'class-validator';

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

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
  type?: string;

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;
  @IsOptional()
  metadata?: Record<string, unknown>;
}
