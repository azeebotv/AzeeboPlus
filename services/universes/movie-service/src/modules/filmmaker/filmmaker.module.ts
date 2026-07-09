import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilmmakerController } from './filmmaker.controller';
import { FilmmakerService } from './filmmaker.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [FilmmakerController],
  providers: [FilmmakerService],
  exports: [FilmmakerService],
})
export class FilmmakerModule {}
