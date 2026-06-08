import { Module } from '@nestjs/common';
import { CinemaPassController } from './cinema-pass.controller';
import { CinemaPassService } from './cinema-pass.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CinemaPassController],
  providers: [CinemaPassService],
  exports: [CinemaPassService],
})
export class CinemaPassModule {}
