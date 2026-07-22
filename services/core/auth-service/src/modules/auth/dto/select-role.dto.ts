import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/** Only user and creator roles are allowed for self-selection. Admin/super_admin/moderator must be assigned by admins. */
export enum SelectableRole {
  USER = 'user',
  CREATOR = 'creator',
}

export class SelectRoleDto {
  @ApiProperty({ enum: SelectableRole, example: 'user' })
  @IsEnum(SelectableRole)
  role!: SelectableRole;
}
