import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWatchlistDto {
  @ApiProperty()
  @IsString()
  movieId!: string;
}
