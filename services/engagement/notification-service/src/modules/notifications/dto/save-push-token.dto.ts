import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class SavePushTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['ios', 'android', 'web'])
  deviceType!: string;
}
