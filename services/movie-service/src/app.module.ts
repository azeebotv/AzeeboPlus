import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { MoviesModule } from './modules/movies/movies.module';
import { CinemaPassModule } from './modules/cinema-pass/cinema-pass.module';
import { FilmmakerModule } from './modules/filmmaker/filmmaker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MoviesModule,
    CinemaPassModule,
    FilmmakerModule,
  ],
})
export class AppModule {}
