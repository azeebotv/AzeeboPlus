import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Answer to submit' })
  @IsString()
  answer!: string;
}
