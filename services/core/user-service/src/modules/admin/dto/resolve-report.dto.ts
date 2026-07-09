import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveReportDto {
  @ApiProperty({ description: 'Resolution details' })
  @IsString()
  resolution!: string;
}
