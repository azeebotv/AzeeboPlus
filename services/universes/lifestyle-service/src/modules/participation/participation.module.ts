import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { ParticipationController } from './participation.controller';
import { ParticipationService } from './participation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [ParticipationController],
  providers: [ParticipationService],
  exports: [ParticipationService],
})
export class ParticipationModule {}
