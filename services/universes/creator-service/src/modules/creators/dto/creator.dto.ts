import { IsString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
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
}

export class UpdateTierDto {
  @ApiPropertyOptional()
  @IsString()
  tier?: string;
}

export class PublishContentDto {
  @ApiProperty()
  @IsString()
  contentUrl!: string;
}
