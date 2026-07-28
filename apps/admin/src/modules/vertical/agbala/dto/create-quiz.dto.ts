import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
  @IsString()
  question!: string;

  @IsArray()
  @IsString({ each: true })
  options!: string[];

  @IsNumber()
  @Min(0)
  correctAnswerIndex!: number;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  storyworldId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions!: QuizQuestionDto[];
}
