import { Module } from '@nestjs/common';
import { SearchProxyController } from './search-proxy.controller';

@Module({
  controllers: [SearchProxyController],
})
export class SearchProxyModule {}
