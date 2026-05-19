import { IsString, IsObject, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePredictionDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  fixtureId!: string;

  @ApiProperty()
  @IsString()
  selectedOption!: string;
}

export class SubmitPredictionDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  predictionId!: string;

  @ApiProperty()
  @IsString()
  selectedOption!: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  stake?: number;
}

export class ResolvePredictionDto {
  @ApiProperty()
  @IsString()
  predictionId!: string;

  @ApiProperty()
  @IsString()
  winningOption!: string;
}
