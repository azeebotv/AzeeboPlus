import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from '@azeebo/shared-services';

import { ReferralController } from './referral.controller.js';
import { ReferralService } from './referral.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { DatabaseModule } from '../database/database.module.js';
import { AdminModule } from '../admin/admin.module.js';

@Module({
  imports: [DatabaseModule, PassportModule, JwtConfigModule, AdminModule],
  controllers: [ReferralController],
  providers: [ReferralService, JwtStrategy],
  exports: [ReferralService, DatabaseModule],
})
export class ReferralModule {}
