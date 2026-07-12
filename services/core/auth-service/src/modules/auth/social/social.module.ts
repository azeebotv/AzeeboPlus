import { Module } from '@nestjs/common';

import { AuthModule } from '../auth.module.js';
import { SocialAuthController } from './social.controller.js';
import { SocialAuthService } from './social.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
  exports: [SocialAuthService],
})
export class SocialAuthModule {}
