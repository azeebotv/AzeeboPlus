import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
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
  /**
   * `creator` subsumes the viewer role — nothing on the platform gates a
   * capability behind `role === 'user'` — so the retired `both` spelling always
   * meant `creator`. It is mapped rather than rejected because mobile builds
   * already installed send it and cannot be updated from this repo.
   */
  @Transform(({ value }: { value: unknown }) => (value === 'both' ? SelectableRole.CREATOR : value))
  @ApiProperty({
    enum: SelectableRole,
    example: 'user',
    description: 'Self-selectable role. `creator` includes all viewer privileges.',
  })
  @IsEnum(SelectableRole, {
    message: 'role must be one of: user, creator (creator already includes viewer access)',
  })
  role!: SelectableRole;
}
