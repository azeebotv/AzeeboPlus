import { Module } from '@nestjs/common';
import { FilmmakerController } from './filmmaker.controller';
import { FilmmakerService } from './filmmaker.service';

@Module({
  controllers: [FilmmakerController],
  providers: [FilmmakerService],
  exports: [FilmmakerService],
})
export class FilmmakerModule {}
