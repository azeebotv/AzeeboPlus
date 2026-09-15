import { Module } from '@nestjs/common';
import { AdminLiveEventsProxyController } from './live-events-proxy.controller';

@Module({
  controllers: [AdminLiveEventsProxyController],
})
export class LiveEventsProxyModule {}
