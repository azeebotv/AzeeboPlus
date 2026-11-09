import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

/**
 * Body of the legacy combined endpoint `POST /auth/social/login`.
 *
 * It lives beside the route table now: the endpoint used to be served by a
 * second `SocialAuthController` bound to the same prefix from another module,
 * with its own service and its own (unverified) Apple token handling.
 */
export class SocialLoginDto {
  @ApiProperty({ enum: SocialProvider, description: 'Social provider' })
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  /**
   * Google's OAuth access token, verified against Google's tokeninfo endpoint —
   * for Google it is the only credential the service reads, so it stays
   * mandatory there.
   *
   * It must **not** be mandatory for Apple. Apple's native flow hands the client
   * an identity token and an authorization code and never an access token, so an
   * unconditional `@IsString()` rejected every Apple sign-in with a 422 before
   * the verifier could run. `@ValidateIf` keeps the field required exactly
   * where the service uses it.
   */
  @ApiPropertyOptional({ description: 'OAuth access token (Google only)' })
  @ValidateIf((dto: SocialLoginDto) => dto.provider === SocialProvider.GOOGLE)
  @IsString()
  @IsNotEmpty()
  accessToken?: string;

  /** The Apple credential: the JWT Apple signs for the signed-in user. */
  @ApiPropertyOptional({ description: 'Identity token (Apple only)' })
  @ValidateIf((dto: SocialLoginDto) => dto.provider === SocialProvider.APPLE)
  @IsString()
  @IsNotEmpty()
  idToken?: string;

  @ApiProperty({ description: 'Authorization code', required: false })
  @IsOptional()
  @IsString()
  authorizationCode?: string;
}
