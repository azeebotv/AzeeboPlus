import { IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @Length(1, 2048)
  refreshToken!: string;
}
