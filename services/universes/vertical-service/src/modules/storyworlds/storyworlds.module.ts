import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AgbalaTitlesService as TitlesService } from './agbala/titles.service';
import { AgbalaCharactersService as CharactersService } from './agbala/characters.service';
import { CacheService } from './agbala/cache.service';
import { SanitizationService } from './agbala/sanitization.service';
import { AgbalaAnalyticsService } from './agbala/analytics.service';
import { RoomService } from './agbala/room.service';
import { TheoryService } from './agbala/theory.service';
import { StoryworldsController } from './storyworlds.controller';

@Module({
  controllers: [StoryworldsController],
  providers: [
    PrismaService,
    CacheService,
    SanitizationService,
    AgbalaAnalyticsService,
    TitlesService,
    CharactersService,
    RoomService,
    TheoryService,
  ],
  exports: [
    CacheService,
    SanitizationService,
    AgbalaAnalyticsService,
    TitlesService,
    CharactersService,
    RoomService,
    TheoryService,
  ],
})
export class StoryworldsModule {}
