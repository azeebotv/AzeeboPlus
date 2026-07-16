import { Module } from '@nestjs/common';
import { RedisModule, RedisService } from '@azeebo/shared-services';
import { FileValidationService } from './services/file-validation.service';

@Module({
  imports: [RedisModule],
  providers: [FileValidationService],
  exports: [FileValidationService, RedisModule, RedisService],
})
export class CommonModule {}
