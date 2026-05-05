import { Module } from '@nestjs/common';

import { AuthModule } from '../auth.module';
import { SocialAuthController } from './social.controller';
import { SocialAuthService } from './social.service';

@Module({
  imports: [AuthModule],
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
  exports: [SocialAuthService],
})
export class SocialAuthModule {}
