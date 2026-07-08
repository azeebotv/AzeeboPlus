import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCreatorDto {
  @ApiProperty({ description: 'Verification status' })
  @IsString()
  status!: string;

  @ApiProperty({ description: 'Optional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
