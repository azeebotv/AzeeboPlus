import { IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ContentWindowType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  PREMIERE = 'premiere',
  FREE = 'free',
}

export class CreateContentDto {
  @ApiProperty({ description: 'Content title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Content description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Content thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Content media URL' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Universe ID' })
  @IsOptional()
  @IsString()
  universeId?: string;

  @ApiPropertyOptional({ description: 'Creator ID' })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ enum: ContentWindowType, default: ContentWindowType.STANDARD })
  @IsOptional()
  @IsEnum(ContentWindowType)
  windowType?: ContentWindowType;

  @ApiPropertyOptional({ description: 'Content tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Content categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Whether content is exclusive' })
  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;

  @ApiPropertyOptional({ description: 'Whether content is a premiere' })
  @IsOptional()
  @IsBoolean()
  isPremiere?: boolean;
}

export class UpdateContentDto {
  @ApiPropertyOptional({ description: 'Content title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Content description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Content thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Content media URL' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Universe ID' })
  @IsOptional()
  @IsString()
  universeId?: string;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ enum: ContentWindowType })
  @IsOptional()
  @IsEnum(ContentWindowType)
  windowType?: ContentWindowType;

  @ApiPropertyOptional({ description: 'Content tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Content categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Whether content is exclusive' })
  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;

  @ApiPropertyOptional({ description: 'Whether content is a premiere' })
  @IsOptional()
  @IsBoolean()
  isPremiere?: boolean;
}
