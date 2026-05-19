import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePredictionDto {
  @ApiProperty()
  @IsString()
  fixtureId!: string;

  @ApiProperty()
  @IsString()
  prediction!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  stake?: number;
}

export class EnterContestDto {
  @ApiProperty()
  @IsString()
  contestId!: string;
}
