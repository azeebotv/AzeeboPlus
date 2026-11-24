import { IsString, IsNumber, Min, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumPayout?: number;

  @IsOptional()
  @IsObject()
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };

  @IsOptional()
  @IsObject()
  privacy?: {
    profileVisibility: string;
    showEarnings: boolean;
    allowMessages: boolean;
  };
}
