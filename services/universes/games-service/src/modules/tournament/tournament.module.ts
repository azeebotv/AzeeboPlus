import { Module } from '@nestjs/common';
import { TournamentController } from './tournament.controller.js';
import { TournamentService } from './tournament.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
