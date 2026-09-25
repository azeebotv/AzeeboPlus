import { IsOptional, IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  // Optional at the DTO layer: SPA cookie flows (admin/creator panels) POST an
  // empty body and rely on the httpOnly refresh_token cookie, which the
  // controller injects when the body omits the token.
  @IsOptional()
  @IsString()
  @Length(0, 2048)
  refreshToken?: string;
}
