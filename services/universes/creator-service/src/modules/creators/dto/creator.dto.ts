import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatorDocumentDto {
  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsString()
  url!: string;
}

export class SubmitDocumentsDto {
  @ApiProperty({ type: [CreatorDocumentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatorDocumentDto)
  documents!: CreatorDocumentDto[];
}

export class UploadRequestDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  mimeType!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  size!: number;
}

export class LinkUploadDto {
  @ApiProperty()
  @IsString()
  uploadId!: string;

  @ApiProperty()
  @IsString()
  assetId!: string;
}

export class FundCreatorDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class UpdateTierDto {
  /**
   * Optional: `POST /creators/subscribe/:id` defaults a missing tier to 'free'
   * (`body.tier || 'free'`), and the web subscribe button sends no body at all.
   * Without `@IsOptional()` the pipe required the field and every such request
   * was a 400 before the default could apply.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tier?: string;
}

export class PublishContentDto {
  @ApiProperty()
  @IsString()
  contentUrl!: string;
}

export class NotificationSettingsDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}

export class PrivacySettingsDto {
  @ApiPropertyOptional({ default: 'public' })
  @IsOptional()
  @IsString()
  profileVisibility?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  showEarnings?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowMessages?: boolean;
}

export class UpdateCreatorSettingsDto {
  @ApiPropertyOptional({ type: NotificationSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiPropertyOptional({ type: PrivacySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacy?: PrivacySettingsDto;
}

export class CreateExclusiveContentDto {
  @ApiProperty({ description: 'Title of exclusive post' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Description or caption' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Media URL of exclusive video or asset' })
  @IsString()
  mediaUrl!: string;

  @ApiPropertyOptional({ default: 'gold', enum: ['bronze', 'silver', 'gold', 'platinum'] })
  @IsOptional()
  @IsString()
  minTier?: string;
}
