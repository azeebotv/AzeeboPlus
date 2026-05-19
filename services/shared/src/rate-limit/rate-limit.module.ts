import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RedisModule } from '../redis/redis.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [RedisModule, AuditModule],
  providers: [RateLimitService, RateLimitInterceptor],
  exports: [RateLimitService, RateLimitInterceptor],
})
export class RateLimitModule {}
