import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export class SelectRoleDto {
  @ApiProperty({ enum: UserRole, example: 'user' })
  @IsEnum(UserRole)
  role!: UserRole;
}
