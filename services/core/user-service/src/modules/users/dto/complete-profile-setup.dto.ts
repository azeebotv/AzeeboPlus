import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
}

export enum AdminUserRole {
  USER = 'user',
  CREATOR = 'creator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export class CompleteProfileSetupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  displayName!: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'johndoe', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+234 801 234 5678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Lagos, Nigeria', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ example: 'Male', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'Content creator and enthusiast', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: ['comedy', 'movies', 'sports'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @ApiProperty({ example: 'user', enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
