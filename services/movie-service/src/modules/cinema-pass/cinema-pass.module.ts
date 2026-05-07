import { Module } from '@nestjs/common';
import { CinemaPassController } from './cinema-pass.controller';
import { CinemaPassService } from './cinema-pass.service';

@Module({
  controllers: [CinemaPassController],
  providers: [CinemaPassService],
  exports: [CinemaPassService],
})
export class CinemaPassModule {}
