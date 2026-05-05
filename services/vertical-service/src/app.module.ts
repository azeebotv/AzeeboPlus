import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './modules/database/database.module';
import { UniverseModule } from './modules/universe/universe.module';
import { CharactersModule } from './modules/characters/characters.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    HealthModule,
    UniverseModule,
    CharactersModule,
    TimelineModule,
  ],
})
export class AppModule {}