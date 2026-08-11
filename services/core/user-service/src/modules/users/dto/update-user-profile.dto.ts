import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'displayName must be at least 3 characters' })
  @MaxLength(50, { message: 'displayName must be at most 50 characters' })
  displayName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'avatar must be a valid URL' })
  avatar?: string;

  // user_profile_v2 fields — only persisted while the flag is on.
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'bio must be at most 500 characters' })
  bio?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'location must be at most 100 characters' })
  location?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
