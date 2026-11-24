import { IsIn, IsString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SocialAuthAuthorizeDto {
  /**
   * Where to send the user after a successful sign-in. Stored server-side in
   * the state record, never forwarded to the provider. The caller that follows
   * the redirect re-validates it against the panel allowlist.
   */
  @ApiPropertyOptional({ description: 'Post-login destination carried in the state record' })
  @IsOptional()
  @IsString()
  redirect?: string;

  /**
   * `json` keeps the pre-existing `{ state, authorizeUrl }` response for
   * non-browser callers (mobile/TV shells). Omitting it yields the `302` a
   * browser navigation needs. Constrained to the single literal, so any other
   * value is rejected by the pipe (422) rather than silently selecting a
   * response shape nobody has tested — a typo surfaces as an error instead of
   * a redirect the caller cannot consume.
   */
  @ApiPropertyOptional({ enum: ['json'], description: 'Return JSON instead of redirecting' })
  @IsOptional()
  @IsIn(['json'])
  format?: 'json';
}

export class SocialAuthCallbackDto {
  @ApiProperty({ description: 'State parameter for CSRF protection' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  /**
   * Required on a success callback, absent on a failure callback.
   *
   * Apple's `response_mode=form_post` sends `error` with **no** `code` when the
   * user cancels. A blanket `@IsNotEmpty` rejected that request during pipe
   * validation, so the cancellation never reached the handler's error branch —
   * the user got a 400 that looked like a malformed request rather than a
   * cancelled sign-in. `@ValidateIf` keeps the field mandatory for every
   * non-error callback, which is the case that must never be lenient.
   */
  @ApiPropertyOptional({
    description: 'Authorization code; omitted when the provider returns an error',
  })
  @ValidateIf((dto: SocialAuthCallbackDto) => !dto.error)
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({ description: 'Display name from OAuth provider' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'Error from OAuth provider' })
  @IsOptional()
  @IsString()
  error?: string;
}

export class SocialAuthAuthorizeResponseDto {
  @ApiProperty({ description: 'State parameter to include in callback' })
  state!: string;

  @ApiProperty({ description: 'OAuth authorization URL' })
  authorizeUrl!: string;
}
