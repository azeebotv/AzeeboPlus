import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum CharacterPath {
  WARRIOR = 'warrior',
  SAGE = 'sage',
  TRICKSTER = 'trickster',
  HEALER = 'healer',
}

export class CreateCharacterDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsEnum(CharacterPath)
  path!: CharacterPath;

  @IsOptional()
  @IsString()
  backstory?: string;
}
