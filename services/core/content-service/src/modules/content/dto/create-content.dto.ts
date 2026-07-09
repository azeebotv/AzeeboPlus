import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';

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

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;
  @IsOptional()
  metadata?: Record<string, unknown>;
}
