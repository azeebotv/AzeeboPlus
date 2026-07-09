import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPredictionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  prediction!: string;
}
