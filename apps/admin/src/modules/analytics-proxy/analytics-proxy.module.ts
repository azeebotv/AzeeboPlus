import { Module } from '@nestjs/common';
import { AnalyticsProxyController } from './analytics-proxy.controller';

@Module({
  controllers: [AnalyticsProxyController],
})
export class AnalyticsProxyModule {}
