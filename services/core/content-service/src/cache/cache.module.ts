import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheModule as SharedCacheModule } from '@azeebo/shared-services';

@Global()
@Module({
  imports: [SharedCacheModule],
  providers: [RedisService],
  exports: [RedisService, SharedCacheModule],
})
export class CacheModule {}
