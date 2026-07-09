import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ProxyController } from './proxy.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule, PassportModule],
  controllers: [ProxyController],
})
export class ProxyModule {}
