import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['video', 'audio', 'document'])
  type: string = 'video';

  @IsOptional()
  @IsString()
  universe?: string;

  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;
}
