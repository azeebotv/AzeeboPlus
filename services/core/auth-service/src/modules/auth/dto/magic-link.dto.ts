import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsValidEmail } from '@azeebo/validation';

export class RequestMagicLinkDto {
  @IsValidEmail()
  @IsEmail()
  email!: string;
}

export class VerifyMagicLinkDto {
  @IsString()
  @MinLength(16)
  token!: string;
}

export class VerifyMfaLoginDto {
  @IsString()
  @MinLength(16)
  challengeId!: string;

  @IsString()
  @MinLength(6)
  code!: string;
}
