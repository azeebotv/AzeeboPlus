import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContentIdDto {
  @ApiProperty({ description: 'Content ID' })
  @IsString()
  contentId!: string;
}
