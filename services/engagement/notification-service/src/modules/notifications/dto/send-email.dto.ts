import { IsEmail, IsObject, IsString } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  template!: string;

  @IsObject()
  data!: Record<string, unknown>;
}
