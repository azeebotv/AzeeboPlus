import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PredictionMarketsController } from './prediction-markets.controller.js';
import { PredictionMarketsService } from './prediction-markets.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PredictionMarketsController],
  providers: [PredictionMarketsService],
  exports: [PredictionMarketsService],
})
export class PredictionMarketsModule {}
