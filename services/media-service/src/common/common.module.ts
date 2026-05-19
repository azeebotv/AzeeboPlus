import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { FileValidationService } from './services/file-validation.service';

@Module({
  providers: [RedisService, FileValidationService],
  exports: [RedisService, FileValidationService],
})
export class CommonModule {}
