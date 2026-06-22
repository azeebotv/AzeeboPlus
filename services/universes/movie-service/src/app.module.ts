import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { MoviesModule } from './modules/movies/movies.module';
import { CinemaPassModule } from './modules/cinema-pass/cinema-pass.module';
import { FilmmakerModule } from './modules/filmmaker/filmmaker.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule,
    DatabaseModule,
    MoviesModule,
    CinemaPassModule,
    FilmmakerModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
