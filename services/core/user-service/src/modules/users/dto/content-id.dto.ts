import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContentIdDto {
  @ApiProperty({ description: 'Content ID' })
  @IsString()
  @Length(1, 100)
  contentId!: string;
}
