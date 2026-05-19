import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RateMovieDto {
  @ApiProperty()
  @IsString()
  movieId!: string;

  @ApiProperty()
  @IsString()
  rating!: string;
}
