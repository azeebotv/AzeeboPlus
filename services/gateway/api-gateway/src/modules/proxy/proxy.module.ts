import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ProxyController],
})
export class ProxyModule {}
