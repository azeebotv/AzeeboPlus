import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { PollController } from './poll.controller';
import { PollService } from './poll.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, JwtConfigModule],
  controllers: [PollController],
  providers: [PollService],
  exports: [PollService],
})
export class PollModule {}
