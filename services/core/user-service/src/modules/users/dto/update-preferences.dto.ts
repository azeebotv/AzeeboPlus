import {
  IsBoolean,
  IsObject,
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationPreferences {
  @IsBoolean()
  @IsOptional()
  push?: boolean;

  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  sms?: boolean;
}

export class UpdatePreferencesDto {
  @IsBoolean()
  @IsOptional()
  darkMode?: boolean;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferences)
  notifications?: NotificationPreferences;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contentPreferences?: string[];

  @IsString()
  @IsOptional()
  language?: string;
}
