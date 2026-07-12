import {
  IsString,
  IsOptional,
  IsUrl,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateComedyClipDto } from './create-comedy-clip.dto.js';

export class UpdateComedyClipDto extends PartialType(CreateComedyClipDto) {
  @ApiPropertyOptional({
    description: 'Title of the comedy clip',
    example: 'Updated Comedy Clip Title',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the comedy clip',
    example: 'Updated description for the comedy clip',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'URL of the comedy clip video',
    example: 'https://storage.azeebo.com/clips/comedy-clip-456.mp4',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of the comedy clip thumbnail',
    example: 'https://storage.azeebo.com/thumbnails/comedy-thumb-456.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Duration of the clip in seconds',
    example: 90,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Tags for the comedy clip',
    example: ['standup', 'comedy', 'laughs'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
