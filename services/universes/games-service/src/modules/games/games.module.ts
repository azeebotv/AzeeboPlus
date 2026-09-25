import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { DatabaseModule } from '../database/database.module.js';
import { GameRealtimeService } from './game-realtime.service.js';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [GamesController],
  providers: [GamesService, GameRealtimeService],
  exports: [GamesService, GameRealtimeService, DatabaseModule],
})
export class GamesModule {}
