import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnableMfaDto {
  @IsString()
  code!: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  verifyOnly: boolean = false;
}
