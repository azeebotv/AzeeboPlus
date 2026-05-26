import { IsEmail, IsString, MinLength } from 'class-validator';
import { IsValidEmail } from '@azeebo/validation';

export class LoginDto {
  @IsValidEmail()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
