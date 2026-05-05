import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UniverseController } from './universe.controller';
import { UniverseService } from './universe.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UniverseController],
  providers: [UniverseService],
})
export class UniverseModule {}