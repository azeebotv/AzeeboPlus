import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ScanType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class EscalateCaseDto {
  @ApiProperty()
  @IsString()
  caseId!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class ScanContentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contentId?: string;

  @ApiProperty()
  @IsString()
  mediaUrl!: string;

  @ApiProperty({ enum: ScanType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(ScanType, { each: true })
  scanTypes?: ScanType[];
}
