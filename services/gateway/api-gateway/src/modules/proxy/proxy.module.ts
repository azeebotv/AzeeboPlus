import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { FeatureFlagsController } from './feature-flags.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ProxyController, FeatureFlagsController],
})
export class ProxyModule {}
