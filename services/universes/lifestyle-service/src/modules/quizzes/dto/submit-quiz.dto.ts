import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitQuizDto {
  @ApiProperty({ example: { q1: 'a', q2: 'c' } })
  @IsObject()
  @IsNotEmpty()
  answers!: Record<string, string>;
}
