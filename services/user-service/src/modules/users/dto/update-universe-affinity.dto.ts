import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateUniverseAffinityDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferences?: string[];
}
