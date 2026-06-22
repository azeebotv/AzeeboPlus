import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/database/database.module';
import { UniverseModule } from './modules/universe/universe.module';
import { CharactersModule } from './modules/characters/characters.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { HealthModule } from './modules/health/health.module';
import { TitlesModule } from './modules/titles/titles.module';
import { LoreModule } from './modules/lore/lore.module';
import { CrossoversModule } from './modules/crossovers/crossovers.module';
import { AdminModule } from './modules/admin/admin.module';
import { RateLimiterModule } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RateLimiterModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    HealthModule,
    UniverseModule,
    CharactersModule,
    TimelineModule,
    TitlesModule,
    LoreModule,
    CrossoversModule,
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
