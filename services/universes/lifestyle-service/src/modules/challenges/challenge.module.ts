import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';

import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtConfigModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService],
  exports: [ChallengeService],
})
export class ChallengeModule {}
