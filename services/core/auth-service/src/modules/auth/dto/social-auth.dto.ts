import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SocialAuthAuthorizeDto {
  @ApiPropertyOptional({ description: 'Redirect URI after OAuth flow' })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class SocialAuthCallbackDto {
  @ApiProperty({ description: 'State parameter for CSRF protection' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ description: 'Authorization code from OAuth provider' })
  @IsString()
  @IsNotEmpty()
  code!: string;

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
