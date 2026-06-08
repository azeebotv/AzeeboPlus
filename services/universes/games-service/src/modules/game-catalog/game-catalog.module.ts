import { Module } from '@nestjs/common';
import { GameCatalogController } from './game-catalog.controller';
import { GameCatalogService } from './game-catalog.service';

@Module({
  controllers: [GameCatalogController],
  providers: [GameCatalogService],
  exports: [GameCatalogService],
})
export class GameCatalogModule {}
