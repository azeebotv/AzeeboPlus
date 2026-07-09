import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRelationshipDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
