import { Module } from '@nestjs/common';
import { GameCatalogController } from './game-catalog.controller';
import { GameCatalogService } from './game-catalog.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GameCatalogController],
  providers: [GameCatalogService],
  exports: [GameCatalogService],
})
export class GameCatalogModule {}
