import { Module } from '@nestjs/common';
import { GameCatalogController } from './game-catalog.controller.js';
import { GameCatalogService } from './game-catalog.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [GameCatalogController],
  providers: [GameCatalogService],
  exports: [GameCatalogService],
})
export class GameCatalogModule {}
