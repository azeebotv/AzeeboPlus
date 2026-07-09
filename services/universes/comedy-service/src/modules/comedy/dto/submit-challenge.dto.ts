import { IsString, IsNotEmpty, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitChallengeDto {
  @ApiProperty({
    description: 'The ID of the comedy challenge to submit to',
    example: 'clg1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  challengeId!: string;

  @ApiProperty({
    description: 'URL of the comedy clip to submit',
    example: 'https://storage.azeebo.com/clips/comedy-clip-123.mp4',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  clipUrl!: string;
}
