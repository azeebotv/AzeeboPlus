import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { GamesModule } from './modules/games/games.module';
import { GameCatalogModule } from './modules/game-catalog/game-catalog.module';
import { TournamentModule } from './modules/tournament/tournament.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    GamesModule,
    GameCatalogModule,
    TournamentModule,
  ],
})
export class AppModule {}
