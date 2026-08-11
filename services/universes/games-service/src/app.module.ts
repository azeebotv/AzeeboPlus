import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { GamesModule } from './modules/games/games.module.js';
import { GameCatalogModule } from './modules/game-catalog/game-catalog.module.js';
import { TournamentModule } from './modules/tournament/tournament.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResponseWrapperInterceptor, ResponseSanitizationInterceptor } from '@azeebo/logger';
import { AdminModule } from './modules/admin/admin.module.js';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';
import { CacheModule } from '@azeebo/shared-services';
import { FeatureFlagModule, gamesFlags } from '@azeebo/feature-flags';
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
    GamesModule,
    GameCatalogModule,
    TournamentModule,
    HealthModule,
    // Games toggles: tournament engine, AI trivia, and seasonal leaderboards
    // all default OFF until the features launch.
    FlagMetricsModule.register({ service: 'games-service' }),
    FeatureFlagModule.register({
      global: true,
      ...flagHooks('games-service'),
      defaultFlags: {
        [gamesFlags.tournamentsEnabled]: false,
        [gamesFlags.triviaAi]: false,
        [gamesFlags.leaderboardsSeasonal]: false,
      },
    }),
    AdminModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSanitizationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ServiceAuthGuard,
    },
  ],
})
export class AppModule {}
