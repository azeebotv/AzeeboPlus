import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

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
