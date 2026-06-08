import { IsString, IsObject, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinContestDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsObject()
  entryData!: Record<string, unknown>;
}

export class SubmitContestScoreDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsNumber()
  score!: number;
}
