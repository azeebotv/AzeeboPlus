import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: 'direct' | 'group';

  @ApiProperty({ isArray: true })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  participantIds!: string[];
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: 'text' | 'image' | 'file';
}

export class MarkAsReadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  messageId!: string;
}
