import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePathDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalSteps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdatePathDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalSteps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

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
  @IsUUID()
  storyworldId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions!: QuizQuestionDto[];
}

export class RejectTheoryDto {
  @IsString()
  reason!: string;
}
