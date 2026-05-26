import { Module } from '@nestjs/common';
import { FilmmakerController } from './filmmaker.controller';
import { FilmmakerService } from './filmmaker.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FilmmakerController],
  providers: [FilmmakerService],
  exports: [FilmmakerService],
})
export class FilmmakerModule {}
