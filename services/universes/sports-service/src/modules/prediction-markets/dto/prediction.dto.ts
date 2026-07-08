import { IsString, IsNumber, Min, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePredictionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fixtureId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  selectedOption!: string;
}

export class SubmitPredictionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  predictionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  selectedOption!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  stake?: number;
}

export class ResolvePredictionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  predictionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  winningOption!: string;
}
