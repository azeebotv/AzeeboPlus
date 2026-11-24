import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { MoviesModule } from './modules/movies/movies.module.js';
import { CinemaPassModule } from './modules/cinema-pass/cinema-pass.module.js';
import { FilmmakerModule } from './modules/filmmaker/filmmaker.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { GenreModule } from './modules/genre/genre.module.js';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, movieFlags } from '@azeebo/feature-flags';
import { FlagMetricsModule, flagHooks } from '@azeebo/flag-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    RateLimiterModule.forRoot(),
    CacheModule,
    DatabaseModule,
    MoviesModule,
    CinemaPassModule,
    FilmmakerModule,
    HealthModule,
    AdminModule,
    GenreModule,
    // Movie kill-switches: rentals + premieres ON; CinemaPass and cross-device
    // watchlist sync OFF until launched.
    FlagMetricsModule.register({ service: 'movie-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('movie-service'),
      defaultFlags: {
        [movieFlags.rentalsEnabled]: true,
        [movieFlags.premieresEnabled]: true,
        [movieFlags.cinemaPass]: false,
        [movieFlags.watchlistSync]: false,
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
  ],
})
export class AppModule {}
