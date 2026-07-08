import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PredictionMarketsController } from './prediction-markets.controller';
import { PredictionMarketsService } from './prediction-markets.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PredictionMarketsController],
  providers: [PredictionMarketsService],
  exports: [PredictionMarketsService],
})
export class PredictionMarketsModule {}
