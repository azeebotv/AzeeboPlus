import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComedyClipDto {
  @ApiProperty({
    description: 'Title of the comedy clip',
    example: 'Hilarious Stand-up Routine',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Description of the comedy clip',
    example: 'Watch this hilarious stand-up routine about everyday life',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'URL of the comedy clip video',
    example: 'https://storage.azeebo.com/clips/comedy-clip-123.mp4',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  videoUrl!: string;

  @ApiPropertyOptional({
    description: 'URL of the comedy clip thumbnail',
    example: 'https://storage.azeebo.com/thumbnails/comedy-thumb-123.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Duration of the clip in seconds',
    example: 60,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  durationSeconds!: number;

  @ApiPropertyOptional({
    description: 'Tags for the comedy clip',
    example: ['standup', 'humor', 'funny'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'ID of the comedian profile',
    example: 'clg9876543210',
  })
  @IsString()
  @IsOptional()
  comedianId?: string;

  @ApiPropertyOptional({
    description: 'ID of the comedy series this clip belongs to',
    example: 'clg5432109876',
  })
  @IsString()
  @IsOptional()
  seriesId?: string;
}
