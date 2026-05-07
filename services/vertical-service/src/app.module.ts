import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
})
export class AppModule {}
