import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great episode!' })
  @IsString()
  @MaxLength(1000)
  content!: string;
}

export class ShareShowDto {
  @ApiPropertyOptional({ example: 'twitter' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;
}
