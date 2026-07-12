import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilmmakerController } from './filmmaker.controller.js';
import { FilmmakerService } from './filmmaker.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [FilmmakerController],
  providers: [FilmmakerService],
  exports: [FilmmakerService],
})
export class FilmmakerModule {}
