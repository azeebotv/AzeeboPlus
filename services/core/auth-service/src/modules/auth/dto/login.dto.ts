import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsValidEmail } from '@azeebo/validation';

export class LoginDto {
  @IsValidEmail()
  @IsEmail()
  email!: string;

  /**
   * Deliberately no length or strength rule: this is an authentication attempt,
   * not a registration. The password policy belongs to `RegisterDto`, and
   * enforcing it here rejected credentials the handler can verify — a legacy
   * or admin-created 6-character password (`CreateUserDto` allows 6) could
   * never reach `bcrypt.compare`, so the account was unusable and the bad
   * attempt never counted toward lockout. Wrong passwords must surface as a
   * 401 from the service, not a 422 from the pipe.
   */
  @IsString()
  @IsNotEmpty()
  password!: string;
}
