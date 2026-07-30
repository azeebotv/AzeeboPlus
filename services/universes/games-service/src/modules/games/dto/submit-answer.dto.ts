import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Answer to submit' })
  @IsString()
  @Length(1, 100)
  answer!: string;
}
