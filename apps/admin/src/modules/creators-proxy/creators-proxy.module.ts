import { Module } from '@nestjs/common';
import { CreatorsProxyController } from './creators-proxy.controller';

@Module({
  controllers: [CreatorsProxyController],
})
export class CreatorsProxyModule {}
