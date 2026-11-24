import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitChallengeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  contentId?: string;
}
