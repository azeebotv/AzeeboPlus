import { Module } from '@nestjs/common';
import { CinemaPassController } from './cinema-pass.controller.js';
import { CinemaPassService } from './cinema-pass.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CinemaPassController],
  providers: [CinemaPassService],
  exports: [CinemaPassService],
})
export class CinemaPassModule {}
