import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateStoryworldDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
