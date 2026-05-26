import { IsString, MinLength, MaxLength } from 'class-validator';
import { IsValidEmail, IsStrongPassword } from '@azeebo/validation';

export class RegisterDto {
  @IsValidEmail()
  email!: string;

  @IsStrongPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName!: string;
}
