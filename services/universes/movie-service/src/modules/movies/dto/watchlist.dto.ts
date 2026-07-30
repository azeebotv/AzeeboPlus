import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWatchlistDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  movieId!: string;
}
