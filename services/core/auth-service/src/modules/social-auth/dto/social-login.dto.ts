import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export class SocialLoginDto {
  @ApiProperty({ enum: SocialProvider, description: 'Social provider' })
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @ApiProperty({ description: 'OAuth access token' })
  @IsString()
  accessToken!: string;

  @ApiProperty({ description: 'ID token (for Apple)', required: false })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiProperty({ description: 'Authorization code', required: false })
  @IsOptional()
  @IsString()
  authorizationCode?: string;
}

export class SocialAuthorizeDto {
  @ApiProperty({ enum: SocialProvider, description: 'Social provider' })
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @ApiProperty({ description: 'Redirect URI' })
  @IsString()
  redirectUri!: string;
}

export class SocialCallbackDto {
  @ApiProperty({ description: 'Authorization code' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'State parameter' })
  @IsString()
  state!: string;
}
