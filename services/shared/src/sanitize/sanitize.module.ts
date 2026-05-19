import { Module } from '@nestjs/common';
import { SanitizeInterceptor } from './sanitize.interceptor';

@Module({
  providers: [SanitizeInterceptor],
  exports: [SanitizeInterceptor],
})
export class SanitizeModule {}
