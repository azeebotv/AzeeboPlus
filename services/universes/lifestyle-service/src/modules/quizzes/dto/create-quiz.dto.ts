import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
  @ApiProperty({ example: 'What is the capital of Nigeria?' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({ example: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'] })
  @IsArray()
  @IsString({ each: true })
  options!: string[];

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  correctAnswer!: string;

  @ApiPropertyOptional({ example: 'Abuja has been the capital since 1991.' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  points?: number;
}

export class CreateQuizDto {
  @ApiProperty({ example: 'Nigeria Geography Quiz' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Test your knowledge of Nigerian geography' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'geography' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ example: 300 })
  @IsNumber()
  @Min(30)
  @Max(3600)
  @IsOptional()
  timeLimit?: number;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'published'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ type: [QuizQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions!: QuizQuestionDto[];
}
