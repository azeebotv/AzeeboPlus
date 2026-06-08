import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-123' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'verification-token-123' })
  @IsString()
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}
